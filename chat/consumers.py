import json
import logging
from datetime import datetime

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import PermissionDenied

from .models import Conversation, Message
from .serializers import MessageSerializer

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for a single conversation.
    - Group name: conversation_<conversation_id> (must match tasks._broadcast_message)
    - On connect: validates user + conversation access, sends recent messages
    - receive_json: supports "send_message" and "ping"
    - chat_message: handler for group sends (type="chat_message")
    """

    # per-connection rate-limit settings
    RATE_LIMIT_COUNT = 6          # messages
    RATE_LIMIT_PERIOD = 10        # seconds

    async def connect(self):
        self.conv_id = self.scope["url_route"]["kwargs"].get("conv_id")
        if not self.conv_id:
            logger.debug("connect: no conv_id provided in URL")
            await self.close(code=4001)
            return

        # Keep group name consistent with tasks/channel_send code
        self.group_name = f"conversation_{self.conv_id}"

        # in-memory per-connection rate limiting state
        self._recent_msg_timestamps = []

        # Auth check (JwtAuthMiddleware should set scope['user'])
        user = self.scope.get("user")
        if not user or getattr(user, "is_anonymous", True):
            logger.info("connect: anonymous connection rejected for conv %s", self.conv_id)
            await self.close(code=4003)
            return

        # Verify conversation exists and user has access (DB check)
        try:
            allowed = await self._user_has_access(user.id, self.conv_id)
        except Exception:
            logger.exception("connect: error checking conversation access for conv %s", self.conv_id)
            await self.close(code=1011)
            return

        if not allowed:
            logger.info("connect: user %s not allowed for conv %s", getattr(user, "id", None), self.conv_id)
            await self.close(code=4003)
            return

        # join group and accept
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.debug("connect: user %s joined group %s", getattr(user, "id", None), self.group_name)

        # send initial recent messages so client can hydrate quickly
        recent = await self._get_recent_messages(self.conv_id, limit=50)
        await self.send_json({"type": "initial_messages", "messages": recent})

    async def disconnect(self, code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            logger.exception("disconnect: error discarding group")

    async def receive_json(self, content, **kwargs):
        """
        Accept JSON messages from client:
         - {action: "ping"}
         - {action: "send_message", text: "..."}
        """
        try:
            action = content.get("action")
            if action == "ping":
                await self.send_json({"type": "pong", "ts": datetime.utcnow().isoformat()})
                return

            if action == "send_message":
                text = content.get("text", "")
                # basic validation
                if not isinstance(text, str) or not text.strip():
                    await self.send_json({"type": "error", "error": "empty_message"})
                    return
                if len(text) > 4000:
                    await self.send_json({"type": "error", "error": "message_too_long"})
                    return

                # simple per-connection rate limiter
                now = datetime.utcnow()
                self._recent_msg_timestamps = [
                    ts for ts in self._recent_msg_timestamps
                    if (now - ts).total_seconds() < self.RATE_LIMIT_PERIOD
                ]
                if len(self._recent_msg_timestamps) >= self.RATE_LIMIT_COUNT:
                    await self.send_json({"type": "error", "error": "rate_limited"})
                    return
                self._recent_msg_timestamps.append(now)

                # create message in DB (sync -> async)
                user = self.scope.get("user")
                created = await self._create_message(self.conv_id, user.id, text)

                # broadcast created message to group (async call; no async_to_sync)
                payload = MessageSerializer(created).data
                await self.channel_layer.group_send(
                    self.group_name,
                    {"type": "chat_message", "message": payload}
                )

                # ack to sender
                await self.send_json({"type": "message_sent", "message": payload})
                return

            # unknown action
            await self.send_json({"type": "error", "error": "unknown_action"})
        except PermissionDenied:
            await self.send_json({"type": "error", "error": "permission_denied"})
        except Exception:
            logger.exception("receive_json: error handling message")
            await self.send_json({"type": "error", "error": "server_error"})

    async def chat_message(self, event):
        """
        Handler for events sent to the group with type "chat_message".
        Event payload must include 'message' (serialized dict).
        """
        message = event.get("message")
        if not message:
            return
        # forward to client
        await self.send_json({"type": "message", "message": message})

    # -------------------------
    # Database helper methods
    # -------------------------
    @database_sync_to_async
    def _user_has_access(self, user_id, conv_id):
        """Default policy: allow if Conversation.user == user"""
        try:
            conv = Conversation.objects.select_related("user").get(pk=conv_id)
        except Conversation.DoesNotExist:
            return False
        return getattr(conv.user, "id", None) == user_id

    @database_sync_to_async
    def _get_recent_messages(self, conv_id, limit=50):
        qs = Message.objects.filter(conversation_id=conv_id).order_by("-created_at")[:limit]
        ser = MessageSerializer(list(qs), many=True).data
        return list(reversed(ser))

    @database_sync_to_async
    def _create_message(self, conv_id, user_id, text):
        conv = Conversation.objects.get(pk=conv_id)
        # create as sender='user' (worker will fill NLU metadata)
        msg = Message.objects.create(conversation=conv, sender="user", text=text)
        return msg
