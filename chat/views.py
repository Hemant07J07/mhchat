# chat/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth.models import User

from .models import Conversation, Message, UserProfile
from .serializers import ConversationSerializer, MessageSerializer
from .tasks import handle_user_message

# Default app-level permission; you can override per-viewset as needed.
DEFAULT_PERMS = [permissions.IsAuthenticated]


class ConversationViewSet(viewsets.ModelViewSet):
    """
    Conversations: list / create / retrieve / update / delete.
    Automatically filtered to current user.
    """
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user).order_by('-started_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            return Response(
                {"detail": "You don't have permission to delete this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()


class MessageViewSet(viewsets.ModelViewSet):
    """
    Messages: list / create / retrieve / delete.
    Messages belong to a conversation. Creating a user message enqueues a background
    task that analyzes the message and generates a bot/system reply.
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow filtering by conversation via query param or nested route kwarg
        conv_id = self.kwargs.get('conversation_pk') or self.request.query_params.get('conversation')
        if conv_id:
            return Message.objects.filter(conversation_id=conv_id).order_by('created_at')
        return Message.objects.none()

    def create(self, request, *args, **kwargs):
        """
        Create a message and enqueue background task to analyze + reply.

        Expected payload:
        {
          "sender": "user"|"bot"|"system",
          "text": "..."
        }
        
        For nested routing: /api/conversations/{id}/messages/
        """
        # Get conversation ID from nested URL parameter
        conv_id = self.kwargs.get('conversation_pk')
        
        if not conv_id:
            return Response(
                {"detail": "Conversation ID is required in URL"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get conversation and verify access
        try:
            conv = Conversation.objects.get(pk=conv_id, user=request.user)
        except Conversation.DoesNotExist:
            return Response(
                {"detail": "Conversation not found or you don't have access"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Add conversation to request data for serializer
        request_data = dict(request.data)
        request_data['conversation'] = conv.id
        
        serializer = self.get_serializer(data=request_data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data

        # Save the user message without NLU data; worker will fill it asynchronously.
        # Use transaction to ensure save + enqueue consistency (worker may run sync fallback).
        with transaction.atomic():
            message = serializer.save(nlp_metadata={}, is_flagged=False)

            # Enqueue celery task if available; otherwise call synchronously
            try:
                if hasattr(handle_user_message, 'delay'):
                    # Run async task
                    handle_user_message.delay(message.id)
                else:
                    # synchronous execution - blocks until bot response is created
                    handle_user_message(message.id)
            except Exception as exc:
                # Don't fail the creation; return created with a note that background processing failed.
                return Response(
                    {
                        "detail": "Message created but background processing failed.",
                        "error": str(exc),
                        "message": MessageSerializer(message).data,
                    },
                    status=status.HTTP_201_CREATED,
                )

        # Refresh message and get bot response if it was created synchronously
        message.refresh_from_db()
        
        # Fetch all messages in conversation to include bot response
        all_messages = Message.objects.filter(conversation=conv).order_by('created_at')
        response_data = {
            "user_message": MessageSerializer(message).data,
            "all_messages": MessageSerializer(all_messages, many=True).data,
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent messages across all conversations."""
        qs = Message.objects.filter(
            conversation__user=request.user
        ).order_by('-created_at')[:50]
        return Response(self.get_serializer(qs, many=True).data)


# Authentication endpoints
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """Register a new user."""
    email = request.data.get('email')
    username = request.data.get('username')
    password = request.data.get('password')

    if not all([email, username, password]):
        return Response(
            {"detail": "email, username, and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"detail": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"detail": "Email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        UserProfile.objects.get_or_create(user=user)

        # Generate JWT token
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    """Login user and return JWT tokens."""
    from django.contrib.auth import authenticate
    from rest_framework_simplejwt.tokens import RefreshToken

    email_or_username = request.data.get('email') or request.data.get('username')
    password = request.data.get('password')

    if not email_or_username or not password:
        return Response(
            {"detail": "email/username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Try to find user by email or username
    user = None
    if '@' in email_or_username:
        try:
            user = User.objects.get(email=email_or_username)
        except User.DoesNotExist:
            pass
    else:
        try:
            user = User.objects.get(username=email_or_username)
        except User.DoesNotExist:
            pass

    if user is None:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Verify password
    if not user.check_password(password):
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Ensure user has a profile
    UserProfile.objects.get_or_create(user=user)

    # Generate tokens
    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    """Logout user (blacklist token)."""
    # Optionally blacklist the token here if using TokenBlacklist
    return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


# Profile endpoints
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_profile(request):
    """Get current user profile."""
    user = request.user
    profile = UserProfile.objects.get_or_create(user=user)[0]

    return Response(
        {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
            },
            "profile": {
                "consent_given": profile.consent_given,
                "phone": profile.phone,
                "timezone": profile.timezone,
                "created_at": profile.created_at,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(['PATCH', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def update_user_profile(request):
    """Update current user profile."""
    user = request.user
    profile = UserProfile.objects.get_or_create(user=user)[0]

    # Update user fields
    if 'first_name' in request.data:
        user.first_name = request.data['first_name']
    if 'last_name' in request.data:
        user.last_name = request.data['last_name']
    user.save()

    # Update profile fields
    if 'phone' in request.data:
        profile.phone = request.data['phone']
    if 'timezone' in request.data:
        profile.timezone = request.data['timezone']
    profile.save()

    return Response(get_user_profile(request).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_consent(request):
    """Accept consent for the user."""
    user = request.user
    profile = UserProfile.objects.get_or_create(user=user)[0]
    profile.consent_given = True
    profile.save()

    return Response(
        {"detail": "Consent accepted.", "consent_given": True},
        status=status.HTTP_200_OK,
    )

