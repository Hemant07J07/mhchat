# 🚀 MHChat Quick Reference Card

## ⚡ Start in 30 Seconds

### Windows
```bash
cd c:\Users\hdube\mhchat
setup.bat
```

### Linux/Mac
```bash
cd /path/to/mhchat
chmod +x setup.sh
./setup.sh
```

Then open: **http://localhost:3000**

---

## 📍 Key URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Frontend App |
| http://localhost:3000/login | Login Page |
| http://localhost:8000 | Backend API |
| http://localhost:8000/admin | Django Admin |
| http://localhost:8000/api/ | API Root |

---

## 🔑 Demo Credentials

- **Email**: demo@example.com
- **Password**: demo123456

---

## 📁 Key Files

| File | What It Does |
|------|--------------|
| `frontend/.env.local` | Frontend API configuration |
| `mhchat_proj/settings.py` | Django configuration |
| `chat/views.py` | API endpoints |
| `src/lib/api.ts` | Axios API client |
| `src/lib/store.ts` | State management |

---

## 🔗 Main API Endpoints

### Auth
- `POST /api/auth/login/` - Login
- `POST /api/auth/register/` - Register

### Chats
- `GET /api/conversations/` - List chats
- `POST /api/conversations/` - Create chat
- `DELETE /api/conversations/{id}/` - Delete chat

### Messages
- `GET /api/conversations/{id}/messages/` - Get messages
- `POST /api/conversations/{id}/messages/` - Send message

### Profile
- `GET /api/profile/` - Get profile
- `PATCH /api/profile/update/` - Update profile

---

## 🎨 UI Components

| Component | File | Purpose |
|-----------|------|---------|
| Message | `src/components/Message.tsx` | Display messages |
| MessageInput | `src/components/MessageInput.tsx` | Send messages |
| Sidebar | `src/components/Sidebar.tsx` | Conversation list |

---

## 🔧 Common Commands

### Backend
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver

# Django shell
python manage.py shell

# Run tests
python manage.py test
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| CORS Error | Check `CORS_ALLOWED_ORIGINS` in settings.py |
| 401 Unauthorized | Clear localStorage, re-login |
| Port in use | Restart computer or kill process |
| Module not found | Run `npm install` or `pip install -r requirements.txt` |
| Database error | Run `python manage.py migrate` |
| Frontend not loading | Check `.env.local` exists with correct API_BASE |

---

## 📝 Environment Setup

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_WS_HOST=ws
```

### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🎯 User Journey

1. Open http://localhost:3000
2. Click "Try Demo Credentials"
3. Click "Sign In"
4. See your conversations
5. Click "New Chat" to start
6. Type message and send
7. Done! 🎉

---

## 📚 Documentation

- **SETUP_GUIDE.md** - Complete setup instructions
- **FRONTEND_INTEGRATION_GUIDE.md** - Frontend details
- **DEVELOPMENT_GUIDE.md** - Development workflow
- **INTEGRATION_SUMMARY.md** - What was implemented

---

## 🔐 Security Notes

- JWT tokens expire after 1 hour
- Tokens stored in localStorage
- CSRF protection enabled
- CORS whitelist configured
- Users see only their data

---

## 🚀 Next Steps

1. ✅ Run setup.bat or setup.sh
2. ✅ Start backend: `python manage.py runserver`
3. ✅ Start frontend: `cd frontend && npm run dev`
4. ✅ Open http://localhost:3000
5. ✅ Login with demo credentials
6. ✅ Test the chat interface

---

## 💡 Tips

- Use Django Admin (/admin) to manage users and data
- Check browser DevTools (F12) for network requests
- Use `console.log()` in JavaScript for debugging
- Use `print()` in Python for debugging
- Read the full documentation for advanced features

---

## 📞 Still Need Help?

1. Check SETUP_GUIDE.md
2. Check troubleshooting section
3. Review error messages in console
4. Check Django logs in terminal
5. Inspect browser network tab (F12)

---

**Version**: 1.0.0 | **Updated**: November 2025 | **Status**: ✅ Ready to Use
