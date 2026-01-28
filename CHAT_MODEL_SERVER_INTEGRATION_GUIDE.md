# Chat Model Server Integration Guide

## 📋 WHAT IS THE CHAT MODEL SERVER?

The **chat-model-server** is a medical AI assistant that runs **MedGemma 4B** - a specialized language model trained for medical conversations and image analysis.

### Simple Explanation:
Think of it as a **separate AI service** that:
- Listens for requests on a specific port (like `http://localhost:8080`)
- Takes medical questions/images as input
- Returns AI-generated answers optimized for medical use
- Works locally on your machine (privacy-friendly)
- Is compatible with OpenAI's API format

---

## 🏗️ HOW IT WORKS (High Level)

```
┌─────────────────────────────────────────────────────────────────┐
│ Your mhchat Frontend/Backend                                     │
│  (React/Next.js + Django)                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ HTTP Requests
                       │ (JSON format)
                       ↓
┌──────────────────────────────────────────────────────────────────┐
│ Chat Model Server (Port 8080)                                    │
│                                                                  │
│  ├─ LocalAI Framework (OpenAI-compatible API)                  │
│  ├─ MedGemma 4B Model (4-8GB, runs locally)                    │
│  ├─ LangChain Integration (for advanced features)              │
│  └─ Medical Agents & Tools (knowledge base, tools)             │
└──────────────────────────────────────────────────────────────────┘
                       │
                       │ Returns AI Response
                       │
                       ↓
┌──────────────────────────────────────────────────────────────────┐
│ Display in Your Chat UI                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📦 PROJECT STRUCTURE

```
chat-model-server/
├── docker/                    # Docker setup for easy deployment
│   ├── Dockerfile.cuda       # GPU version
│   ├── Dockerfile.cpu        # CPU-only version
│   └── docker-compose.yml
│
├── config/                   # Configuration files
│   ├── medgemma-4b-gpu.yaml  # GPU settings
│   └── medgemma-4b-cpu.yaml  # CPU settings
│
├── scripts/                  # Startup scripts
│   ├── run_linux.sh         # Run on Linux
│   ├── run_macos.sh         # Run on macOS
│   ├── download_model.sh    # Download AI model
│   └── test_api.sh          # Test API
│
├── example/                  # Example implementation
│   └── python-gradio-langchain-example/  # Full working example
│       ├── app.py           # Main application
│       ├── config.py        # Configuration
│       ├── core/
│       │   ├── medgemma_client.py    # API client
│       │   └── agents/               # Medical agent logic
│       └── ui/gradio_app.py          # Web UI
│
└── .env                      # Environment settings

```

---

## 🚀 SETUP & INSTALLATION (Windows)

### Step 1: Extract & Prepare the Server

```bash
cd c:\Users\hdube\Downloads\chat-model-server\chat-model-server-main

# Copy example env file
copy .env.example .env

# Edit .env - add your Hugging Face token (get from https://huggingface.co/settings/tokens)
# HF_TOKEN=your_token_here
# GPU_LAYERS=35  (for GPU) or 0 (for CPU-only)
# PORT=8080
```

### Step 2: Install Prerequisites

**For CPU-only (Recommended for Testing):**
- Python 3.10+
- pip

**For GPU (NVIDIA):**
- Docker + NVIDIA Docker support
- OR: CUDA 12.0+ installed locally

### Step 3: Run the Server

**Option A: Docker (Easiest for Linux)**
```bash
cd docker
docker-compose up -d
```

**Option B: Local Python (Windows/Mac)**
```bash
# Install LocalAI CLI (handles model download + setup)
pip install localai

# Download and run model
localai start medgemma-4b-cpu

# Model will download automatically (~2-4GB)
# Server starts at http://localhost:8080
```

### Step 4: Test the Server

```bash
# Test if server is running
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "medgemma-4b",
    "messages": [{"role": "user", "content": "What is pneumonia?"}]
  }'
```

---

## 📱 API ENDPOINTS (How to Send Requests)

### 1. Text-Only Query
```python
import requests

response = requests.post(
    'http://localhost:8080/v1/chat/completions',
    json={
        'model': 'medgemma-4b',
        'messages': [
            {'role': 'user', 'content': 'What are symptoms of diabetes?'}
        ]
    }
)

print(response.json()['choices'][0]['message']['content'])
```

### 2. With Image (Multimodal)
```python
import base64
import requests

# Read and encode image
with open('xray.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode()

response = requests.post(
    'http://localhost:8080/v1/chat/completions',
    json={
        'model': 'medgemma-4b',
        'messages': [
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': 'Describe this X-ray'},
                    {
                        'type': 'image_url',
                        'image_url': {'url': f'data:image/jpeg;base64,{image_data}'}
                    }
                ]
            }
        ]
    }
)

print(response.json()['choices'][0]['message']['content'])
```

### 3. Using OpenAI Python SDK (Easiest)
```python
from openai import OpenAI

# Point to local server
client = OpenAI(
    base_url='http://localhost:8080/v1',
    api_key='not-needed-for-local'
)

response = client.chat.completions.create(
    model='medgemma-4b',
    messages=[
        {'role': 'user', 'content': 'What is hypertension?'}
    ]
)

print(response.choices[0].message.content)
```

---

## 🔌 INTEGRATION WITH YOUR MHCHAT PROJECT

### Option 1: Simple Integration (Recommended First Step)

**Step 1: Add to your Django `views.py`**

```python
# chat/views.py

import requests
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response

MEDGEMMA_API = 'http://localhost:8080/v1/chat/completions'

@api_view(['POST'])
def chat_with_ai(request):
    """
    Send message to MedGemma AI model
    """
    message = request.data.get('message')
    image = request.FILES.get('image')  # Optional
    
    try:
        # Handle image if provided
        image_content = None
        if image:
            import base64
            image_data = base64.b64encode(image.read()).decode()
            image_content = {
                'type': 'image_url',
                'image_url': {'url': f'data:image/jpeg;base64,{image_data}'}
            }
        
        # Build message
        content = [{'type': 'text', 'text': message}]
        if image_content:
            content.append(image_content)
        
        # Call MedGemma
        response = requests.post(
            MEDGEMMA_API,
            json={
                'model': 'medgemma-4b',
                'messages': [{'role': 'user', 'content': content}]
            },
            timeout=60
        )
        
        if response.status_code == 200:
            ai_response = response.json()['choices'][0]['message']['content']
            return Response({
                'success': True,
                'response': ai_response
            })
        else:
            return Response({
                'success': False,
                'error': 'AI service error'
            }, status=response.status_code)
    
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)
```

**Step 2: Add URL route**

```python
# chat/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ... existing paths ...
    path('api/ai-chat/', views.chat_with_ai, name='ai-chat'),
]
```

**Step 3: Call from Frontend**

```typescript
// frontend/src/lib/api.ts

export async function sendToMedGemma(
  message: string,
  image?: File
): Promise<string> {
  const formData = new FormData();
  formData.append('message', message);
  if (image) {
    formData.append('image', image);
  }

  const response = await fetch('/api/ai-chat/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    },
    body: formData
  });

  const data = await response.json();
  
  if (data.success) {
    return data.response;
  } else {
    throw new Error(data.error);
  }
}
```

### Option 2: Advanced Integration (Production Ready)

Create a dedicated agent similar to the example:

```python
# chat/medgemma_agent.py

from openai import OpenAI
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class MedGemmaAgent:
    def __init__(self):
        self.client = OpenAI(
            base_url='http://localhost:8080/v1',
            api_key='not-needed'
        )
        self.model = 'medgemma-4b'
    
    def analyze_text(self, message: str) -> str:
        """Analyze medical text query"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are a helpful medical AI assistant. Provide accurate, empathetic medical information.'
                    },
                    {'role': 'user', 'content': message}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"MedGemma error: {e}")
            raise
    
    def analyze_image_with_text(
        self,
        text: str,
        image_base64: str,
        image_type: str = 'jpeg'
    ) -> str:
        """Analyze medical image with context"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        'role': 'user',
                        'content': [
                            {'type': 'text', 'text': text},
                            {
                                'type': 'image_url',
                                'image_url': {
                                    'url': f'data:image/{image_type};base64,{image_base64}'
                                }
                            }
                        ]
                    }
                ],
                temperature=0.5,
                max_tokens=1500
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"MedGemma multimodal error: {e}")
            raise

# Usage in views
from .medgemma_agent import MedGemmaAgent

agent = MedGemmaAgent()

@api_view(['POST'])
def analyze_message(request):
    message = request.data.get('message')
    image_base64 = request.data.get('image_base64')
    
    try:
        if image_base64:
            response = agent.analyze_image_with_text(message, image_base64)
        else:
            response = agent.analyze_text(message)
        
        return Response({'response': response})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
```

---

## ⚙️ CONFIGURATION OPTIONS

Edit `.env` to customize:

| Setting | Default | Options | Purpose |
|---------|---------|---------|---------|
| `HF_TOKEN` | required | Hugging Face token | Download model |
| `MODEL_QUANT` | `Q8_0` | `Q8_0` (4.1GB), `F16` (7.8GB) | Model size/quality |
| `GPU_LAYERS` | `35` | 0-35+ | GPU acceleration (0=CPU only) |
| `THREADS` | `4` | 1-16+ | CPU threads for processing |
| `PORT` | `8080` | Any free port | API endpoint port |
| `CONTEXT_SIZE` | `2048` | 512-4096 | Conversation memory |

---

## 🔒 SECURITY CONSIDERATIONS

1. **Never expose port 8080 to internet** - Run behind firewall
2. **Use environment variables** for sensitive data
3. **Validate user input** before sending to AI
4. **Rate limiting** - Implement request limits per user
5. **API key** - Add authentication layer in your Django views

---

## 📊 PERFORMANCE TIPS

| Setting | Effect | Recommendation |
|---------|--------|-----------------|
| GPU_LAYERS=0 | CPU only, slower | Development/testing |
| GPU_LAYERS=35 | GPU accelerated | Production if GPU available |
| Q8_0 | Faster, less accurate | Real-time chat |
| F16 | Slower, more accurate | Complex medical queries |
| THREADS=4 | Default CPU usage | Adjust based on your CPU cores |

---

## 🐛 TROUBLESHOOTING

### Server won't start
```bash
# Check if port 8080 is already in use
netstat -an | findstr :8080

# Try different port
HF_TOKEN=xxx PORT=8081 localai start medgemma-4b-cpu
```

### Out of memory error
```bash
# Reduce GPU layers or use CPU-only mode
GPU_LAYERS=15  # Instead of 35
# or
GPU_LAYERS=0   # CPU-only
```

### Slow responses
```bash
# Check if using CPU instead of GPU
# Reduce model quantization quality in .env
MODEL_QUANT=Q8_0  # Faster but less accurate
```

### Model download fails
```bash
# Manually download model
pip install huggingface-hub
huggingface-cli download meditron-7b-gguf
```

---

## 📝 NEXT STEPS

1. **Extract & test the server locally** (setup instructions above)
2. **Test API with curl/Postman** to verify it works
3. **Implement Option 1 (Simple Integration)** in your Django views
4. **Test with your frontend** 
5. **Move to Option 2 (Advanced)** if you need more features
6. **Deploy with Docker** for production

---

## 📚 USEFUL LINKS

- **MedGemma Model**: https://huggingface.co/google/medgemma-4b-it
- **LocalAI Documentation**: https://localai.io/
- **OpenAI API Docs**: https://platform.openai.com/docs/api-reference
- **Get Hugging Face Token**: https://huggingface.co/settings/tokens
- **LangChain Docs**: https://docs.langchain.com/

---

## 💡 KEY TAKEAWAY

Think of MedGemma server as a **medical AI specialist** that listens on port 8080. Your mhchat application asks it questions in a standard format (OpenAI-compatible), and it returns answers. The integration is straightforward - just send POST requests to the API endpoint!
