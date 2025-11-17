# MHChat - AI-Powered Mental Health Chatbot

MHChat is a modern, full-stack web application that combines a Django backend with a Next.js frontend to provide an intelligent conversational AI assistant focused on mental health support.

## Features

- **AI-Powered Conversations**: Intelligent chatbot powered by GPT for natural, context-aware responses
- **Conversation Management**: Create, view, and delete conversations easily
- **Real-time Updates**: WebSocket support for real-time messaging
- **User Authentication**: JWT-based authentication system
- **Responsive Design**: Modern UI built with Next.js, React, and Tailwind CSS
- **NLP Capabilities**: Intent recognition and NLU processing
- **RAG Support**: Retrieval-Augmented Generation for enhanced responses

## Tech Stack

### Backend
- **Framework**: Django 5.x
- **Language**: Python 3.x
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **Task Queue**: Celery with Redis
- **API**: Django REST Framework
- **WebSocket**: Django Channels
- **AI**: OpenAI GPT, Hugging Face Transformers

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **State Management**: Zustand
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
│   ├── ai.py                      # AI/GPT integration
│   ├── rag.py                     # RAG implementation
│   ├── nlp.py                     # NLP processing
│   ├── jwt_auth.py                # JWT authentication
│   └── migrations/                # Database migrations
├── mhchat_proj/                   # Django project settings
│   ├── settings.py                # Project configuration
│   ├── asgi.py                    # ASGI config (WebSocket)
│   ├── celery.py                  # Celery configuration
│   └── urls.py                    # URL routing
├── frontend/                      # Next.js application
│   ├── src/
│   │   ├── app/                   # App directory (pages)
│   │   ├── components/            # React components
│   │   └── lib/                   # Utilities and hooks
│   ├── package.json               # Dependencies
│   └── tailwind.config.js         # Tailwind configuration
├── scripts/                       # Utility scripts
│   └── train_intent.py            # Intent model training
├── data/                          # Data files
│   └── intent_samples.csv         # Training data
├── docker-compose.yml             # Docker services
├── dockerfile                     # Docker image
├── manage.py                      # Django CLI
└── requirements.txt               # Python dependencies
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- Docker (optional, for containerization)

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

### Celery Setup (Optional)

For asynchronous task processing:

```bash
python -m celery -A mhchat_proj.celery worker --loglevel=info -P solo
```

## Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose up --build
```

This will start:
- Django backend on http://localhost:8000
- Next.js frontend on http://localhost:3000
- Database and cache services

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# OpenAI
OPENAI_API_KEY=your-api-key-here

# JWT
JWT_SECRET=your-jwt-secret-here

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0
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
- `GET /api/conversations/` - List all conversations
- `POST /api/conversations/` - Create new conversation
- `GET /api/conversations/{id}/` - Get conversation details
- `DELETE /api/conversations/{id}/` - Delete conversation
- `POST /api/messages/` - Send message
- `GET /api/messages/{id}/` - Get message

### WebSocket
- `ws://localhost:8000/ws/chat/{conversation_id}/` - Real-time chat connection

## Usage

1. **Start a Conversation**: Click "New chat" in the sidebar to create a new conversation
2. **Send Messages**: Type your message and press Enter or click the send button
3. **View History**: All conversations are saved and displayed in the sidebar
4. **Delete Conversation**: Select a conversation and click the delete icon

## Development

### Running Tests

Backend:
```bash
python manage.py test
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
- `sender`: 'user' or 'ai'
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
python manage.py runserver 8001
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

- OpenAI for GPT API
- Hugging Face for transformer models
- Django and Next.js communities
- All contributors who have helped with the project

---

**Status**: Active Development
**Last Updated**: November 2025
