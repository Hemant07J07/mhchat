"""
MedGemma integration views for your mhchat application
Add these endpoints to your chat API
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.views.decorators.http import require_http_methods
import logging

from .medgemma_client import get_medgemma_client
from .models import Message, Conversation

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def medgemma_text_query(request):
    """
    Send a text query to MedGemma AI
    
    Request body:
    {
        "message": "What are symptoms of flu?",
        "conversation_id": 123,  # Optional - to include history
        "temperature": 0.7,      # Optional
        "max_tokens": 1000       # Optional
    }
    
    Response:
    {
        "success": true,
        "response": "AI generated response...",
        "model": "medgemma-4b"
    }
    """
    try:
        client = get_medgemma_client()
        
        # Check if server is available
        if not client.is_available():
            return Response({
                "success": False,
                "error": "Medical AI service is not available. Please ensure MedGemma server is running on port 8080."
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Get request data
        message = request.data.get('message', '').strip()
        conversation_id = request.data.get('conversation_id')
        temperature = request.data.get('temperature', 0.7)
        max_tokens = request.data.get('max_tokens', 1000)
        
        # Validate input
        if not message:
            return Response({
                "success": False,
                "error": "Message cannot be empty"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(message) > 5000:
            return Response({
                "success": False,
                "error": "Message is too long (max 5000 characters)"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get conversation history if provided
        conversation_history = None
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )
                # Get last 10 messages for context
                recent_messages = conversation.messages.all().order_by('-created_at')[:10]
                conversation_history = [
                    {
                        "role": "user" if msg.sender == "user" else "assistant",
                        "content": msg.content
                    }
                    for msg in reversed(recent_messages)
                ]
            except Conversation.DoesNotExist:
                logger.warning(f"Conversation {conversation_id} not found for user {request.user}")
        
        # Send to MedGemma
        logger.info(f"User {request.user} sending query to MedGemma: {message[:50]}...")
        
        response_text = client.analyze_text(
            message=message,
            conversation_history=conversation_history,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Save message to database if conversation_id provided
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )
                # Save user message
                Message.objects.create(
                    conversation=conversation,
                    sender='user',
                    content=message
                )
                # Save AI response
                Message.objects.create(
                    conversation=conversation,
                    sender='ai',
                    content=response_text
                )
            except Exception as e:
                logger.error(f"Error saving messages: {e}")
                # Continue anyway, just don't save
        
        return Response({
            "success": True,
            "response": response_text,
            "model": client.model
        })
        
    except Exception as e:
        logger.error(f"Error in medgemma_text_query: {e}")
        return Response({
            "success": False,
            "error": f"Error processing query: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def medgemma_image_query(request):
    """
    Analyze a medical image with MedGemma
    
    Request (multipart/form-data):
    - image: File object
    - query: Optional - what to ask about the image
    - conversation_id: Optional - conversation context
    - temperature: Optional
    - max_tokens: Optional
    
    Response:
    {
        "success": true,
        "response": "Image analysis results...",
        "image_name": "xray.jpg"
    }
    """
    try:
        client = get_medgemma_client()
        
        # Check if server is available
        if not client.is_available():
            return Response({
                "success": False,
                "error": "Medical AI service is not available."
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Get image file
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({
                "success": False,
                "error": "No image provided"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file
        valid_extensions = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}
        file_ext = image_file.name.split('.')[-1].lower()
        if file_ext not in valid_extensions:
            return Response({
                "success": False,
                "error": f"Invalid image format. Allowed: {', '.join(valid_extensions)}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if image_file.size > 10 * 1024 * 1024:  # 10MB limit
            return Response({
                "success": False,
                "error": "Image file is too large (max 10MB)"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get optional parameters
        query = request.data.get('query', 'Analyze this medical image')
        conversation_id = request.data.get('conversation_id')
        temperature = float(request.data.get('temperature', 0.5))
        max_tokens = int(request.data.get('max_tokens', 1500))
        
        # Get conversation history if provided
        conversation_history = None
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )
                recent_messages = conversation.messages.all().order_by('-created_at')[:10]
                conversation_history = [
                    {
                        "role": "user" if msg.sender == "user" else "assistant",
                        "content": msg.content
                    }
                    for msg in reversed(recent_messages)
                ]
            except Conversation.DoesNotExist:
                pass
        
        # Analyze image
        logger.info(f"User {request.user} analyzing image: {image_file.name}")
        
        response_text = client.analyze_image(
            image_file=image_file,
            query=query,
            conversation_history=conversation_history,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Save to database if conversation provided
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id,
                    user=request.user
                )
                Message.objects.create(
                    conversation=conversation,
                    sender='user',
                    content=f"[Image: {image_file.name}] {query}"
                )
                Message.objects.create(
                    conversation=conversation,
                    sender='ai',
                    content=response_text
                )
            except Exception as e:
                logger.error(f"Error saving image analysis messages: {e}")
        
        return Response({
            "success": True,
            "response": response_text,
            "image_name": image_file.name
        })
        
    except Exception as e:
        logger.error(f"Error in medgemma_image_query: {e}")
        return Response({
            "success": False,
            "error": f"Error analyzing image: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def medgemma_status(request):
    """
    Check if MedGemma server is available
    
    Response:
    {
        "available": true,
        "endpoint": "http://localhost:8080",
        "model": "medgemma-4b"
    }
    """
    client = get_medgemma_client()
    available = client.is_available()
    
    return Response({
        "available": available,
        "endpoint": client.base_url,
        "model": client.model
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def medgemma_medical_context(request):
    """
    Get medical context/information about a symptom
    
    Request:
    {
        "symptom": "fever",
        "conversation_id": 123  # Optional
    }
    
    Response:
    {
        "success": true,
        "symptom": "fever",
        "context": "Medical information..."
    }
    """
    try:
        client = get_medgemma_client()
        
        if not client.is_available():
            return Response({
                "success": False,
                "error": "Medical AI service not available"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        symptom = request.data.get('symptom', '').strip()
        if not symptom:
            return Response({
                "success": False,
                "error": "Symptom cannot be empty"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"User {request.user} requesting medical context for: {symptom}")
        
        result = client.get_medical_context(symptom)
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error in medgemma_medical_context: {e}")
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
