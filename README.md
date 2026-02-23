# MHChat - Mental Health Chat (single ML brain)

MHChat is a web application with a Next.js frontend and an optional Django backend. All “brain” functionality (intent + crisis detection + KB retrieval) is provided by the separate **mhchat-ml** FastAPI service.

## Features

- **Single “brain”**: mhchat-ml is the only ML service used end-to-end
- **Safety-first responses**: crisis detection produces an emergency-safe response
- **KB-grounded suggestions**: non-crisis responses are built from KB hits
- **Modern chat UI**: Next.js + React + Tailwind
- **Optional backend**: Django + DRF + Channels for persistence/auth/WS (legacy/optional)

## Tech Stack

### ML Brain (mhchat-ml)
- **Framework**: FastAPI
- **Language**: Python
- **Endpoint**: `POST /predict` → `{ intent, intent_score, crisis, kb_hits }`

### Backend (optional)
- **Framework**: Django 5.x + Django REST Framework
- **WebSocket**: Django Channels (in-memory layer by default)
- **Background jobs**: none required (synchronous pipeline; no Celery/Redis dependency)

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Server routes**: Next.js API routes proxy mhchat-ml (avoids CORS)
- **Build Tool**: npm/yarn
- **UI Components**: Custom React components

## Project Structure

```
mhchat/
├── chat/                          # Django app
│   ├── models.py                  # Database models
│   ├── views.py                   # API views
│   ├── consumers.py               # WebSocket consumers
│   ├── serializers.py             # DRF serializers
│   ├── ml_brain_client.py          # mhchat-ml client (server-side)
│   ├── nlp.py                     # NLP processing
│   ├── jwt_auth.py                # JWT authentication
│   └── migrations/                # Database migrations
├── mhchat_proj/                   # Django project settings
│   ├── settings.py                # Project configuration
│   ├── asgi.py                    # ASGI config (WebSocket)
│   ├── celery.py                  # (legacy) Celery config file (not required)
│   └── urls.py                    # URL routing
├── frontend/                      # Next.js application
│   ├── src/
│   │   ├── app/                   # App directory (pages)
│   │   ├── components/            # React components
│   │   └── lib/                   # Utilities and hooks
│   ├── package.json               # Dependencies
│   └── tailwind.config.js         # Tailwind configuration
├── run_complete_tests.py           # End-to-end sanity checks (Django pipeline)
├── docker-compose.yml             # Docker services
├── dockerfile                     # Docker image
├── manage.py                      # Django CLI
└── requirements.txt               # Python dependencies
```

Note: the ML service lives in a sibling folder/repo: `../mhchat-ml`.

## Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (optional, for containerization)

You also need the **mhchat-ml** service available (see “Run mhchat-ml”).

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/Hemant07J07/mhchat.git
cd mhchat
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/Scripts/activate  # On Windows
# or
source venv/bin/activate      # On macOS/Linux
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Apply migrations:
```bash
python manage.py migrate
```

5. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env.local  # If available
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Run mhchat-ml (required for ML responses)

In a separate terminal, from the `mhchat-ml` repo:

```powershell
python -m uvicorn src.api.main:app --reload --port 8001
```

Docs: http://127.0.0.1:8001/docs

## Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- Django backend (ASGI) on http://localhost:8000
- Postgres database

Run these separately:
- mhchat-ml on http://localhost:8001
- Next.js frontend on http://localhost:3000

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (optional; if unset, Django uses SQLite)
POSTGRES_DB=mhchat
POSTGRES_USER=mhchat
POSTGRES_PASSWORD=mhchatpass
DB_HOST=db
DB_PORT=5432

# JWT
JWT_SECRET=your-jwt-secret-here

# Channels (optional Redis; default is in-memory)
CHANNEL_LAYER_BACKEND=memory
# If CHANNEL_LAYER_BACKEND=redis:
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ML brain (used by Django AND Next.js proxy)
MHCHAT_ML_API_BASE=http://127.0.0.1:8001

# Next.js ML proxy timeout (optional)
MHCHAT_ML_TIMEOUT_MS=8000

# Frontend optional
NEXT_PUBLIC_HUMAN_SUPPORT_EMAIL=support@example.com
```

### Settings

Backend configuration is in `mhchat_proj/settings.py`. Key settings:
- Database configuration
- Installed apps
- Middleware
- Static files
- WebSocket configuration

## API Endpoints

### Chat Endpoints
- `GET /api/conversations/` - List conversations
- `POST /api/conversations/` - Create a conversation
- `GET /api/conversations/{id}/` - Get conversation details
- `DELETE /api/conversations/{id}/` - Delete a conversation
- `GET /api/conversations/{id}/messages/` - List messages in a conversation
- `POST /api/conversations/{id}/messages/` - Create a user message (triggers synchronous bot/system response)

### WebSocket
- `ws://localhost:8000/ws/conversations/{conversation_id}/` - Real-time chat connection

### Next.js ML Proxy
- `POST /api/ml/predict` - Proxy to mhchat-ml `/predict` and builds a safe short reply
- `GET /api/ml/health` - Basic upstream health check

## Usage

### Current Next.js demo chat

1. Start **mhchat-ml** on port `8001`
2. Start the **Next.js frontend** on port `3000`
3. Open http://localhost:3000 and send a message

Notes:
- The current UI calls mhchat-ml via the Next.js proxy (`/api/ml/predict`) and keeps chat history in memory.
- If mhchat-ml flags `crisis=true`, the UI will show a crisis-safe response flow.

### Django-backed chat (optional / legacy)

If you use the Django REST endpoints and/or WebSockets, run the Django server and use the `/api/conversations/...` endpoints listed above.

## Development

### Running Tests

Backend:
```bash
python manage.py test
```

End-to-end sanity checks:
```bash
python run_complete_tests.py
```

Frontend:
```bash
npm test
```

### Code Style

Backend (Python):
```bash
python -m black .
python -m flake8 .
```

Frontend (TypeScript/JavaScript):
```bash
npm run lint
npm run format
```

## Database Models

### Conversation
- `id`: Primary key
- `user`: Foreign key to User
- `started_at`: Timestamp
- `title`: Conversation title (optional)

### Message
- `id`: Primary key
- `conversation`: Foreign key to Conversation
- `sender`: 'user' | 'bot' | 'system'
- `text`: Message content
- `created_at`: Timestamp
- `options`: Additional metadata

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
python manage.py runserver 8002
```

### mhchat-ml Issues

**Port already in use:**
```bash
python -m uvicorn src.api.main:app --reload --port 8002
```

**Database errors:**
```bash
python manage.py migrate --run-syncdb
```

### Frontend Issues

**npm dependencies conflict:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
npm run dev -- -p 3001
```

## Performance Optimization

- Database queries are optimized with `select_related` and `prefetch_related`
- Frontend uses code splitting and lazy loading
- Caching strategies implemented for API responses
- WebSocket connection pooling for real-time updates

## Security

- JWT-based authentication
- CORS protection
- CSRF tokens in forms
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure WebSocket connections (WSS in production)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@mhchat.com or open an issue on the GitHub repository.

## Acknowledgments

- Hugging Face for transformer models
- Django and Next.js communities
- All contributors who have helped with the project

---

**Status**: Active Development
**Last Updated**: February 2026
