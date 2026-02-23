# chat/tasks.py
"""MHChat bot reply pipeline (no legacy LLM providers, no Celery).

Behavior:
- On each user message, we run local safety checks.
- If flagged -> create a system message and (optionally) email admins on high severity.
- If not flagged -> call mhchat-ml (/predict) to get KB hits + crisis flag and generate a safe reply.
- If mhchat-ml is unavailable -> fall back to the local rule-based generator.

This module is intentionally synchronous to avoid Celery/Redis dependencies.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import Message
from .nlp import analyze_message, safety_check, generate_bot_response as generate_bot_response_fallback
from .ml_brain_client import predict as ml_predict

logger = logging.getLogger(__name__)

# Channels availability (optional)
try:
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer
    from .serializers import MessageSerializer

    CHANNELS_AVAILABLE = True
except Exception:
    CHANNELS_AVAILABLE = False


def _broadcast_message(message_obj: Message):
    """
    Broadcast a single Message instance to its conversation group via Channels.
    Non-fatal: if Channels isn't available or broadcast fails, ignore (log) and continue.
    
    Uses single group name: conversation_<id> (must match consumer.group_name).
    """
    if not CHANNELS_AVAILABLE:
        logger.debug("Channels not available; skipping broadcast for message id=%s", getattr(message_obj, "id", None))
        return

    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("No channel layer available; skipping broadcast for message id=%s", getattr(message_obj, "id", None))
            return

        payload = MessageSerializer(message_obj).data
        group_name = f"conversation_{message_obj.conversation.id}"   # must match consumer.group_name
        
        try:
            async_to_sync(channel_layer.group_send)(
                group_name,
                {"type": "chat_message", "message": payload},
            )
            logger.info("Broadcasted message id=%s to group %s", message_obj.id, group_name)
        except Exception:
            logger.exception("Failed to send to group %s for message %s", group_name, getattr(message_obj, "id", None))
    except Exception:
        logger.exception("Failed to broadcast message id=%s", getattr(message_obj, "id", None))

def _generate_bot_reply_and_create_message(msg: Message) -> Message:
    """
    Build short history, call LLM (via safe wrapper) or fallback, create bot Message,
    store optional embedding and broadcast. Returns created Message.
    """
    user_text = msg.text or ""

    # Try mhchat-ml first
    pred = ml_predict(user_text)
    if pred and isinstance(pred, dict) and pred.get("reply"):
        bot_text = str(pred.get("reply"))
        # attach ML output as metadata to the USER message for traceability
        try:
            msg.nlp_metadata = {**(msg.nlp_metadata or {}), "ml": pred}
            msg.save(update_fields=["nlp_metadata"])
        except Exception:
            logger.exception("Failed to store ml metadata for message %s", getattr(msg, "id", None))
    else:
        bot_text = generate_bot_response_fallback(user_text, msg.nlp_metadata or {})

    # create bot message
    bot_msg = Message.objects.create(conversation=msg.conversation, sender="bot", text=bot_text)
    logger.info(f"Bot message created with ID: {bot_msg.id}")

    # broadcast (non-fatal) - wrapped in try/except for robustness
    try:
        _broadcast_message(bot_msg)
        logger.info("Successfully broadcasted bot message id=%s to conversation %s", bot_msg.id, msg.conversation.id)
    except Exception:
        logger.exception("Broadcast of bot message %s failed for conversation %s", getattr(bot_msg, "id", None), msg.conversation.id)

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


def handle_user_message(message_id):
    return _handle_user_message_logic(message_id)

