from django.contrib import admin
from .models import UserProfile, Conversation, Message

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'consent_given', 'created_at')
    search_fields = ('user__username', 'user__email')

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'started_at', 'ended_at')
    search_fields = ('user__username',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'conversation', 'sender', 'created_at', 'is_flagged')
    list_filter = ('sender', 'is_flagged')
    search_fields = ('text',)
