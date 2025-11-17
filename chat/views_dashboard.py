# chat/views_dashboard.py
from django.http import JsonResponse
from .models import Conversation, Message

def dashboard_stats(request):
    return JsonResponse({
        "total": Conversation.objects.count(),
        "flagged": Message.objects.filter(is_flagged=True).count()
    })
