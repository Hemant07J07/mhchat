from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import UserProfile, Conversation, Message

User = get_user_model()

class BasicModelsTest(TestCase):
    def test_profile_and_message_creation(self):
        u = User.objects.create_user(username='testuser', password='pass123')
        profile = UserProfile.objects.create(user=u, consent_given=True)
        conv = Conversation.objects.create(user=u)
        msg = Message.objects.create(conversation=conv, sender='user', text='Hello')
        self.assertEqual(conv.messages.count(), 1)
        self.assertTrue(u.profile.consent_given)