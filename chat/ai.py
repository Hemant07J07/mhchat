# chat/ai.py
"""
Small wrapper for OpenAI (Responses + Embeddings) with safe fallbacks.
Uses new openai-python client (OpenAI()) and the Responses API if available.
"""

import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

try:
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    OPENAI_AVAILABLE = True
except Exception as exc:
    client = None
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI client not available: %s", exc)


def _system_prompt():
    return (
        "You are a compassionate, safety-first mental health assistant. "
        "Be brief and empathetic, validate feelings, offer one short coping suggestion "
        "and ask one open question. If the user is in immediate danger, instruct them "
        "to contact local emergency services and offer to provide human resources."
    )


def generate_prompt_from_history(history: List[dict], user_text: str) -> List:
    # Builds the 'input' structure for the Responses API. Keep it simple.
    # history: list of {"sender": "user"|"bot"|"system", "text": "..."}
    messages = [{"role": "system", "content": _system_prompt()}]
    for h in (history or [])[-6:]:
        role = "user" if h.get("sender") == "user" else "assistant"
        messages.append({"role": role, "content": h.get("text", "")})
    messages.append({"role": "user", "content": user_text})
    # Responses API accepts `input` as text or structured; we'll pass a plain text representation
    # concatenate for a small prompt
    joined = "\n\n".join(f"[{m['role']}] {m['content']}" for m in messages)
    return joined


def generate_bot_response_openai(user_text: str, history: Optional[List[dict]] = None, max_tokens:int=256) -> str:
    """
    Return a text reply using the OpenAI Responses API if available.
    Falls back to a simple canned response if not configured/available.
    """
    if not OPENAI_AVAILABLE or client is None:
        logger.info("OpenAI not configured; using fallback response.")
        return "Thanks for telling me. Can you say a little more about that, or would you like a coping suggestion?"

    prompt = generate_prompt_from_history(history or [], user_text)
    try:
        # Use Responses API (recommended)
        resp = client.responses.create(
            model=OPENAI_MODEL,
            input=prompt,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        # the SDK offers `response.output_text` (convenience) in many versions
        text = getattr(resp, "output_text", None)
        if not text:
            # fallback: try to extract from structure
            out = resp.get("output") or resp.get("choices")
            if isinstance(out, list) and out:
                # try a few common locations
                # new SDK variant: resp.output[0].content[0].text
                try:
                    text = out[0]["content"][0]["text"]
                except Exception:
                    text = str(out[0])
        if not text:
            return "Thanks for telling me. I'm having trouble right now — can you try again in a moment?"
        return text.strip()
    except Exception as exc:
        logger.exception("OpenAI call failed: %s", exc)
        return "Thanks for telling me. I'm having trouble right now — can you try again in a moment?"


def embed_text(text: str):
    """
    Return embedding vector or None. Uses OpenAI Embeddings API if available.
    """
    if not OPENAI_AVAILABLE or client is None:
        return None
    try:
        r = client.embeddings.create(model=EMBEDDING_MODEL, input=text)
        # shape depends on response, but usually: r.data[0].embedding
        data = r.get("data") or getattr(r, "data", [])
        if isinstance(data, list) and data:
            return data[0].get("embedding") or getattr(data[0], "embedding", None)
        return None
    except Exception as exc:
        logger.exception("Embedding call failed: %s", exc)
        return None
