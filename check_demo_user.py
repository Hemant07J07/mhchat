#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mhchat_proj.settings')
django.setup()

from django.contrib.auth.models import User
from chat.models import UserProfile, Conversation

# Check if demo user exists
user = User.objects.filter(email='demo@example.com').first()
if user:
    print('✓ Demo user exists!')
    print(f'  Username: {user.username}')
    print(f'  Email: {user.email}')
    convs = Conversation.objects.filter(user=user).count()
    print(f'  Conversations: {convs}')
    if convs > 0:
        for conv in Conversation.objects.filter(user=user):
            msgs = conv.messages.count()
            print(f'    - Conv {conv.id}: {msgs} messages (started: {conv.started_at})')
else:
    print('✗ Demo user does not exist. Creating...')
    user = User.objects.create_user(
        username='demo',
        email='demo@example.com',
        password='demo123456'
    )
    profile = UserProfile.objects.create(user=user)
    print(f'✓ Created demo user: demo@example.com / demo123456')

# Also ensure there's at least one conversation
convs = Conversation.objects.filter(user=user).count()
if convs == 0:
    print('Creating initial conversation for demo user...')
    conv = Conversation.objects.create(user=user)
    print(f'✓ Created conversation {conv.id}')
