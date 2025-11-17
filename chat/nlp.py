# chat/nlp.py
"""
NLU helpers for MHChat (small, dependency-free).
- analyze_message(text) -> dict (intent, intent_confidence, entities, sentiment)
- safety_check(text, nlp_meta) -> (flagged: bool, severity: "low"|"medium"|"high")
- generate_bot_response(text, nlp_meta, conversation=None) -> str
"""

import re

_NEG_WORDS = {"sad","down","depressed","unhappy","hopeless","miserable","terrible","bad","alone","lonely","worthless"}
_POS_WORDS = {"good","happy","great","okay","fine","relieved","better","well","ok","better"}
_SUICIDAL_PATTERNS = [
    r"\bkill myself\b",
    r"\bi want to die\b",
    r"\bi'm going to kill myself\b",
    r"\bi want to end my life\b",
    r"\bsuicid(e|al)\b",
    r"\bend my life\b",
    r"\bnot worth living\b",
    r"\bhang myself\b",
    r"\boverdose\b"
]
_CRISIS_WORDS = {"suicide","die","kill myself","end my life","hang myself","overdose","not worth living"}

_GREETINGS = {"hello","hi","hey","good morning","good evening","good afternoon","hiya"}

_URGENCY_WORDS = {"now","today","immediately","right now","already","this minute","tonight","soon","plan","planned","going to","tomorrow"}

def _normalize(text):
    return (text or "").lower().strip()

def analyze_message(text):
    t = _normalize(text)
    words = re.findall(r"[a-z']+", t)
    neg = sum(1 for w in words if w in _NEG_WORDS)
    pos = sum(1 for w in words if w in _POS_WORDS)
    compound = 0.0
    if (pos + neg) > 0:
        compound = (pos - neg) / (pos + neg)

    sentiment = {"neg": float(neg), "pos": float(pos), "compound": float(compound)}

    # Default intent
    intent = "unknown"

    # greeting detection
    if any(g in t for g in _GREETINGS) and len(t.split()) <= 3:
        intent = "greeting"
    # help request
    elif any(w in t for w in ("help","cope","support","talk to someone","talk to a human")):
        intent = "help_request"
    elif any(w in t for w in ("thank", "thanks")):
        intent = "thanks"
    # suicidal phrases -> normalized to "suicidal" to match tests/expectations
    elif any(re.search(p, t) for p in _SUICIDAL_PATTERNS) or any(cris in t for cris in _CRISIS_WORDS):
        intent = "suicidal"
    elif compound > 0.2:
        intent = "positive"
    elif compound < -0.2:
        intent = "negative"

    intent_confidence = 0.7 if intent != "unknown" else 0.0

    entities = {}  # placeholder for future entity extraction

    return {
        "intent": intent,
        "intent_confidence": float(intent_confidence),
        "entities": entities,
        "sentiment": sentiment,
    }

def safety_check(text, nlp_meta=None):
    """
    Return (flagged: bool, severity: 'low'|'medium'|'high').
    High if explicit suicidal pattern + urgency words, or contains "kill myself" + "plan" etc.
    Medium if suicidal language without immediate urgency, or very negative sentiment + crisis words.
    """
    t = _normalize(text)
    flagged = False
    severity = "low"

    # direct suicidal patterns
    if any(re.search(p, t) for p in _SUICIDAL_PATTERNS):
        flagged = True
        # if urgency words present -> high
        if any(uw in t for uw in _URGENCY_WORDS):
            severity = "high"
        else:
            severity = "medium"

    # If not flagged by pattern, check crisis words + strongly negative sentiment
    if not flagged:
        if any(cris in t for cris in _CRISIS_WORDS):
            try:
                comp = float(nlp_meta.get("sentiment", {}).get("compound", 0.0)) if nlp_meta else 0.0
            except Exception:
                comp = 0.0
            if comp < -0.3:
                flagged = True
                severity = "medium"

    return bool(flagged), severity

def generate_bot_response(text, nlp_meta=None, conversation=None):
    meta = nlp_meta or analyze_message(text)
    intent = meta.get("intent", "unknown")
    comp = meta.get("sentiment", {}).get("compound", 0.0)

    # High-risk safety response
    if intent == "suicidal":
        return (
            "I'm genuinely concerned about what you've shared. Your safety is the priority. "
            "If you're in immediate danger, please reach out now:\n"
            "🚨 Call 988 (US Suicide & Crisis Lifeline) or text 'HELLO' to 741741\n"
            "🚨 Or contact emergency services (911) right away.\n\n"
            "You deserve professional support right now. Would you like me to help you find resources or someone to talk to?"
        )
    
    # User requesting professional help
    if intent == "help_request":
        return (
            "I'm here and I want to help you through this. Here are some ways we can work together:\n"
            "• Talk through what's troubling you\n"
            "• Learn a quick calming or grounding technique\n"
            "• Connect with a human counselor or crisis support\n\n"
            "What feels right for you right now?"
        )
    
    # Gratitude
    if intent == "thanks":
        return (
            "I'm really glad I could help. Remember, I'm here whenever you need someone to listen or talk things through. "
            "You're doing great by reaching out. Keep that strength going."
        )
    
    # Initial greeting
    if intent == "greeting":
        return (
            "Hello! I'm so glad you're here. This is a safe space for us to talk about what's on your mind. "
            "How are you feeling right now? I'm all ears."
        )
    
    # Very negative (compound ≤ -0.5)
    if comp <= -0.5:
        return (
            "I can sense you're really struggling right now, and I want you to know that's okay. "
            "When everything feels heavy like this, it helps to break things down. "
            "Tell me — what's the biggest weight on your shoulders right now? Let's tackle it together."
        )
    
    # Moderately negative (-0.2 to -0.5)
    if comp < -0.2:
        return (
            "It sounds like you're dealing with some tough feelings, and I appreciate you being honest about that. "
            "Those emotions are completely valid. "
            "Do you want to talk more about what's causing this, or would a quick mindfulness exercise help you feel a bit lighter?"
        )
    
    # Slightly negative or neutral (< 0)
    if comp < 0:
        return (
            "I hear you, and I'm listening. Whatever you're feeling right now is real and matters. "
            "Would it help to talk through it more, or would you like to try a grounding technique to create some space?"
        )
    
    # Positive (≥ 0.2)
    if comp >= 0.2:
        return (
            "That's wonderful to hear! I'm genuinely happy that you're experiencing some positive energy. "
            "What's been helping you feel better? Let's explore that — understanding what works can help you do more of it."
        )
    
    # Neutral or unclear
    return (
        "Thank you for sharing that with me. I want to really understand what you're going through. "
        "Can you tell me a bit more? Or if you'd rather, we can try a specific coping technique together."
    )
