from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/conversations/(?P<conv_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'ws/chat/room1/$', consumers.AnonymousChatConsumer.as_asgi()),
]
