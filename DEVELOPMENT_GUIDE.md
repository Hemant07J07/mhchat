# MHChat - Complete Development & Integration Guide

## 🎯 Project Overview

MHChat is a modern, full-stack mental health support chat application with:
- **Backend**: Django REST API with JWT authentication
- **Frontend**: Next.js React app with Tailwind CSS
- **Real-time**: WebSocket support via Django Channels
- **Database**: PostgreSQL-ready (SQLite for development)
- **Task Queue**: Celery for async operations

## 📦 What's Been Implemented

### ✅ Frontend (Complete & Ready)

#### Pages
1. **Login Page** (`/login`)
   - Beautiful gradient background (blue → purple → pink)
   - Email/password authentication
   - Sign-up link
   - Demo credentials button
   - Error message display

2. **Chat Page** (`/`)
   - Two-column layout: Sidebar + Chat area
   - Automatic conversation loading
   - Create new conversation button
   - Message display with timestamps
   - Real-time message input
   - Collapsible sidebar for mobile

#### Components
1. **Sidebar** - Conversation list with collapsible menu
2. **MessageList** - Auto-scrolling message container
3. **Message** - Individual message with sender info
4. **MessageInput** - Text input with send button

#### Features
- JWT token management
- Automatic error handling
- Responsive design (mobile, tablet, desktop)
- Dark mode support (via Tailwind)
- Loading states and animations
- Optimistic UI updates
- Auto-scroll to latest messages

#### Styling
- Tailwind CSS for utility-first styling
- Custom animations and transitions
- Gradient backgrounds
- Responsive breakpoints
- Dark mode classes

### ✅ Backend (Enhanced for Frontend)

#### API Endpoints
```
Authentication:
  POST   /api/auth/register/         - Register new user
  POST   /api/auth/login/            - Login user
  POST   /api/auth/logout/           - Logout user
  POST   /api/token/                 - JWT token obtain
  POST   /api/token/refresh/         - JWT token refresh

Conversations:
  GET    /api/conversations/         - List user's conversations
  POST   /api/conversations/         - Create new conversation
  GET    /api/conversations/{id}/    - Get conversation details
  DELETE /api/conversations/{id}/    - Delete conversation

Messages:
  GET    /api/conversations/{id}/messages/     - Get messages
  POST   /api/conversations/{id}/messages/    - Send message
  DELETE /api/conversations/{id}/messages/{msg_id}/ - Delete message

Profile:
  GET    /api/profile/               - Get user profile
  PATCH  /api/profile/update/        - Update profile
  POST   /api/profile/accept-consent/ - Accept T&C
```

#### Security Features
- CORS whitelist enabled
- CSRF token support
- JWT authentication
- User data isolation
- Password hashing
- Token expiration (1 hour access, 7 days refresh)

#### Database Models
- User (Django built-in)
- UserProfile (custom fields: phone, timezone, consent)
- Conversation (user-specific)
- Message (linked to conversation)
- MessageEmbedding (for RAG/search)

### ✅ State Management (Zustand)

Store manages:
- List of conversations
- Current selected conversation
- All messages in current conversation
- Current user info
- Loading and error states
- All API calls and UI state

### ✅ API Client (Axios)

Features:
- Automatic JWT token injection
- CSRF token handling
- Error handling with 401 redirect
- Request/response interceptors
- All endpoints typed with TypeScript
- Base URL from environment

## 🚀 Getting Started

### Prerequisites
- Python 3.10+ with venv
- Node.js 18+ with npm
- Redis (for production, optional for dev)

### Quick Setup

#### Option 1: Windows
```bash
cd c:\Users\hdube\mhchat
.\setup.bat
```

#### Option 2: Linux/Mac
```bash
cd /path/to/mhchat
chmod +x setup.sh
./setup.sh
```

#### Option 3: Manual Setup

**Backend:**
```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin
- API Documentation: http://localhost:8000/api/

## 🔐 Authentication Flow

```
1. User opens http://localhost:3000 → Redirects to /login
2. User enters email and password
3. Frontend POST → /api/auth/login/
4. Backend validates and returns JWT tokens
5. Frontend stores access token in localStorage
6. User redirected to /
7. All subsequent requests include: Authorization: Bearer {token}
8. Backend validates JWT for each request
9. User data isolated per user
```

## 💬 Chat Flow

```
1. Load conversations: GET /api/conversations/
2. Select/create conversation
3. Load messages: GET /api/conversations/{id}/messages/
4. User types and clicks send
5. POST /api/conversations/{id}/messages/
6. Backend stores message
7. Frontend updates UI with message
8. Optional: Backend processes via Celery task
9. System generates bot response (if AI enabled)
10. Bot response appears in UI
```

## 🎨 UI/UX Highlights

### Color Scheme
- **Primary**: Blue (#3b82f6)
- **Secondary**: Purple (#a855f7)
- **Accent**: Gradient: blue → purple → pink
- **Background**: White/Black (dark mode)
- **Text**: Gray-900 (light), Gray-50 (dark)

### Typography
- Headlines: Bold, 24-28px
- Body: Regular, 14-16px
- Captions: 12px, muted color
- Font: System fonts (Apple/Roboto/Ubuntu)

### Components
- Buttons: 44px min height (mobile accessible)
- Inputs: 44px height with focus rings
- Messages: Max-width containers for readability
- Sidebar: Collapsible on mobile (< 640px)
- Animations: Subtle fade-in/slide transitions

### Responsive Layout
```
Mobile (< 640px):
  - Single column
  - Full-width inputs
  - Collapsible sidebar
  - Stacked buttons

Tablet (640-1024px):
  - Two column with adjusted sidebar
  - Optimized spacing
  - Touch-friendly sizes

Desktop (> 1024px):
  - Full layout
  - Wide sidebar
  - Multiple columns possible
```

## 🔧 Configuration

### Backend (`mhchat_proj/settings.py`)

**JWT Configuration:**
```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
}
```

**CORS Configuration:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

**REST Framework:**
```python
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
}
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_HOST=ws://localhost:8000
```

## 🧪 Testing the Integration

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123456"}'
```

### Test Create Conversation
```bash
curl -X POST http://localhost:8000/api/conversations/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test Send Message
```bash
curl -X POST http://localhost:8000/api/conversations/1/messages/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello!","sender":"user"}'
```

## 📁 File Structure (Updated)

```
mhchat/
├── frontend/                      # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # ← Main chat page
│   │   │   ├── login/page.tsx    # ← Login page
│   │   │   ├── layout.tsx        # ← Root layout
│   │   │   └── globals.css       # ← Global styles
│   │   ├── components/            # ← UI Components
│   │   │   ├── Message.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── Sidebar.tsx
│   │   └── lib/                   # ← Utilities
│   │       ├── api.ts            # ← API client
│   │       └── store.ts          # ← State management
│   ├── .env.local                 # ← Environment config
│   ├── package.json               # ← Dependencies
│   └── tsconfig.json              # ← TypeScript config
│
├── mhchat_proj/                   # Django Project
│   ├── settings.py                # ← Enhanced with JWT, CORS
│   ├── urls.py                    # ← URL routing
│   ├── asgi.py                    # ← WebSocket support
│   ├── wsgi.py                    # ← WSGI config
│   └── celery.py                  # ← Task queue
│
├── chat/                          # Django App
│   ├── views.py                   # ← Enhanced API views
│   ├── models.py                  # ← Database models
│   ├── serializers.py             # ← DRF serializers
│   ├── urls.py                    # ← App URLs
│   ├── consumers.py               # ← WebSocket consumers
│   ├── tasks.py                   # ← Celery tasks
│   └── migrations/                # ← Database migrations
│
├── manage.py                      # Django CLI
├── requirements.txt               # Python dependencies
├── docker-compose.yml             # Docker config
├── dockerfile                     # Docker image
├── .env.example                   # Environment template
├── setup.bat                      # Windows quick setup
├── setup.sh                       # Linux/Mac quick setup
├── SETUP_GUIDE.md                 # Complete setup guide
├── FRONTEND_INTEGRATION_GUIDE.md  # Frontend integration
└── README.md                      # Project README
```

## 🚀 Deployment Checklist

- [ ] Set `DEBUG=False` in settings.py
- [ ] Set unique `SECRET_KEY` in settings.py
- [ ] Configure `ALLOWED_HOSTS` with production domain
- [ ] Set `CORS_ALLOWED_ORIGINS` with frontend URL
- [ ] Use PostgreSQL instead of SQLite
- [ ] Configure environment variables
- [ ] Enable HTTPS/SSL
- [ ] Set secure cookie flags
- [ ] Configure Redis for Celery/WebSockets
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Set up proper logging
- [ ] Configure error tracking (Sentry)
- [ ] Set up monitoring and alerts

## 🔗 Integration Points

The frontend and backend are tightly integrated:

1. **Authentication**: JWT tokens flow through headers
2. **CORS**: Frontend URL whitelisted in Django
3. **API**: 100% typed endpoints with TypeScript
4. **State**: All data synced through Zustand store
5. **Errors**: Centralized error handling
6. **Loading**: Consistent loading states
7. **Validation**: Frontend and backend validation

## 📚 Additional Resources

### Documentation Files
- `SETUP_GUIDE.md` - Complete setup instructions
- `FRONTEND_INTEGRATION_GUIDE.md` - Frontend details and features

### External Resources
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)

## 🆘 Troubleshooting

### Common Issues

**CORS Error**
- Check `CORS_ALLOWED_ORIGINS` in settings.py
- Verify frontend URL matches whitelist
- Restart Django server

**401 Unauthorized**
- Check token in localStorage
- Verify token not expired
- Clear localStorage and re-login

**404 Not Found**
- Verify API endpoint URL
- Check Django URL routing
- Verify app is registered in INSTALLED_APPS

**500 Server Error**
- Check Django logs
- Run migrations: `python manage.py migrate`
- Check for missing dependencies

## 💡 Tips & Best Practices

1. **Development**
   - Keep Django runserver in one terminal
   - Keep Next.js dev server in another
   - Use Django Admin for quick data inspection
   - Check browser DevTools Network tab for API calls

2. **Debugging**
   - Use `print()` statements in Django views
   - Use `console.log()` in React components
   - Check Network tab for API errors
   - Check browser Console for JavaScript errors

3. **Performance**
   - Use pagination for large message lists
   - Cache conversations locally
   - Lazy load conversation details
   - Optimize API calls (batching, filtering)

4. **Security**
   - Never commit `.env` file to git
   - Always use HTTPS in production
   - Validate all user inputs
   - Keep dependencies updated
   - Use environment variables for secrets

## 🎉 Summary

Your MHChat application is now:
✅ Ready for development
✅ Fully integrated (frontend ↔ backend)
✅ Production-scalable
✅ Secure and performant
✅ Attractive and user-friendly

**Next Steps:**
1. Run the setup script for your OS
2. Start both servers
3. Test the application at http://localhost:3000
4. Refer to integration guide for customization
5. Deploy to production when ready

Happy coding! 🚀
