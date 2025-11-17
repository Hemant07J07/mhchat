# chat/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone

# optional pgvector support
try:
    from pgvector.models import VectorField
except Exception:
    VectorField = None

AUTH_USER = settings.AUTH_USER_MODEL  # string like "auth.User" or custom user model


class UserProfile(models.Model):
    user = models.OneToOneField(AUTH_USER, on_delete=models.CASCADE, related_name="profile")
    consent_given = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    timezone = models.CharField(max_length=50, default="Asia/Kolkata")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile of {self.user}"


class Conversation(models.Model):
    user = models.ForeignKey(AUTH_USER, on_delete=models.CASCADE, related_name="conversations")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-started_at",)

    def __str__(self):
        return f"Conversation {self.id} ({self.user})"


class Message(models.Model):
    ROLE_USER = "user"
    ROLE_BOT = "bot"
    ROLE_SYSTEM = "system"
    ROLE_CHOICES = ((ROLE_USER, "user"), (ROLE_BOT, "bot"), (ROLE_SYSTEM, "system"))

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=ROLE_CHOICES)
    text = models.TextField()
    nlp_metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    is_flagged = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ("created_at",)  # oldest first for conversation message listing

    def __str__(self):
        return f"{self.sender} @ {self.created_at:%Y-%m-%d %H:%M:%S}: {self.text[:30]}"


class MessageEmbedding(models.Model):
    """
    Stores embedding vectors for a Message.

    - If pgvector is installed, use VectorField (recommended for efficient nearest-neighbor).
      Set dim to match your embedding model (e.g. 1536 for many OpenAI embeddings).
    - Otherwise we fall back to JSONField (a list of floats) for portability.
    """
    message = models.OneToOneField(Message, on_delete=models.CASCADE, related_name="embedding_record")
    if VectorField is not None:
        # Change dim to match your embedding model (e.g. 1536)
        vector = VectorField(dim=1536, null=True)
    else:
        # fallback: store vector as JSON list of floats
        vector = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Embedding for message {self.message_id}"
