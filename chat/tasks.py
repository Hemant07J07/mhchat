# chat/tasks.py
"""
Background tasks for MHChat (improved).

- Uses optional OpenAI wrapper (chat.ai) when available.
- Respects safety: if a user message is flagged (esp. high severity) we DO NOT call the LLM.
- Optional embeddings storage (MessageEmbedding model + ai.embed_text).
- Redis-backed simple window counter rate limiter for per-user LLM calls.
- Robust Channels broadcasting (non-fatal).
- Works with Celery (shared_task) or synchronously without Celery.
"""

import logging
import os
from typing import List, Optional

from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

# Celery availability
try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except Exception:
    CELERY_AVAILABLE = False

# Models & fallback NLU generator
from .models import Message, Conversation
from .nlp import analyze_message, safety_check, generate_bot_response as generate_bot_response_fallback

# Try to import AI wrapper (optional)
try:
    from .ai import generate_bot_response_openai, embed_text
    AI_AVAILABLE = True
except Exception:
    generate_bot_response_openai = None
    embed_text = None
    AI_AVAILABLE = False
    logger.info("chat.ai not available; using fallback generator.")

# Channels availability (optional)
try:
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer
    from .serializers import MessageSerializer
    CHANNELS_AVAILABLE = True
except Exception:
    CHANNELS_AVAILABLE = False

# Redis availability for rate-limiter (optional)
try:
    import redis
    REDIS_AVAILABLE = True
except Exception:
    redis = None
    REDIS_AVAILABLE = False

# Optional MessageEmbedding model (pgvector etc.)
MessageEmbedding = None
try:
    from .models import MessageEmbedding
except Exception:
    MessageEmbedding = None

# Config (env or Django settings)
REDIS_HOST = getattr(settings, "REDIS_HOST", os.environ.get("REDIS_HOST", "localhost"))
REDIS_PORT = int(getattr(settings, "REDIS_PORT", os.environ.get("REDIS_PORT", 6379)))
LLM_RATE_LIMIT = int(getattr(settings, "LLM_RATE_LIMIT", os.environ.get("LLM_RATE_LIMIT", 50)))
LLM_RATE_PERIOD = int(getattr(settings, "LLM_RATE_PERIOD", os.environ.get("LLM_RATE_PERIOD", 3600)))
USE_LLM = getattr(settings, "USE_LLM", True) and AI_AVAILABLE

# lazy redis client
_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not REDIS_AVAILABLE:
        return None
    try:
        _redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        _redis_client.ping()
        return _redis_client
    except Exception:
        logger.exception("Could not connect to Redis at %s:%s; rate-limiter disabled", REDIS_HOST, REDIS_PORT)
        _redis_client = None
        return None


def allow_user_llm_call(user_id: int, limit: int = LLM_RATE_LIMIT, period: int = LLM_RATE_PERIOD) -> bool:
    """
    Simple windowed counter using Redis. Returns True if call allowed.
    """
    r = _get_redis()
    if not r:
        logger.debug("Redis not available: allowing LLM call for user %s (no rate limiting)", user_id)
        return True
    key = f"llm_count:{user_id}"
    try:
        cur = r.get(key)
        if cur is None:
            # set to 1 with expire
            pipe = r.pipeline()
            pipe.set(key, 1, ex=period)
            pipe.execute()
            return True
        cur_val = int(cur)
        if cur_val >= limit:
            return False
        r.incr(key, 1)
        return True
    except Exception:
        logger.exception("Redis error while rate-limiting for user %s", user_id)
        return True


def _broadcast_message(message_obj: Message):
    """Broadcast a Message via Channels (non-fatal)."""
    if not CHANNELS_AVAILABLE:
        logger.debug("Channels not available; skipping broadcast for message id=%s", getattr(message_obj, "id", None))
        return
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("No channel layer available; skipping broadcast for message id=%s", getattr(message_obj, "id", None))
            return
        payload = MessageSerializer(message_obj).data
        async_to_sync(channel_layer.group_send)(
            f"conversation_{message_obj.conversation.id}",
            {"type": "chat_message", "message": payload},
        )
        logger.debug("Broadcasted message id=%s to group conversation_%s", message_obj.id, message_obj.conversation.id)
    except Exception:
        logger.exception("Failed to broadcast message id=%s", getattr(message_obj, "id", None))


def _maybe_store_embedding(message_obj: Message):
    """Compute and store embedding if embed_text + MessageEmbedding exist."""
    if embed_text is None or MessageEmbedding is None:
        return
    try:
        vec = embed_text(message_obj.text or "")
        if not vec:
            return
        MessageEmbedding.objects.update_or_create(message=message_obj, defaults={"vector": vec})
        logger.debug("Saved embedding for message id=%s", message_obj.id)
    except Exception:
        logger.exception("Failed to store embedding for message %s", getattr(message_obj, "id", None))


def _call_llm_safe(user_id: int, user_text: str, history: List[dict]) -> str:
    """
    Rate-limit and call LLM if available; fallback to local generator.
    """
    if not USE_LLM:
        logger.debug("LLM disabled or not available; using fallback generator.")
        return generate_bot_response_fallback(user_text, {})  # fallback signature in your repo

    allowed = allow_user_llm_call(user_id)
    if not allowed:
        logger.warning("LLM rate limit exceeded for user %s; using fallback.", user_id)
        return generate_bot_response_fallback(user_text, {})

    try:
        resp = generate_bot_response_openai(user_text, history=history)
        if not resp:
            logger.debug("LLM returned empty response; using fallback.")
            return generate_bot_response_fallback(user_text, {})
        return resp
    except Exception:
        logger.exception("LLM call failed; using fallback generator.")
        return generate_bot_response_fallback(user_text, {})


def _generate_bot_reply_and_create_message(msg: Message) -> Message:
    """
    Build short history, call LLM (via safe wrapper) or fallback, create bot Message,
    store optional embedding and broadcast. Returns created Message.
    """
    # history: last 8 messages (oldest->newest)
    history_qs = Message.objects.filter(conversation=msg.conversation).order_by("-created_at")[:8]
    history = [{"sender": m.sender, "text": (m.text or "")} for m in reversed(history_qs)]

    user_obj = getattr(getattr(msg, "conversation", None), "user", None)
    user_id = getattr(user_obj, "id", None) or 0

    bot_text = _call_llm_safe(user_id, msg.text or "", history)

    # create bot message
    bot_msg = Message.objects.create(conversation=msg.conversation, sender="bot", text=bot_text)

    # optional embedding for bot message
    try:
        _maybe_store_embedding(bot_msg)
    except Exception:
        # logged inside helper
        pass

    # broadcast (non-fatal)
    try:
        _broadcast_message(bot_msg)
    except Exception:
        logger.exception("Broadcast of bot message %s failed", getattr(bot_msg, "id", None))

    return bot_msg


def _handle_user_message_logic(message_id):
    """
    Core logic: analyze message, flag if needed, create system/bot reply,
    escalate if high severity. Returns dict result.
    """
    try:
        msg = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        logger.warning("handle_user_message: Message %s does not exist", message_id)
        return {"status": "missing", "message_id": message_id}

    if msg.sender != "user":
        logger.debug("Skipping non-user message %s (sender=%s)", message_id, msg.sender)
        return {"status": "skipped_non_user", "message_id": message_id}

    text = msg.text or ""

    # 1) NLU analysis
    try:
        nlp_meta = analyze_message(text)
    except Exception:
        logger.exception("NLU analysis failed for message %s", message_id)
        nlp_meta = {"intent": "unknown", "intent_confidence": 0.0, "entities": {}, "sentiment": {}}

    # 2) Safety
    try:
        flagged, severity = safety_check(text, nlp_meta)
    except Exception:
        logger.exception("safety_check failed for message %s", message_id)
        flagged, severity = False, "low"

    # 3) Update message metadata
    msg.nlp_metadata = nlp_meta
    msg.is_flagged = bool(flagged)
    try:
        msg.save(update_fields=["nlp_metadata", "is_flagged"])
    except Exception:
        logger.exception("Failed to save NLP metadata for message %s", message_id)

    # possibly embed the user message
    try:
        _maybe_store_embedding(msg)
    except Exception:
        pass

    # 4) If flagged: system message + escalation (do NOT call LLM)
    if flagged:
        sys_text = (
            "I’m sorry you’re feeling this way. If you are in immediate danger, please call your local emergency services now. "
            "If you'd like, we can provide resources or request a human to reach out."
        )
        try:
            sys_msg = Message.objects.create(conversation=msg.conversation, sender="system", text=sys_text)
            _broadcast_message(sys_msg)
        except Exception:
            logger.exception("Failed to create/broadcast system message for flagged message %s", message_id)

        if severity == "high":
            subject = f"[MHChat] High-severity flag (conv {msg.conversation.id})"
            body = (
                f"High severity message flagged.\n\n"
                f"Conversation ID: {msg.conversation.id}\n"
                f"User ID: {getattr(msg.conversation.user, 'id', 'N/A')}\n"
                f"Message ID: {msg.id}\n"
                f"Message text: {msg.text}\n"
                f"Detected metadata: {nlp_meta}\n"
                f"Time: {timezone.now().isoformat()}\n"
            )
            recipient_list = [a[1] for a in getattr(settings, "ADMINS", [])] or [getattr(settings, "DEFAULT_FROM_EMAIL", "admin@example.com")]
            try:
                send_mail(subject, body, getattr(settings, "DEFAULT_FROM_EMAIL", "mhchat@example.com"), recipient_list, fail_silently=False)
                logger.info("Escalation email sent for message %s to %s", message_id, recipient_list)
            except Exception:
                logger.exception("Failed to send escalation email for message %s", message_id)

        return {"status": "flagged", "severity": severity, "message_id": message_id}

    # 5) Not flagged -> generate bot reply via helper (handles LLM + fallback)
    try:
        bot_msg = _generate_bot_reply_and_create_message(msg)
        logger.info("Bot reply created for message %s -> bot_message_id=%s", message_id, bot_msg.id)
        return {"status": "ok", "message_id": message_id, "bot_message_id": bot_msg.id}
    except Exception as exc:
        logger.exception("Failed to create/broadcast bot message for user message %s", message_id)
        return {"status": "error", "message_id": message_id, "error": str(exc)}


# Expose handle_user_message for Celery or synchronous execution
if CELERY_AVAILABLE:

    @shared_task(bind=True)
    def handle_user_message(self, message_id):
        return _handle_user_message_logic(message_id)

else:

    def handle_user_message(message_id):
        return _handle_user_message_logic(message_id)
