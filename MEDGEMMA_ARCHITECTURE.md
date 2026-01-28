# MedGemma Integration Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Your Web Application                            │
│                       (mhchat - React/Django)                           │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
        ┌────────▼────────┐            ┌──────────▼──────────┐
        │   Frontend      │            │   Django Backend    │
        │  (Next.js/React)│            │   (Python/DRF)      │
        └────────┬────────┘            └──────────┬──────────┘
                 │                                 │
                 │      REST API Calls            │
                 │      (JSON)                    │
                 │                                │
         ┌───────┴────────────────────────────────┴────────┐
         │                                                 │
         │    MedGemma Integration Layer                 │
         │                                                │
         │  ┌──────────────────────────────────────┐    │
         │  │   medgemma_client.py (API Wrapper)  │    │
         │  │   - analyze_text()                  │    │
         │  │   - analyze_image()                 │    │
         │  │   - get_medical_context()           │    │
         │  │   - is_available()                  │    │
         │  └──────────────────────────────────────┘    │
         │                                                │
         │  ┌──────────────────────────────────────┐    │
         │  │   views_medgemma.py (REST Endpoints)│    │
         │  │   - /api/medgemma/text/             │    │
         │  │   - /api/medgemma/image/            │    │
         │  │   - /api/medgemma/status/           │    │
         │  │   - /api/medgemma/context/          │    │
         │  └──────────────────────────────────────┘    │
         │                                                │
         └───────────────┬──────────────────────────────┘
                         │
                  HTTP Requests to:
                http://localhost:8080
                         │
         ┌───────────────▼──────────────────┐
         │                                   │
         │  MedGemma Server (LocalAI)       │
         │  (Separate Python Process)       │
         │                                   │
         │  ┌─────────────────────────────┐ │
         │  │  OpenAI Compatible API      │ │
         │  │  /v1/chat/completions      │ │
         │  │  /v1/models                │ │
         │  └──────────────┬──────────────┘ │
         │                 │                 │
         │  ┌──────────────▼──────────────┐ │
         │  │   MedGemma 4B Model        │ │
         │  │   (4-8GB, GGUF Format)     │ │
         │  │   + LangChain Integration  │ │
         │  └─────────────────────────────┘ │
         │                                   │
         │  Runs on:                         │
         │  - CPU (slower, no GPU needed)   │
         │  - NVIDIA GPU (faster)           │
         │  - Apple Metal (for Macs)        │
         │                                   │
         └───────────────────────────────────┘
```

---

## 🔄 Request/Response Flow

### Text Query Flow
```
User Question
    ↓
React Component (useMedGemma hook)
    ↓
POST /api/medgemma/text/ (with message)
    ↓
Django views_medgemma.medgemma_text_query()
    ↓
MedGemmaClient.analyze_text()
    ↓
HTTP POST to http://localhost:8080/v1/chat/completions
    ↓
MedGemma Server processes request
    ↓
Returns JSON with AI response
    ↓
Django extracts response content
    ↓
Saves to database (optional)
    ↓
Returns JSON to frontend
    ↓
React displays response to user
```

### Image Analysis Flow
```
User Uploads Image + Question
    ↓
React Component
    ↓
POST /api/medgemma/image/ (multipart/form-data)
    ↓
Django validates image
    ↓
MedGemmaClient.analyze_image()
    ↓
Encodes image to base64
    ↓
HTTP POST with:
  - Text query
  - Base64 encoded image
    ↓
MedGemma Server (multimodal analysis)
    ↓
Returns detailed analysis
    ↓
Django processes response
    ↓
Returns to frontend
    ↓
React displays analysis results
```

---

## 📁 File Structure

```
mhchat/
├── mhchat_proj/
│   └── settings.py
│       └── Add MEDGEMMA_* config variables
│
├── chat/
│   ├── medgemma_client.py           ← NEW: API client
│   ├── views_medgemma.py            ← NEW: REST endpoints
│   ├── urls_medgemma.py             ← NEW: URL routing
│   ├── urls.py                      ← EDIT: Add medgemma URLs
│   ├── models.py                    (existing Message, Conversation)
│   └── views.py                     (existing chat views)
│
├── frontend/
│   └── src/
│       ├── lib/
│       │   └── medgemma.ts          ← NEW: React hooks
│       │       ├── MedGemmaAPI class
│       │       ├── useMedGemma hook
│       │       └── Example components
│       │
│       └── components/
│           ├── MedGemmaChatBox.tsx  (use useMedGemma)
│           └── MessageInput.tsx     (call queryText)
│
├── Documentation/
│   ├── MEDGEMMA_QUICKSTART.md                    ← START HERE
│   ├── CHAT_MODEL_SERVER_INTEGRATION_GUIDE.md    (detailed)
│   ├── MEDGEMMA_SETTINGS_GUIDE.md                (config)
│   ├── MEDGEMMA_INTEGRATION_SUMMARY.md           (overview)
│   └── MEDGEMMA_REQUIREMENTS.txt                 (dependencies)
│
└── chat-model-server/                 (extracted zip)
    ├── config/                        (model configs)
    ├── scripts/                       (startup scripts)
    ├── docker/                        (container files)
    └── example/                       (reference implementation)
```

---

## 🔌 API Endpoints

### Text Query
```
POST /api/medgemma/text/

Request:
{
  "message": "What are symptoms of flu?",
  "conversation_id": 123,        (optional)
  "temperature": 0.7,            (optional)
  "max_tokens": 1000             (optional)
}

Response:
{
  "success": true,
  "response": "Flu symptoms typically include...",
  "model": "medgemma-4b"
}
```

### Image Analysis
```
POST /api/medgemma/image/

Request: multipart/form-data
- image: <file>
- query: "Describe this X-ray"
- conversation_id: 123 (optional)

Response:
{
  "success": true,
  "response": "This X-ray shows...",
  "image_name": "xray.jpg"
}
```

### Status Check
```
GET /api/medgemma/status/

Response:
{
  "available": true,
  "endpoint": "http://localhost:8080",
  "model": "medgemma-4b"
}
```

### Medical Context
```
POST /api/medgemma/context/

Request:
{
  "symptom": "fever",
  "conversation_id": 123 (optional)
}

Response:
{
  "success": true,
  "symptom": "fever",
  "context": "Fever can be caused by..."
}
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────┐
│   User Browser / Client             │
└──────────────────┬──────────────────┘
                   │
        HTTPS/TLS (Recommended)
                   │
         ┌─────────▼──────────┐
         │  Django Web Server │
         │                    │
         │  ✅ CORS enabled   │
         │  ✅ Auth required  │
         │  ✅ Input validate │
         │  ✅ CSRF protected │
         └─────────┬──────────┘
                   │
     HTTP (Local Network Only)
                   │
    ┌──────────────▼──────────────┐
    │  MedGemma Server (Port 8080)│
    │                             │
    │  ⚠️ NOT exposed to internet │
    │  ✅ Firewall protected      │
    │  ✅ Input validated         │
    └─────────────────────────────┘
```

---

## 📊 Data Flow Example

### Complete Request-Response Cycle:

```
┌─────────────────────────────────────────────────────────────────┐
│ User Types: "What causes diabetes?"                            │
└─────────────────────────────────────┬───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ React Component:                                                │
│ <MedGemmaChatBox />                                            │
│ Calls: queryText("What causes diabetes?")                     │
└─────────────────────────────────────┬───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend HTTP Request:                                         │
│ POST /api/medgemma/text/                                      │
│ Headers: {                                                     │
│   "Authorization": "Bearer <token>",                           │
│   "Content-Type": "application/json"                           │
│ }                                                              │
│ Body: {                                                        │
│   "message": "What causes diabetes?"                           │
│ }                                                              │
└─────────────────────────────────────┬───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Django Endpoint:                                               │
│ views_medgemma.medgemma_text_query()                          │
│                                                                 │
│ 1. Check authentication ✅                                     │
│ 2. Validate input ✅                                           │
│ 3. Check server availability ✅                               │
└─────────────────────────────────────┬───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ MedGemma Client:                                               │
│ client.analyze_text("What causes diabetes?")                  │
│                                                                 │
│ Creates request:                                               │
│ POST http://localhost:8080/v1/chat/completions               │
│ {                                                              │
│   "model": "medgemma-4b",                                     │
│   "messages": [                                                │
│     {"role": "system", "content": "You are a medical..."},   │
│     {"role": "user", "content": "What causes diabetes?"}    │
│   ],                                                           │
│   "temperature": 0.7,                                         │
│   "max_tokens": 1000                                          │
│ }                                                              │
└─────────────────────────────────────┬───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ MedGemma Server:                                               │
│ - Receives request                                            │
│ - Loads model in memory                                       │
│ - Processes tokens through neural network                     │
│ - Generates response token by token                           │
│ - Returns JSON:                                                │
│ {                                                              │
│   "choices": [{                                                │
│     "message": {                                               │
│       "content": "Diabetes is a metabolic disorder..."        │
│     }                                                          │
│   }]                                                           │
│ }                                                              │
└─────────────────────────────────────┬───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Django Processing:                                             │
│ 1. Extract response content ✅                                │
│ 2. Save to database ✅                                        │
│ 3. Format as JSON ✅                                          │
│ 4. Return to frontend ✅                                      │
└─────────────────────────────────────┬───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend Response:                                             │
│ {                                                              │
│   "success": true,                                            │
│   "response": "Diabetes is a metabolic disorder..."           │
│ }                                                              │
└─────────────────────────────────────┬───────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ React Updates UI:                                              │
│ - Adds AI response to chat history                            │
│ - Shows response to user                                      │
│ - Ready for next message                                      │
└─────────────────────────────────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ User Sees:                                                     │
│ Assistant: "Diabetes is a metabolic disorder where..."        │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration Variables

```
┌──────────────────────────────────────┐
│    settings.py Variables              │
├──────────────────────────────────────┤
│ MEDGEMMA_BASE_URL                    │ → http://localhost:8080
│ MEDGEMMA_MODEL                       │ → medgemma-4b
│ MEDGEMMA_TIMEOUT                     │ → 60 seconds
│ MEDGEMMA_ENABLED                     │ → True/False
│ MEDGEMMA_DEFAULT_TEMPERATURE         │ → 0.7
│ MEDGEMMA_DEFAULT_MAX_TOKENS          │ → 1000
│ MEDGEMMA_IMAGE_TEMPERATURE           │ → 0.5
│ MEDGEMMA_IMAGE_MAX_TOKENS            │ → 1500
│ MEDGEMMA_MAX_IMAGE_SIZE              │ → 10MB
│ MEDGEMMA_ALLOWED_FORMATS             │ → jpg, png, gif, bmp
└──────────────────────────────────────┘
```

---

## 🎯 Key Integration Points

```
Your Application
    ├── Chat Module
    │   ├── medgemma_client.py          ← Talk to MedGemma
    │   ├── views_medgemma.py           ← Expose as API
    │   ├── models.py                   ← Store messages
    │   └── urls.py                     ← Route requests
    │
    ├── Authentication
    │   └── Django User Model           ← Verify user
    │
    ├── Database
    │   ├── Conversation model          ← Store history
    │   └── Message model               ← Store Q&A
    │
    └── Frontend
        └── medgemma.ts                 ← React hooks
            ├── MedGemmaAPI class
            ├── useMedGemma hook
            └── Components
```

---

## 🚀 Deployment Architecture

```
Production Environment:

┌──────────────────────────────────────────────────────┐
│             User's Browser / Mobile App              │
└────────────────────┬─────────────────────────────────┘
                     │
                HTTPS (Internet)
                     │
    ┌────────────────▼────────────────┐
    │  Reverse Proxy (nginx)          │
    │  - SSL/TLS termination          │
    │  - Rate limiting                │
    │  - Compression                  │
    └────────────────┬────────────────┘
                     │
                HTTP (Local Network)
                     │
    ┌────────────────▼────────────────────────┐
    │  Django Application Server               │
    │  (gunicorn / uwsgi)                     │
    │  ├── medgemma_client.py                │
    │  ├── REST API endpoints                │
    │  └── Database ORM                      │
    └────────────────┬────────────────────────┘
                     │
            HTTP (Local Network)
                     │
    ┌────────────────▼────────────────────────┐
    │  MedGemma Server (Docker Container)     │
    │  ├── LocalAI Framework                 │
    │  ├── MedGemma 4B Model (4-8GB)         │
    │  └── GPU Support (NVIDIA/AMD)          │
    └────────────────────────────────────────┘
                     │
    ┌────────────────▼────────────────────────┐
    │  PostgreSQL Database                    │
    │  ├── Conversations                      │
    │  ├── Messages                           │
    │  └── User Data                          │
    └────────────────────────────────────────┘
```

---

**This architecture ensures**:
- ✅ Security: MedGemma not exposed to internet
- ✅ Scalability: Multiple Django instances possible
- ✅ Reliability: Docker containers auto-restart
- ✅ Performance: Local network communication
- ✅ Privacy: Data stays on your servers
