import json
import os
import socket
import time
import urllib.request
import urllib.error
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def _build_reply(pred: Dict[str, Any]) -> str:
    """
    Build a contextual reply based on prediction results.
    
    Args:
        pred: Dict with keys: intent, intent_score, crisis, kb_hits
    
    Returns:
        Conversational response string
    """
    crisis = bool(pred.get("crisis"))
    kb_hits = pred.get("kb_hits") or []
    intent = pred.get("intent", "casual_chat")
    intent_score = float(pred.get("intent_score", 0.0))
    
    # Crisis response - always prioritize safety
    if crisis:
        return (
            "I'm really sorry you're going through this. Your safety matters most. "
            "If you're in immediate danger, please call your local emergency number right now. "
            "Would you like help finding local crisis resources or connecting to a human?"
        )
    
    # Ensure kb_hits is a list of strings
    if not isinstance(kb_hits, list):
        kb_hits = []
    kb_hits = [str(h).strip() for h in kb_hits if h and str(h).strip()]
    
    # No KB hits retrieved (casual chat, low confidence, or no matching docs)
    if not kb_hits:
        if intent == "casual_chat" or intent_score < 0.5:
            # Casual conversation - use conversational response
            import random
            casual_responses = [
                "That's nice to hear! I'm here if you'd like to talk about how you're feeling.",
                "I appreciate you sharing that. Is there anything on your mind today?",
                "Thanks for the message! Feel free to tell me what's going on in your life.",
                "I'm listening. What's on your mind?",
                "That's great! Would you like to share how you've been doing lately?",
            ]
            return random.choice(casual_responses)
        else:
            # Mental health query but no relevant KB docs matched
            return (
                "I hear you. While I don't have specific resources for that right now, "
                "I'm here to listen. Can you tell me more about what you're experiencing?"
            )
    
    # KB hits available - build response with primary document
    top_hit = kb_hits[0]
    
    if intent == "mental_health_support" or intent_score >= 0.6:
        # Mental health support: introduce the resource and make it actionable
        return (
            f"{top_hit}\n\n"
            "Would you like to try that now, or share more about what you're feeling?"
        )
    else:
        # Low-confidence match: be gentle and contextual
        return (
            f"Here's something that might help:\n\n{top_hit}\n\n"
            "Feel free to ask if you'd like more ideas or want to talk more."
        )

def is_ml_service_healthy(timeout_s: float = 5.0) -> bool:
    """
    Check if ML service is responding (quick health check).
    
    Args:
        timeout_s: Timeout for health check request
    
    Returns:
        True if service is healthy, False otherwise
    """
    base_url = os.environ.get("MHCHAT_ML_API_BASE", "http://127.0.0.1:8001").rstrip("/")
    url = f"{base_url}/health"
    
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            if resp.status == 200:
                logger.debug("ML service health check passed")
                return True
    except (urllib.error.URLError, socket.timeout):
        pass
    except Exception as e:
        logger.debug(f"ML service health check failed: {type(e).__name__}")
    
    return False

def _fetch_context(conversation_id: Optional[int]) -> list:
    """Load recent messages for a conversation (best-effort)."""
    if not conversation_id:
        return []

    try:
        from .models import Message, Conversation
        conv = Conversation.objects.get(id=conversation_id)
        recent_msgs = Message.objects.filter(conversation=conv).order_by('-created_at')[:5]
        return [
            {"sender": msg.sender, "text": msg.text}
            for msg in reversed(recent_msgs)
        ]
    except Exception as e:
        logger.warning(f"Failed to fetch conversation context: {e}")
        return []


def _post_json(url: str, payload: dict, timeout_s: float) -> Optional[Dict[str, Any]]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        raw = resp.read().decode("utf-8")
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else None


def predict(message: str, conversation_id: int = None, timeout_s: float = 8.0) -> Optional[Dict[str, Any]]:
    """
    Call mhchat-ml /predict for intent + KB, then /chat for combined RAG response.

    Returns:
        Dict with intent, crisis, kb_hits, reply, summary, web_highlights, sources
        or None on failure.
    """
    base_url = os.environ.get("MHCHAT_ML_API_BASE", "http://127.0.0.1:8001").rstrip("/")
    predict_url = f"{base_url}/predict"
    chat_url = f"{base_url}/chat"

    # Quick health check for visibility, but do not skip prediction attempts.
    if not is_ml_service_healthy():
        logger.warning("ML service health check failed; attempting prediction anyway")

    context = _fetch_context(conversation_id)
    payload = {"message": message, "context": context}
    
    # Retry configuration: exponential backoff
    max_retries = 4
    base_delay_ms = 100
    max_delay_ms = 800
    
    for attempt in range(max_retries):
        try:
            pred = _post_json(predict_url, payload, timeout_s)
            if isinstance(pred, dict):
                pred.setdefault("reply", _build_reply(pred))
                fallback_hint = pred.get("reply", "")

                chat_payload = {**payload, "fallback_hint": fallback_hint}
                chat = _post_json(chat_url, chat_payload, timeout_s)
                if isinstance(chat, dict) and str(chat.get("reply", "")).strip():
                    merged = {**pred, **chat}
                    if attempt > 0:
                        logger.info(f"ML chat succeeded after {attempt} retries (message: {message[:50]}...)")
                    return merged

                return pred
                    
        except (urllib.error.URLError, socket.timeout) as e:
            # Transient error - try again
            if attempt < max_retries - 1:
                # Calculate exponential backoff: 100ms, 200ms, 400ms, ...
                delay_ms = min(base_delay_ms * (2 ** attempt), max_delay_ms)
                logger.warning(f"ML prediction failed (attempt {attempt + 1}/{max_retries}): {type(e).__name__}. Retrying in {delay_ms}ms...")
                time.sleep(delay_ms / 1000.0)
            else:
                logger.error(f"ML prediction failed after {max_retries} attempts (final error: {type(e).__name__})")
                
        except (ValueError, json.JSONDecodeError) as e:
            # Bad response - don't retry
            logger.error(f"ML prediction failed with invalid JSON response: {e}")
            return None
        except Exception as e:
            # Unexpected error - don't retry
            logger.exception(f"ML prediction failed with unexpected error: {e}")
            return None
    
    return None
