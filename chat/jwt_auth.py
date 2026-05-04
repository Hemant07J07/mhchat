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

    async def __call__(self, scope, receive, send):
        qs = parse_qs(scope.get("query_string", b"").decode())
        token = qs.get("token", [None])[0]
        scope['user'] = AnonymousUser()  # default
        
        if token:
            try:
                access = AccessToken(token)
                user_id = access.get("user_id") or access.get("user")
                if user_id:
                    scope['user'] = await get_user(user_id)
            except TokenError:
                pass
                
        return await self.inner(scope, receive, send)