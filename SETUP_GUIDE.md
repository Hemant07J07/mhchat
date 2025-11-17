# MHChat - AI-Powered Mental Health Support Chat Application

A modern, full-stack mental health support chat application built with **Django** (backend) and **Next.js** (frontend) with real-time messaging capabilities.

## 🎯 Features

- **Modern Chat Interface** - Beautiful, responsive UI with dark mode support
- **Real-time Messaging** - Instant message delivery with WebSocket support
- **User Authentication** - JWT-based authentication with login/register
- **Conversation Management** - Create, view, and delete conversations
- **AI Integration Ready** - Hooks for LLM-based responses
- **User Profiles** - Customizable user profiles with consent tracking
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **State Management** - Zustand for efficient client-side state
- **CORS-Enabled** - Proper CORS configuration for frontend-backend communication

## 📁 Project Structure

```
mhchat/
├── frontend/                 # Next.js React frontend
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   │   ├── page.tsx     # Main chat page
│   │   │   ├── login/       # Login page
│   │   │   └── layout.tsx   # Root layout
│   │   ├── components/       # Reusable React components
│   │   │   ├── Message.tsx  # Message display component
│   │   │   ├── MessageInput.tsx # Input component
│   │   │   └── Sidebar.tsx  # Sidebar navigation
│   │   └── lib/
│   │       ├── api.ts       # Axios API client
│   │       └── store.ts     # Zustand state management
│   └── package.json
│
├── mhchat_proj/             # Django project settings
│   ├── settings.py          # Django configuration
│   ├── urls.py              # URL routing
│   ├── asgi.py              # ASGI config for WebSockets
│   ├── wsgi.py              # WSGI config for deployment
│   └── celery.py            # Celery task queue config
│
├── chat/                    # Django chat app
│   ├── models.py            # Database models
│   ├── views.py             # API views and endpoints
│   ├── serializers.py       # DRF serializers
│   ├── urls.py              # App URL routing
│   ├── consumers.py         # WebSocket consumers
│   └── tasks.py             # Celery tasks
│
├── manage.py                # Django management script
├── requirements.txt         # Python dependencies
├── docker-compose.yml       # Docker container orchestration
├── dockerfile               # Docker image definition
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Redis (for WebSockets and Celery)
- PostgreSQL (optional, SQLite works for development)

### Backend Setup

1. **Clone and navigate to the project:**
   ```bash
   cd c:\Users\hdube\mhchat
   ```

2. **Create a Python virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (admin account):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

   Backend will be available at: `http://localhost:8000`
   Admin panel: `http://localhost:8000/admin`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   NEXT_PUBLIC_WS_HOST=ws
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:3000`

## 🔐 Authentication Flow

### User Registration
```
POST /api/auth/register/
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword"
}
```

### User Login
```
POST /api/auth/login/
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "username",
    "email": "user@example.com"
  }
}
```

The `access` token is stored in `localStorage` and sent with every API request in the Authorization header:
```
Authorization: Bearer <access_token>
```

## 💬 API Endpoints

### Conversations
- **GET** `/api/conversations/` - List user's conversations
- **POST** `/api/conversations/` - Create a new conversation
- **GET** `/api/conversations/{id}/` - Get conversation details
- **DELETE** `/api/conversations/{id}/` - Delete a conversation

### Messages
- **GET** `/api/conversations/{id}/messages/` - Get messages in a conversation
- **POST** `/api/conversations/{id}/messages/` - Send a message
  ```json
  {
    "text": "Hello, I need help",
    "sender": "user"
  }
  ```
- **DELETE** `/api/conversations/{id}/messages/{msg_id}/` - Delete a message

### User Profile
- **GET** `/api/profile/` - Get current user profile
- **PATCH** `/api/profile/update/` - Update user profile
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "timezone": "America/New_York"
  }
  ```
- **POST** `/api/profile/accept-consent/` - Accept terms and conditions

### Authentication
- **POST** `/api/auth/register/` - Register new user
- **POST** `/api/auth/login/` - Login user
- **POST** `/api/auth/logout/` - Logout user
- **POST** `/api/token/` - Obtain JWT token (alternative method)
- **POST** `/api/token/refresh/` - Refresh JWT token

## 🛠️ Environment Variables

### Backend (`.env` file)
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000
DATABASE_URL=sqlite:///db.sqlite3
REDIS_HOST=localhost
REDIS_PORT=6379
USE_LLM=1
```

### Frontend (`.env.local` file)
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_HOST=ws
```

## 📦 Dependencies

### Backend
- **Django 5.2+** - Web framework
- **Django REST Framework** - REST API
- **djangorestframework-simplejwt** - JWT authentication
- **django-cors-headers** - CORS support
- **Celery** - Task queue
- **Channels** - WebSocket support
- **Redis** - Cache and message broker
- **psycopg2** - PostgreSQL adapter

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **TypeScript** - Type safety

## 🐳 Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose up -d
```

This will start:
- Django backend on `http://localhost:8000`
- Next.js frontend on `http://localhost:3000`
- Redis on port 6379
- PostgreSQL on port 5432

## 📝 API Usage Examples

### Creating a Conversation and Sending a Message

```javascript
// 1. Create a conversation
const convResponse = await fetch('http://localhost:8000/api/conversations/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
const conversation = await convResponse.json();

// 2. Send a message
const msgResponse = await fetch(
  `http://localhost:8000/api/conversations/${conversation.id}/messages/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: 'Hello, I need support',
      sender: 'user'
    })
  }
);
const message = await msgResponse.json();
```

## 🔄 WebSocket for Real-Time Messaging

WebSocket support is configured but requires:
1. Running Celery worker: `celery -A mhchat_proj worker -l info`
2. Running Channels consumer
3. Redis for message brokering

Connect to WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/chat/');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('New message:', message);
};
```

## 🎨 UI Components

### Message Component
Displays individual messages with sender information and timestamps.

### MessageList Component
Scrollable container for messages with auto-scroll to bottom.

### MessageInput Component
Text area with send button, supports Shift+Enter for new lines.

### Sidebar Component
Collapsible sidebar with conversation list and new chat button.

## 🔒 Security Features

- ✅ CSRF protection enabled
- ✅ JWT authentication
- ✅ CORS whitelist enforcement
- ✅ Password hashing with Django's built-in system
- ✅ User isolation (users can only access their own conversations)
- ✅ Secure HTTP-only cookie support

## 🧪 Testing

### Run Django Tests
```bash
python manage.py test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## 📱 Responsive Design Breakpoints

- **Mobile** - < 640px (sm)
- **Tablet** - 640px - 1024px (md/lg)
- **Desktop** - > 1024px (xl)

All components are fully responsive and work seamlessly across devices.

## 🚨 Troubleshooting

### CORS Errors
- Ensure `CORS_ALLOWED_ORIGINS` in `settings.py` includes your frontend URL
- Check that frontend `.env.local` has correct `NEXT_PUBLIC_API_BASE`

### Authentication Issues
- Verify JWT token is being sent in Authorization header
- Check token expiration time in `SIMPLE_JWT` settings
- Clear localStorage and try logging in again

### WebSocket Connection Issues
- Ensure Redis is running: `redis-cli ping` should return PONG
- Check `CHANNEL_LAYERS` configuration in `settings.py`
- Verify WebSocket URL matches your backend host

### Database Issues
- Run migrations: `python manage.py migrate`
- Create tables: `python manage.py makemigrations`
- Reset database: `python manage.py flush` (caution: deletes all data)

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)
- [JWT Authentication](https://jwt.io/)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check existing issues in the repository
2. Review the troubleshooting section above
3. Check Django and Next.js documentation
4. Create a new issue with detailed description

---

**Last Updated:** November 2025
**Version:** 1.0.0

Happy coding! 🎉
