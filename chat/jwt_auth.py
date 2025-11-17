from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()
    
class JwtAuthMiddleware:
    """ASGI middleware: read ?token=<jwt> and sets scope['user']"""
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return JwtAuthMiddlewareInstance(scope, self.inner)
    
class JwtAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        qs = parse_qs(self.scope.get("query_string", b"").decode())
        token = qs.get("token", [None])[0]
        if token:
            try:
                access = AccessToken(token)
                user_id = access.get("user_id") or access.get("user")
                if user_id:
                    self.scope['user'] = await get_user(user_id)
            except TokenError:
                self.scope['user'] = AnonymousUser()
            return await self.inner(self.scope, receive, send)