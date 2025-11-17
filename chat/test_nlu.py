from django.test import TestCase
from .nlp import analyze_message, safety_check

class NluTest(TestCase):
    def test_analyze_and_safety(self):
        low = analyze_message("I want to kill myself")
        self.assertEqual(low['intent'], 'suicidal')
        flagged, saverity = safety_check("Iwant to kill myself", low)
        self.assertTrue(flagged)
        self.assertEqual(saverity, 'high')

        hi = analyze_message("Hi, hello!")
        self.assertEqual(hi['intent'], 'greeting')
        flagged2, s2 = safety_check("Hi", hi)
        self.assertFalse(flagged2)