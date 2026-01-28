"""
MedGemma integration URL routes
Add these to your chat/urls.py or main urls.py
"""

from django.urls import path
from . import views_medgemma

# These are the new endpoints for MedGemma integration
medgemma_patterns = [
    # Text-only queries
    path('api/medgemma/text/', views_medgemma.medgemma_text_query, name='medgemma-text'),
    
    # Image analysis
    path('api/medgemma/image/', views_medgemma.medgemma_image_query, name='medgemma-image'),
    
    # Health check
    path('api/medgemma/status/', views_medgemma.medgemma_status, name='medgemma-status'),
    
    # Medical context/information
    path('api/medgemma/context/', views_medgemma.medgemma_medical_context, name='medgemma-context'),
]

# To use in your main chat/urls.py, add:
# urlpatterns = [
#     # ... existing paths ...
# ] + medgemma_patterns
