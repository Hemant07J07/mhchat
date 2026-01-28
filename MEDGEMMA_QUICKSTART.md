# MedGemma Integration Quick Start

## 🚀 5-Minute Setup

### Step 1: Start MedGemma Server (Terminal 1)

**Windows:**
```bash
cd c:\Users\hdube\Downloads\chat-model-server\chat-model-server-main

# Install LocalAI CLI (first time only)
pip install localai

# Run MedGemma (downloads model automatically)
localai start medgemma-4b-cpu

# ✅ Server running at http://localhost:8080
```

**Linux/Mac:**
```bash
cd chat-model-server-main
./scripts/run_linux.sh cpu
# or for GPU:
./scripts/run_linux.sh
```

**Test if running:**
```bash
curl http://localhost:8080/v1/models
```

---

### Step 2: Update Django Settings (Terminal 2)

Edit `mhchat_proj/settings.py`, add at the end:

```python
# ============ MedGemma Configuration ============
MEDGEMMA_BASE_URL = 'http://localhost:8080'
MEDGEMMA_MODEL = 'medgemma-4b'
MEDGEMMA_TIMEOUT = 60
MEDGEMMA_ENABLED = True
```

---

### Step 3: Update Django URLs

Edit `chat/urls.py`:

```python
from django.urls import path, include
from . import views

urlpatterns = [
    # ... existing paths ...
    path('api/medgemma/text/', views.medgemma_text_query, name='medgemma-text'),
    path('api/medgemma/image/', views.medgemma_image_query, name='medgemma-image'),
    path('api/medgemma/status/', views.medgemma_status, name='medgemma-status'),
]
```

---

### Step 4: Run Django

```bash
cd c:\Users\hdube\mhchat
python manage.py runserver
```

---

### Step 5: Test the Integration

**Check if MedGemma is available:**
```bash
curl http://localhost:8000/api/medgemma/status/
```

**Send a text query:**
```bash
curl -X POST http://localhost:8000/api/medgemma/text/ \
  -H "Content-Type: application/json" \
  -d '{"message": "What are symptoms of flu?"}'
```

---

## 🎨 Use in React Component

```typescript
// frontend/src/components/MedGemmaChat.tsx

import { useMedGemma } from '@/lib/medgemma';

export default function MedGemmaChat() {
  const { loading, data, error, queryText } = useMedGemma();
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await queryText(message);
    setMessage('');
  };

  return (
    <div className="chat-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a medical question..."
          disabled={loading}
        />
        <button disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
      {data?.response && <div className="response">{data.response}</div>}
    </div>
  );
}
```

---

## 📊 Common Use Cases

### 1. Simple Chat with Medical AI
```python
# Backend
from chat.medgemma_client import get_medgemma_client

client = get_medgemma_client()
response = client.analyze_text("What is diabetes?")
```

### 2. Image Analysis (X-ray, CT scan, etc.)
```python
# Backend
with open('xray.jpg', 'rb') as f:
    response = client.analyze_image(
        f,
        query="Describe this chest X-ray",
        temperature=0.5
    )
```

### 3. Conversation with History
```python
# Backend
history = [
    {"role": "user", "content": "What causes headaches?"},
    {"role": "assistant", "content": "Headaches can be caused by..."}
]

response = client.analyze_text(
    "Should I see a doctor?",
    conversation_history=history
)
```

### 4. Medical Information Lookup
```python
# Backend
result = client.get_medical_context("hypertension")
# Returns: causes, symptoms, when to see doctor, prevention tips
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Cannot connect to localhost:8080"** | Check if MedGemma server is running. Run: `localai start medgemma-4b-cpu` |
| **"Port 8080 already in use"** | Change port: `PORT=8081 localai start medgemma-4b-cpu` |
| **"Out of memory"** | Use CPU-only mode or reduce `GPU_LAYERS=15` in .env |
| **"Slow responses"** | Model is using CPU. Use GPU if available or reduce `max_tokens` |
| **"Token authentication failed"** | Make sure you're sending Bearer token in requests |

---

## 📚 File Organization

```
mhchat/
├── chat/
│   ├── medgemma_client.py         ← AI client (already created)
│   ├── views_medgemma.py          ← API endpoints (already created)
│   ├── urls_medgemma.py           ← URL routes (already created)
│   └── urls.py                    ← Add medgemma URLs here
│
├── frontend/
│   └── src/lib/
│       └── medgemma.ts            ← React hooks (already created)
│
├── mhchat_proj/
│   └── settings.py                ← Add config here
│
├── CHAT_MODEL_SERVER_INTEGRATION_GUIDE.md    (created)
└── MEDGEMMA_SETTINGS_GUIDE.md                (created)
```

---

## ✅ Checklist

- [ ] Extract MedGemma server from zip
- [ ] Start MedGemma server (port 8080)
- [ ] Add settings to `settings.py`
- [ ] Copy `medgemma_client.py` to chat folder
- [ ] Copy `views_medgemma.py` to chat folder
- [ ] Add URLs to `chat/urls.py`
- [ ] Copy `medgemma.ts` to frontend
- [ ] Test endpoint: `curl http://localhost:8000/api/medgemma/status/`
- [ ] Create React component using `useMedGemma` hook
- [ ] Test chat functionality

---

## 🎯 Next Steps

1. **Immediate**: Get MedGemma server running
2. **Short-term**: Integrate basic chat into your app
3. **Medium-term**: Add image analysis features
4. **Long-term**: Build medical-specific features (symptom checker, etc.)

---

## 💡 Pro Tips

1. **Faster responses**: Use `max_tokens=500` for quick answers
2. **Better accuracy**: Use `temperature=0.3` for factual queries
3. **Cost optimization**: Cache responses for common questions
4. **User experience**: Show loading spinner while AI thinks
5. **Security**: Always validate user input before sending to AI

---

## 🆘 Need Help?

- **MedGemma not starting?** → Check .env file has HF_TOKEN
- **Django not finding medgemma_client?** → Make sure files are in `chat/` folder
- **React component not working?** → Check Bearer token is being sent
- **Slow responses?** → Check if using GPU or reduce max_tokens

---

## 📞 Support Resources

- **MedGemma**: https://huggingface.co/google/medgemma-4b-it
- **LocalAI**: https://localai.io/
- **Django REST**: https://www.django-rest-framework.org/
- **Hugging Face**: https://huggingface.co/

---

**Happy coding! 🎉**
