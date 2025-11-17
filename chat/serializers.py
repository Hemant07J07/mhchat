# chat/serializers.py
from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id',
            'conversation',
            'sender',
            'text',
            'nlp_metadata',   # <-- correct name (NOT nip_metadata)
            'created_at',
            'is_flagged',
        ]
        read_only_fields = ['nlp_metadata', 'created_at', 'is_flagged']
        extra_kwargs = {
            'conversation': {'required': False}  # Not required in request since it comes from URL
        }

class ConversationSerializer(serializers.ModelSerializer):
    # include the last 10 messages as convenience
    recent_messages = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'user', 'started_at', 'ended_at', 'metadata', 'recent_messages']
        read_only_fields = ['user', 'started_at']

    def get_recent_messages(self, obj):
        qs = obj.messages.order_by('-created_at')[:10]
        return MessageSerializer(qs, many=True).data
