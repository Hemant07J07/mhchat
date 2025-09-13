from django.conf import settings
from django.db import models
from django.utils import timezone

User = settings.AUTH_USER_MODEL

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    consent_given = models.BooleanField(default=False)
    phone = models.CharField(max_length=20, blank=True, null=True)
    timezone = models.CharField(max_length=50, default="Asia/Kolkata")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile of {self.user}"

class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Conversation {self.id} ({self.user})"

class Message(models.Model):
    ROLE_CHOICES = (('user','user'), ('bot','bot'), ('system','system'))
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=ROLE_CHOICES)
    text = models.TextField()
    nlp_metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_flagged = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.sender} @ {self.created_at}: {self.text[:30]}"
    