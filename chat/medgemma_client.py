"""
MedGemma AI Client Integration
Provides easy access to the MedGemma AI server for medical chat and image analysis
"""

import requests
import base64
import logging
from typing import Optional, List, Dict, Any
from django.conf import settings

logger = logging.getLogger(__name__)


class MedGemmaClient:
    """
    Client for communicating with MedGemma AI server.
    
    The server should be running at MEDGEMMA_BASE_URL (default: http://localhost:8080)
    """
    
    def __init__(self):
        self.base_url = getattr(
            settings, 
            'MEDGEMMA_BASE_URL', 
            'http://localhost:8080'
        )
        self.model = getattr(
            settings,
            'MEDGEMMA_MODEL',
            'medgemma-4b'
        )
        self.timeout = getattr(
            settings,
            'MEDGEMMA_TIMEOUT',
            60
        )
        self.api_endpoint = f"{self.base_url}/v1/chat/completions"
        
        logger.info(f"MedGemmaClient initialized with endpoint: {self.api_endpoint}")
    
    def is_available(self) -> bool:
        """Check if MedGemma server is running and available"""
        try:
            response = requests.get(
                f"{self.base_url}/v1/models",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"MedGemma server not available: {e}")
            return False
    
    def analyze_text(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> str:
        """
        Send a text-only query to MedGemma
        
        Args:
            message: The user's question or message
            conversation_history: Previous messages in format [{"role": "user", "content": "..."}, ...]
            system_prompt: Custom system prompt (defaults to medical assistant)
            temperature: Response randomness (0=deterministic, 1=random)
            max_tokens: Maximum response length
            
        Returns:
            AI response text
            
        Raises:
            Exception: If API call fails
        """
        if not system_prompt:
            system_prompt = (
                "You are a helpful and empathetic medical AI assistant. "
                "You provide accurate medical information while being careful to note "
                "when professional medical consultation is needed. "
                "Always prioritize patient safety."
            )
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        logger.debug(f"Sending text query to MedGemma: {message[:100]}...")
        
        try:
            response = requests.post(
                self.api_endpoint,
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                },
                timeout=self.timeout,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            
            logger.debug(f"MedGemma response: {ai_response[:100]}...")
            return ai_response
            
        except requests.exceptions.Timeout:
            logger.error("MedGemma request timed out")
            raise Exception("Medical AI service is taking too long to respond. Please try again.")
        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to MedGemma server")
            raise Exception("Medical AI service is not available. Please ensure the server is running on port 8080.")
        except requests.exceptions.HTTPError as e:
            logger.error(f"MedGemma API error: {e}")
            raise Exception(f"Medical AI service error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error calling MedGemma: {e}")
            raise
    
    def analyze_image(
        self,
        image_file,
        query: str = "Describe this medical image",
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.5,
        max_tokens: int = 1500
    ) -> str:
        """
        Analyze a medical image with optional text query
        
        Args:
            image_file: File object or path to image
            query: Question about the image
            conversation_history: Previous messages
            system_prompt: Custom system prompt
            temperature: Response randomness
            max_tokens: Maximum response length
            
        Returns:
            AI analysis of the image
            
        Raises:
            Exception: If image processing or API call fails
        """
        if not system_prompt:
            system_prompt = (
                "You are a medical image analysis expert. "
                "Analyze the provided medical image carefully and provide "
                "detailed, professional observations. Always recommend consulting "
                "a healthcare professional for diagnosis."
            )
        
        try:
            # Encode image to base64
            if isinstance(image_file, str):
                # It's a file path
                with open(image_file, 'rb') as f:
                    image_data = base64.b64encode(f.read()).decode()
                image_type = image_file.split('.')[-1].lower()
            else:
                # It's a file object (Django UploadedFile)
                image_data = base64.b64encode(image_file.read()).decode()
                image_type = image_file.name.split('.')[-1].lower()
            
            logger.info(f"Processing image for medical analysis: {image_type}")
            
            # Build messages
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)
            
            # Add current message with image
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": query},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/{image_type};base64,{image_data}"
                        }
                    }
                ]
            })
            
            response = requests.post(
                self.api_endpoint,
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                },
                timeout=self.timeout,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            
            logger.debug(f"Image analysis complete: {ai_response[:100]}...")
            return ai_response
            
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            raise Exception(f"Failed to analyze image: {str(e)}")
    
    def get_medical_context(
        self,
        symptom: str
    ) -> Dict[str, Any]:
        """
        Get medical context/information for a symptom
        
        Args:
            symptom: Medical symptom or condition
            
        Returns:
            Dictionary with medical information
        """
        system_prompt = (
            "You are a medical knowledge assistant. Provide structured information "
            "about medical symptoms and conditions. Format your response as key information points."
        )
        
        query = f"""Provide medical context for: {symptom}
        
Include:
1. Common causes
2. Associated symptoms
3. When to seek medical attention
4. General preventive measures

Be accurate and note this is for informational purposes only."""
        
        try:
            response = self.analyze_text(
                message=query,
                system_prompt=system_prompt,
                temperature=0.3,  # Lower temperature for accuracy
                max_tokens=1500
            )
            
            return {
                "success": True,
                "symptom": symptom,
                "context": response
            }
        except Exception as e:
            logger.error(f"Error getting medical context: {e}")
            return {
                "success": False,
                "error": str(e)
            }


def get_medgemma_client() -> MedGemmaClient:
    """Factory function to get MedGemma client instance"""
    return MedGemmaClient()
