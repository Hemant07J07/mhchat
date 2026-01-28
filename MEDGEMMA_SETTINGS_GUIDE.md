"""
CONFIGURATION GUIDE FOR MEDGEMMA INTEGRATION IN DJANGO SETTINGS

Add these settings to your mhchat_proj/settings.py file to properly configure
MedGemma integration.
"""

# ============================================================================
# MEDGEMMA CONFIGURATION
# ============================================================================

# MedGemma server endpoint (default: localhost:8080)
# Change this if your MedGemma server runs on a different host/port
MEDGEMMA_BASE_URL = 'http://localhost:8080'

# Model name (don't change unless using a different model)
MEDGEMMA_MODEL = 'medgemma-4b'

# API request timeout in seconds (how long to wait for responses)
MEDGEMMA_TIMEOUT = 60

# Enable/disable MedGemma integration
MEDGEMMA_ENABLED = True

# Maximum file size for image analysis (in bytes)
MEDGEMMA_MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB

# Allowed image formats
MEDGEMMA_ALLOWED_FORMATS = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}

# Default temperature for AI responses (0.0-1.0, lower = more deterministic)
MEDGEMMA_DEFAULT_TEMPERATURE = 0.7

# Default max tokens for responses (higher = longer responses)
MEDGEMMA_DEFAULT_MAX_TOKENS = 1000

# Image analysis specific settings
MEDGEMMA_IMAGE_TEMPERATURE = 0.5
MEDGEMMA_IMAGE_MAX_TOKENS = 1500

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

# Add MedGemma logging if not already configured
# Add this to your LOGGING config in settings.py:

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': 'logs/medgemma.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'chat.medgemma_client': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'chat.views_medgemma': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Make sure to create logs directory:
# mkdir -p logs/

# ============================================================================
# CORS CONFIGURATION (if using separate frontend)
# ============================================================================

# If your frontend is on a different domain, add CORS headers
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',  # Next.js dev server
    'http://localhost:8000',  # Django dev server
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000',
    # Add your production domain here
]

# ============================================================================
# INSTALLED APPS (Make sure these are in your INSTALLED_APPS)
# ============================================================================

INSTALLED_APPS = [
    # ... existing apps ...
    'rest_framework',
    'corsheaders',
    'chat',  # Your chat app
]

# ============================================================================
# MIDDLEWARE (Make sure these are in your MIDDLEWARE)
# ============================================================================

MIDDLEWARE = [
    # Add CORS middleware if using separate frontend
    'corsheaders.middleware.CorsMiddleware',
    # ... other middleware ...
]

# ============================================================================
# URL CONFIGURATION (for mhchat_proj/urls.py)
# ============================================================================

# Example of how to add MedGemma URLs to your main urls.py:
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chat.urls')),
    path('api/', include('chat.urls_medgemma')),  # Add this line
]
"""

# ============================================================================
# ENVIRONMENT VARIABLES (Create a .env file or set these in shell)
# ============================================================================

"""
# Add to your .env file or set these in your shell:

# MedGemma server settings
MEDGEMMA_BASE_URL=http://localhost:8080
MEDGEMMA_MODEL=medgemma-4b
MEDGEMMA_TIMEOUT=60
MEDGEMMA_ENABLED=true

# Django settings
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
"""

# ============================================================================
# EXAMPLE: Using environment variables in settings.py
# ============================================================================

"""
import os
from pathlib import Path
import environ

# Load environment variables from .env file
env = environ.Env(
    DEBUG=(bool, False)
)
environ.Env.read_env()

# MedGemma Configuration
MEDGEMMA_BASE_URL = env('MEDGEMMA_BASE_URL', default='http://localhost:8080')
MEDGEMMA_MODEL = env('MEDGEMMA_MODEL', default='medgemma-4b')
MEDGEMMA_TIMEOUT = env.int('MEDGEMMA_TIMEOUT', default=60)
MEDGEMMA_ENABLED = env.bool('MEDGEMMA_ENABLED', default=True)
"""

# ============================================================================
# AUTHENTICATION CONFIGURATION
# ============================================================================

# Make sure authentication is configured for API endpoints
# All MedGemma endpoints require authentication by default

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# ============================================================================
# TESTING CONFIGURATION
# ============================================================================

"""
# If you want to test locally, use these settings:

# Run MedGemma in a separate terminal first:
# python -m localai start medgemma-4b-cpu

# Then run Django development server:
# python manage.py runserver

# Test endpoint:
# curl http://localhost:8000/api/medgemma/status/
"""

# ============================================================================
# PRODUCTION DEPLOYMENT NOTES
# ============================================================================

"""
For production deployment:

1. Run MedGemma server on a stable machine (not development laptop)
   - Use Docker for containerization
   - Use systemd service or supervisor for auto-restart
   - Run on fixed port (e.g., 8080)

2. Update MEDGEMMA_BASE_URL to production server
   MEDGEMMA_BASE_URL = 'http://medgemma-server.your-domain.com:8080'
   
3. Implement rate limiting to prevent abuse
   - Use django-ratelimit or similar
   
4. Monitor MedGemma service availability
   - Set up health checks
   - Alert if service goes down
   
5. Enable HTTPS for production
   - Use reverse proxy (nginx) in front
   - SSL/TLS certificates
   
6. Security best practices
   - Don't expose MedGemma port publicly
   - Use API keys for authentication
   - Validate all user inputs
   - Log all requests for audit
"""

# ============================================================================
# HEALTH CHECK IMPLEMENTATION
# ============================================================================

"""
# Optional: Add a health check middleware

from django.http import JsonResponse
from .medgemma_client import get_medgemma_client

def health_check(request):
    client = get_medgemma_client()
    is_available = client.is_available()
    
    status_code = 200 if is_available else 503
    return JsonResponse({
        'status': 'ok' if is_available else 'unavailable',
        'medgemma': is_available
    }, status=status_code)

# Add to urls.py:
# path('health/', health_check, name='health-check'),
"""
