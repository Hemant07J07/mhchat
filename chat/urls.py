from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (
    ConversationViewSet,
    MessageViewSet,
    register_user,
    login_user,
    logout_user,
    get_user_profile,
    update_user_profile,
    accept_consent,
)
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie
from .views_dashboard import dashboard_stats
from . import views

# Main router for conversations
router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')

# Nested router for messages under conversations
conversations_router = routers.NestedDefaultRouter(router, 'conversations', lookup='conversation')
conversations_router.register(r'messages', MessageViewSet, basename='conversation-messages')

urlpatterns = [
    # API routes
    path('api/', include(router.urls)),
    path('api/', include(conversations_router.urls)),
    
    # Auth routes
    path('api/auth/register/', register_user, name='register'),
    path('api/auth/login/', login_user, name='login'),
    path('api/auth/logout/', logout_user, name='logout'),
    
    # Profile routes
    path('api/profile/', get_user_profile, name='get-profile'),
    path('api/profile/update/', update_user_profile, name='update-profile'),
    path('api/profile/accept-consent/', accept_consent, name='accept-consent'),
    
    # Dashboard stats
    path('api/dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    
    # Simple frontend at root (for quick testing)
    path('', ensure_csrf_cookie(TemplateView.as_view(template_name='chat/index.html')), name='chat-home'),
]