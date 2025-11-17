# chat/ai.py
import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")  # change if you want another model
EMBEDDING_MODEL = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# Try to import the OpenAI package; support both pre-v1 and v1+ clients
try:
    import openai
    OPENAI_INSTALLED = True
except Exception:
    openai = None
    OPENAI_INSTALLED = False
    logger.info("openai package not installed; LLM functions will use fallback responses.")

# Detect new client (openai>=1.0) vs old (openai<1.0)
def _openai_client():
    """
    Returns:
      - new-style client instance (openai.OpenAI(...)) if available,
      - else the old 'openai' module (which exposes ChatCompletion.create),
      - or None if openai isn't installed.
    """
    if not OPENAI_INSTALLED:
        return None
    # new API exposes OpenAI class
    if hasattr(openai, "OpenAI"):
        try:
            # pass api_key explicitly for new client if available
            return openai.OpenAI(api_key=OPENAI_API_KEY)
        except Exception:
            # fallback to module if construction fails
            return openai
    # old API: module itself exposes ChatCompletion
    return openai

def _system_prompt():
    return (
        "You are a compassionate, safety-first mental health assistant. "
        "Respond briefly and empathetically, validate feelings, offer a short coping tip, "
        "and ask one open question. Never give medical/legal advice. "
        "If the user indicates imminent danger, instruct them to contact emergency services."
    )

def generate_prompt_from_history(history: List[dict], user_text: str) -> List[dict]:
    messages = [{"role": "system", "content": _system_prompt()}]
    for h in history[-6:]:
        role = "user" if h.get("sender") == "user" else "assistant"
        messages.append({"role": role, "content": h.get("text", "")})
    messages.append({"role": "user", "content": user_text})
    return messages

def generate_bot_response_openai(user_text: str, history: Optional[List[dict]] = None, max_tokens: int = 256) -> str:
    """
    Returns a string response. Uses new openai client if available, else falls back to NLP-based response.
    Always returns a sensible fallback string on failure or when OpenAI isn't configured.
    """
    history = history or []
    client = _openai_client()
    if client is None:
        logger.info("OpenAI client not available; using NLP-based fallback response.")
        # Import here to avoid circular imports
        from .nlp import generate_bot_response
        return generate_bot_response(user_text)

    messages = generate_prompt_from_history(history, user_text)

    try:
        # New client (openai>=1.0) path
        if hasattr(client, "chat") and hasattr(client.chat, "completions"):
            # new API: client.chat.completions.create(...)
            resp = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,
                frequency_penalty=0.5,
                presence_penalty=0.0,
            )
            # response shape: resp.choices[0].message.content (same as docs)
            choice = resp.choices[0]
            # Some versions expose message as dict-like; handle both
            content = None
            if hasattr(choice, "message"):
                # message object
                msg_obj = choice.message
                content = getattr(msg_obj, "content", None) or msg_obj.get("content") if isinstance(msg_obj, dict) else None
            else:
                # older style fallback
                content = getattr(choice, "text", None) or (choice.get("text") if isinstance(choice, dict) else None)
            if content:
                return content.strip()
            logger.debug("OpenAI new-client returned empty content; falling back.")
        else:
            # Old client path (openai<1.0): openai.ChatCompletion.create(...)
            # client here is the module 'openai'
            resp = client.ChatCompletion.create(
                model=OPENAI_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,
                frequency_penalty=0.5,
                presence_penalty=0.0,
            )
            # old response: resp['choices'][0]['message']['content']
            choice = resp["choices"][0]
            content = choice.get("message", {}).get("content") if isinstance(choice, dict) else None
            if content:
                return content.strip()
            logger.debug("OpenAI old-client returned empty content; falling back.")
    except Exception as exc:
        # Log full exception for debugging, but fall back to NLP-based response
        logger.exception("OpenAI call failed: %s", exc)
        # Use NLP-based response as fallback
        from .nlp import generate_bot_response
        return generate_bot_response(user_text)

    # Final fallback: use NLP
    from .nlp import generate_bot_response
    return generate_bot_response(user_text)

def embed_text(text: str):
    """
    Return embedding vector (list of floats) or None on failure.
    Supports both new and old openai clients.
    """
    client = _openai_client()
    if client is None:
        return None
    try:
        if hasattr(client, "embeddings") and hasattr(client.embeddings, "create"):
            # new client
            resp = client.embeddings.create(model=EMBEDDING_MODEL, input=text)
            # resp.data[0].embedding
            emb = resp.data[0].embedding
            return emb
        else:
            # old client
            resp = client.Embedding.create(model=EMBEDDING_MODEL, input=text)
            return resp["data"][0]["embedding"]
    except Exception:
        logger.exception("Embedding call failed")
        return None
