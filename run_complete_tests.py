#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Complete test suite for MHChat.

Architecture under test:
- Django persists conversations/messages.
- Bot replies are generated synchronously via mhchat-ml (/predict).
- If mhchat-ml is unavailable, the system falls back to a local rule-based generator.

This script is intended for quick end-to-end sanity checks in dev.
"""

import io
import json
import os
import sys

import django


def _ensure_utf8_stdout() -> None:
    # Set output encoding for Windows terminals.
    if getattr(sys.stdout, "encoding", None) != "utf-8":
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")


def _section(title: str) -> None:
    print(f"\n[{title}]")
    print("-" * 70)


def main() -> int:
    _ensure_utf8_stdout()

    # Setup Django
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mhchat_proj.settings")
    django.setup()

    from django.contrib.auth.models import User

    from chat.ml_brain_client import predict as ml_predict
    from chat.models import Conversation, Message
    from chat.nlp import generate_bot_response
    from chat.tasks import _handle_user_message_logic

    print("\n" + "=" * 70)
    print("MHCHAT - COMPLETE TEST SUITE")
    print("=" * 70)

    # Test 1: Database connectivity
    _section("TEST 1 - Database Connectivity")
    try:
        user_count = User.objects.count()
        print("[OK] Database connected")
        print("  Users in database: " + str(user_count))
    except Exception as exc:
        print("[ERROR] Database error: " + str(exc))
        return 1

    # Test 2: mhchat-ml API
    _section("TEST 2 - mhchat-ml API (/predict)")
    ml_available = False
    try:
        pred = ml_predict("hello")
        if pred:
            ml_available = True
            print("[OK] mhchat-ml responded")
            print("  intent: " + str(pred.get("intent")))
            print("  crisis: " + str(pred.get("crisis")))
            print("  kb_hits: " + str(len(pred.get("kb_hits") or [])))
        else:
            print("[WARN] mhchat-ml did not respond")
            print("  Expected default base URL: http://localhost:8001")
            print("  Status: Django will use fallback generator")
    except Exception as exc:
        print("[WARN] mhchat-ml check failed: " + str(exc))
        print("  Status: Django will use fallback generator")

    # Test 3: Fallback response generation
    _section("TEST 3 - Fallback Response Generation")
    try:
        response = generate_bot_response("I have a severe headache")
        print("[OK] Fallback response generated")
        print("  Query: 'I have a severe headache'")
        print("  Response: " + str(response))
    except Exception as exc:
        print("[ERROR] Fallback generator error: " + str(exc))
        return 1

    # Test 4: Conversation and user message creation
    _section("TEST 4 - Conversation & Message Creation")
    try:
        test_user, created = User.objects.get_or_create(
            username="test_chat_user",
            defaults={
                "email": "test@example.com",
                "first_name": "Test",
                "last_name": "User",
            },
        )
        print("[OK] " + ("Created" if created else "Using existing") + " test user: " + test_user.username)

        conv, conv_created = Conversation.objects.get_or_create(user=test_user)
        print("[OK] " + ("Created" if conv_created else "Using existing") + " conversation (ID: " + str(conv.id) + ")")

        user_msg = Message.objects.create(
            conversation=conv,
            sender="user",
            text="What are the symptoms of the flu?",
        )
        print("[OK] Created user message (ID: " + str(user_msg.id) + ")")
        print("  Message: " + user_msg.text)
    except Exception as exc:
        print("[ERROR] Conversation/message creation error: " + str(exc))
        return 1

    # Test 5: Message processing pipeline
    _section("TEST 5 - Message Processing Pipeline")
    try:
        print("Processing message ID: " + str(user_msg.id) + "...")
        result = _handle_user_message_logic(user_msg.id)
        print("[OK] Pipeline executed")
        print("  Result: " + json.dumps(result, indent=2))

        status = result.get("status")
        if status == "ok" and result.get("bot_message_id"):
            bot_msg = Message.objects.get(id=result["bot_message_id"])
            print("[OK] Bot response created")
            print("  Bot message ID: " + str(bot_msg.id))
            print("  Bot response: " + bot_msg.text)
        elif status == "flagged":
            sys_msg = (
                Message.objects.filter(conversation=conv, sender="system")
                .order_by("-created_at")
                .first()
            )
            if sys_msg:
                print("[OK] System message created (flagged)")
                print("  System message ID: " + str(sys_msg.id))
                print("  System response: " + sys_msg.text)
            else:
                print("[WARN] Flagged result but no system message found")
        else:
            print("[WARN] Pipeline did not create a bot/system message")
    except Exception as exc:
        print("[ERROR] Pipeline error: " + str(exc))
        return 1

    # Test 6: Conversation history
    _section("TEST 6 - Conversation History")
    try:
        messages = Message.objects.filter(conversation=conv).order_by("created_at")
        print("[OK] Total messages in conversation: " + str(messages.count()))

        # Print last few messages for quick inspection
        recent = list(messages)[-10:]
        for i, msg in enumerate(recent, 1):
            sender = "You" if msg.sender == "user" else msg.sender.capitalize()
            text_preview = (msg.text or "")
            if len(text_preview) > 140:
                text_preview = text_preview[:140] + "..."
            print(f"  {i}. ({sender}) {text_preview}")
    except Exception as exc:
        print("[ERROR] History error: " + str(exc))
        return 1

    # Summary
    print("\n" + "=" * 70)
    print("SYSTEM STATUS SUMMARY")
    print("=" * 70)

    print("\nBackend Status:")
    print("  . Database: [OK] Connected")
    print("  . Message pipeline: [OK] Executed")
    print("  . Fallback generator: [OK] Available")

    print("\nML Brain:")
    if ml_available:
        print("  . mhchat-ml: [OK] Reachable")
        print("  => Using mhchat-ml when available")
    else:
        print("  . mhchat-ml: [WARN] Not reachable")
        print("  => Using fallback generator")
        print("  => To enable mhchat-ml, start the FastAPI service on http://localhost:8001")

    print("\nFrontend Integration:")
    print("  . Next.js proxy: POST /api/ml/predict")
    print("  . Status: [OK] (if frontend is configured)")

    print("\n" + "=" * 70)
    print("[DONE] ALL TESTS COMPLETED")
    print("=" * 70 + "\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
