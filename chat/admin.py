# chat/admin.py
from django.contrib import admin, messages
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from .models import Message, Conversation
import csv
import io

@admin.action(description="Mark selected messages as reviewed (clear flag)")
def mark_reviewed(modeladmin, request, queryset):
    updated = queryset.update(is_flagged=False)
    messages.success(request, f"Marked {updated} message(s) as reviewed (is_flagged=False).")

@admin.action(description="Escalate selected messages via email")
def escalate_to_admin(modeladmin, request, queryset):
    recipient_list = [a[1] for a in getattr(settings, "ADMINS", [])] or ["admin@example.com"]
    sent = 0
    for m in queryset:
        try:
            send_mail(
                f"[MHChat] escalation: message {m.id}",
                f"Conversation {m.conversation.id}\nMessage: {m.text}\nUser: {m.conversation.user}",
                getattr(settings, "DEFAULT_FROM_EMAIL", "mhchat@example.com"),
                recipient_list,
                fail_silently=False,
            )
            sent += 1
        except Exception as exc:
            # don't crash admin action; report per-message failures
            messages.error(request, f"Failed to send email for message {m.id}: {exc}")
    if sent:
        messages.success(request, f"Escalation emails sent for {sent} message(s).")

@admin.action(description="Export selected messages to CSV")
def export_messages_csv(modeladmin, request, queryset):
    if not queryset.exists():
        messages.warning(request, "No messages selected for export.")
        return None
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "conversation_id", "sender", "created_at", "is_flagged", "text", "nlp_metadata"])
    for m in queryset.order_by("-created_at"):
        writer.writerow([m.id, m.conversation_id, m.sender, m.created_at.isoformat(), m.is_flagged, m.text, m.nlp_metadata])
    resp = HttpResponse(buf.getvalue(), content_type="text/csv")
    resp["Content-Disposition"] = "attachment; filename=messages_export.csv"
    return resp

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "created_at", "is_flagged")
    list_filter = ("is_flagged", "sender", "created_at")
    search_fields = ("text", "conversation__id", "conversation__user__username")
    readonly_fields = ("nlp_metadata", "created_at")
    actions = [mark_reviewed, escalate_to_admin, export_messages_csv]

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "started_at")
    search_fields = ("user__username",)
    readonly_fields = ("started_at",)
