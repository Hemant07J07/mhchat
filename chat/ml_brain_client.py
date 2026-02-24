import json
import os
import socket
import urllib.request
import urllib.error
from typing import Any, Dict, Optional


def _build_reply(pred: Dict[str, Any]) -> str:
    crisis = bool(pred.get("crisis"))
    kb_hits = pred.get("kb_hits") or []
    if crisis:
        return (
            "I’m really sorry you’re going through this. Your safety matters most. "
            "If you’re in immediate danger, please call your local emergency number right now. "
            "If you can, reach out to someone you trust and don’t stay alone. "
            "Would you like help finding local crisis resources or connecting to a human?"
        )

    if not isinstance(kb_hits, list):
        kb_hits = []
    kb_hits = [str(h) for h in kb_hits if h]

    if not kb_hits:
        return "Thanks for sharing that. Can you tell me a little more about what’s been going on?"

    top = kb_hits[0]
    return f"{top}\n\nWould you like to try that now, or share more about what you’re feeling?"


def predict(message: str, timeout_s: float = 6.0) -> Optional[Dict[str, Any]]:
    """Call mhchat-ml /predict and return the parsed JSON dict, or None on failure."""
    base_url = os.environ.get("MHCHAT_ML_API_BASE", "http://127.0.0.1:8001").rstrip("/")
    url = f"{base_url}/predict"

    payload = json.dumps({"message": message}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            if isinstance(data, dict):
                # Attach a server-side reply (so caller can directly create bot msg)
                data.setdefault("reply", _build_reply(data))
                return data
    except (urllib.error.URLError, socket.timeout, ValueError):
        return None
    except Exception:
        return None
