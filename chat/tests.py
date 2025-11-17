# chat/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .nlp import analyze_message
from .tasks import handle_user_message

User = get_user_model()

class BasicFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.conv = Conversation.objects.create(user=self.user)

    def test_nlu_sentiment_intent(self):
        res = analyze_message("I want to kill myself")
        self.assertIn('intent', res)
        self.assertIn('sentiment', res)

    def test_task_creates_bot_reply(self):
        m = Message.objects.create(conversation=self.conv, sender='user', text='hi there')
        # call synchronously
        result = handle_user_message(m.id)
        self.assertIn(result['status'], ('ok','flagged'))
        # refresh messages
        msgs = list(self.conv.messages.order_by('created_at'))
        self.assertTrue(len(msgs) >= 2)
