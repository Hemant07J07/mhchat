#!/usr/bin/env python
"""
Test script to verify MedGemma and fallback functionality
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mhchat_proj.settings')
django.setup()

from chat.tasks import _call_llm_safe
from chat.medgemma_client import get_medgemma_client

print("=" * 60)
print("MedGemma and Fallback Response Test")
print("=" * 60)

# Test 1: MedGemma client
print("\n1. Testing MedGemma Client Initialization:")
try:
    client = get_medgemma_client()
    print(f"   ✓ Client initialized")
    print(f"   Base URL: {client.base_url}")
    print(f"   Model: {client.model}")
    print(f"   Timeout: {client.timeout}")
    
    is_available = client.is_available()
    print(f"   Available: {is_available}")
    
    if is_available:
        print("   ✓ MedGemma server is RUNNING on port 8080")
    else:
        print("   ⚠ MedGemma server is NOT running on port 8080 - will use fallback")
        
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 2: Fallback response
print("\n2. Testing Fallback Response Generation:")
try:
    response = _call_llm_safe(user_id=1, user_text="What is diabetes?", history=[])
    print(f"   ✓ Response generated")
    print(f"   Length: {len(response)} characters")
    print(f"   Preview: {response[:150]}...")
except Exception as e:
    print(f"   ✗ Error: {e}")

# Test 3: Historical context
print("\n3. Testing with Conversation History:")
try:
    history = [
        {"sender": "user", "text": "I have been feeling very tired"},
        {"sender": "bot", "text": "Fatigue can have many causes..."},
    ]
    response = _call_llm_safe(user_id=1, user_text="Should I see a doctor?", history=history)
    print(f"   ✓ Response with context generated")
    print(f"   Length: {len(response)} characters")
    print(f"   Preview: {response[:150]}...")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
print("Test Summary:")
print("=" * 60)
print("If MedGemma is not running, responses will use the fallback generator.")
print("The fallback uses rule-based response generation based on keywords.")
print("To get AI responses, start the MedGemma server on port 8080:")
print("  ollama serve medgemma-4b")
print("=" * 60)
