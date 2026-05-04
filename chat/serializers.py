# chat/serializers.py
from rest_framework import serializers
from .models import Conversation, Message, MessageAttachment


class MessageAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MessageAttachment
        fields = [
            "id",
            "file_url",
            "file_name",
            "content_type",
            "file_size",
            "created_at",
        ]

    def get_file_url(self, obj):
        try:
            return obj.file.url
        except Exception:
            return ""

class MessageSerializer(serializers.ModelSerializer):
    # Extract ML results from nlp_metadata for easier frontend consumption
    ml_results = serializers.SerializerMethodField()
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id',
            'conversation',
            'sender',
            'text',
            'nlp_metadata',
            'ml_results',
            'attachments',
            'created_at',
            'is_flagged',
        ]
        read_only_fields = ['nlp_metadata', 'created_at', 'is_flagged', 'ml_results', 'attachments']
        extra_kwargs = {
            'conversation': {'required': False}
        }
    
    def get_ml_results(self, obj):
        """Extract ML prediction results from nlp_metadata for frontend display."""
        metadata = obj.nlp_metadata or {}
        ml_data = metadata.get("ml", {})
        
        if not ml_data:
            return None
        
        return {
            "intent": ml_data.get("intent"),
            "intent_score": ml_data.get("intent_score"),
            "crisis": ml_data.get("crisis", False),
            "kb_hits": ml_data.get("kb_hits", []),
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
