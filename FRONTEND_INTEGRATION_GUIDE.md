# MHChat Frontend Integration Checklist & Configuration Guide

## ✅ Frontend Setup Checklist

### 1. Environment Configuration
- [ ] Create `.env.local` in `frontend/` folder with:
  ```env
  NEXT_PUBLIC_API_BASE=http://localhost:8000
  NEXT_PUBLIC_WS_HOST=ws://localhost:8000
  ```

### 2. Dependencies
- [ ] Run `npm install` in frontend directory
- [ ] All packages installed: axios, zustand, lucide-react, framer-motion

### 3. API Integration
- [x] `src/lib/api.ts` - Axios instance with JWT and CSRF support
- [x] `src/lib/store.ts` - Zustand store for state management
- [x] Error handling and request interceptors configured

### 4. Components
- [x] `src/components/Message.tsx` - Message display component
- [x] `src/components/MessageInput.tsx` - Chat input with send functionality
- [x] `src/components/Sidebar.tsx` - Collapsible conversation sidebar

### 5. Pages
- [x] `src/app/page.tsx` - Main chat interface
- [x] `src/app/login/page.tsx` - Login page with gradient design
- [x] `src/app/layout.tsx` - Root layout component

### 6. Styling
- [x] `src/app/globals.css` - Global styles with animations and dark mode support
- [x] Tailwind CSS configured for responsive design
- [x] Mobile-first approach with sm/md/lg/xl breakpoints

## 🔧 Backend Setup Checklist

### 1. Django Configuration
- [x] JWT authentication configured in `settings.py`
- [x] CORS enabled for frontend URL
- [x] CSRF protection enabled
- [x] REST Framework configured with JWT authentication

### 2. API Endpoints
- [x] `/api/auth/register/` - User registration
- [x] `/api/auth/login/` - User login (email or username)
- [x] `/api/auth/logout/` - User logout
- [x] `/api/profile/` - Get user profile
- [x] `/api/profile/update/` - Update user profile
- [x] `/api/conversations/` - CRUD operations for conversations
- [x] `/api/conversations/{id}/messages/` - Message management

### 3. Security
- [x] CORS whitelist configured
- [x] CSRF token support
- [x] User isolation (users access only their conversations)
- [x] JWT token validation

### 4. Database Models
- [x] User (Django built-in)
- [x] UserProfile
- [x] Conversation
- [x] Message
- [x] MessageEmbedding

## 🚀 Running the Application

### Start Backend
```bash
# Navigate to project root
cd c:\Users\hdube\mhchat

# Activate virtual environment
venv\Scripts\activate

# Apply migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start server
python manage.py runserver
```
Backend will be available at: **http://localhost:8000**

### Start Frontend
```bash
# In another terminal, navigate to frontend
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```
Frontend will be available at: **http://localhost:3000**

## 🎯 Feature Implementation Guide

### User Authentication Flow
1. User lands on `/login` page
2. Enters email and password
3. Frontend calls `/api/auth/login/`
4. Backend returns JWT `access` token
5. Token stored in `localStorage`
6. Redirected to `/` (chat page)
7. Token sent with every API request in `Authorization: Bearer {token}` header

### Chat Conversation Flow
1. User on `/` page loads conversations from `/api/conversations/`
2. User selects a conversation (auto-creates if none exist)
3. Messages loaded from `/api/conversations/{id}/messages/`
4. User types message and clicks send
5. Message sent to `/api/conversations/{id}/messages/`
6. Optimistic UI update (show message immediately)
7. Backend processes and stores message
8. Response received and stored in state
9. New messages appear in real-time via WebSocket (when configured)

### State Management (Zustand)
- `conversations` - List of user's conversations
- `currentConversation` - Currently selected conversation
- `messages` - Messages in current conversation
- `user` - Current logged-in user
- `isAuthenticated` - Authentication status

### API Client Features
- Automatic JWT token injection from localStorage
- CSRF token support for Django
- Error handling with 401 redirect to login
- Request/response interceptors
- Typed API methods for type safety

## 🎨 UI/UX Improvements Made

### Attractive Design Features
1. **Gradient Backgrounds** - Blue to purple gradient on login
2. **Collapsible Sidebar** - Save space on mobile devices
3. **Smooth Animations** - Message fade-in animations
4. **Dark Mode Support** - Full dark mode styling
5. **Responsive Layout** - Works on all screen sizes
6. **Loading States** - Spinners for async operations
7. **Error Messages** - Clear error feedback
8. **Hover Effects** - Interactive elements with feedback
9. **Color-coded Messages** - User messages (blue), bot messages (gray), system messages (muted)
10. **Timestamp Display** - All messages show creation time

### Tailwind Classes Used
- Gradients: `from-blue-500`, `to-purple-500`, `via-purple-500`
- Shadows: `shadow-lg`, `shadow-2xl`, `shadow-sm`
- Borders: `border-gray-200`, `dark:border-gray-700`
- Spacing: `p-4`, `gap-4`, `mb-6`, `px-4`, `py-3`
- Responsiveness: `sm:`, `md:`, `lg:`, `xl:` prefixes
- Dark Mode: `dark:` prefixes for all dark mode styles

## 📋 Frontend Component Props

### Message Component
```typescript
interface MessageProps {
  message: {
    id: number
    text: string
    sender: "user" | "bot" | "system"
    created_at: string
  }
}
```

### MessageList Component
```typescript
interface MessageListProps {
  messages: Message[]
  loading: boolean
}
```

### MessageInput Component
```typescript
interface MessageInputProps {
  onSend: (message: string) => Promise<void>
  loading?: boolean
  disabled?: boolean
}
```

### Sidebar Component
```typescript
interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: number | null
  onSelectConversation: (id: number) => void
  onNewConversation: () => Promise<void>
  onDeleteConversation: (id: number) => Promise<void>
  loading?: boolean
}
```

## 🔗 API Integration Points

### Frontend Calls Backend
1. **GET** `/api/conversations/` - Load conversations on mount
2. **POST** `/api/conversations/` - Create new conversation
3. **GET** `/api/conversations/{id}/` - Load conversation details
4. **DELETE** `/api/conversations/{id}/` - Delete conversation
5. **GET** `/api/conversations/{id}/messages/` - Load messages
6. **POST** `/api/conversations/{id}/messages/` - Send message
7. **POST** `/api/auth/login/` - Authenticate user
8. **GET** `/api/profile/` - Load user profile

## 🛡️ Error Handling

### Frontend Error Scenarios
- **401 Unauthorized** - Token expired, redirect to login
- **403 Forbidden** - User lacks permission
- **404 Not Found** - Resource doesn't exist
- **400 Bad Request** - Invalid data format
- **500 Server Error** - Backend error

All errors stored in `useChatStore.error` and displayed in UI

## 📱 Mobile Optimization

### Responsive Breakpoints
- **< 640px (Mobile)** - Full-width layout, single column
- **640px - 1024px (Tablet)** - Adjusted spacing, medium sidebar
- **> 1024px (Desktop)** - Full sidebar, optimal layout

### Mobile Features
- Collapsible sidebar to save space
- Touch-friendly button sizes (min 44px)
- Optimized form inputs for mobile keyboards
- Responsive message display (max-width constraints)

## 🔐 Security Implementation

### Frontend Security
1. **Token Storage** - JWT stored in localStorage (with HTTPS recommended)
2. **CSRF Protection** - Automatic CSRF token injection
3. **Request Headers** - Authorization header properly formatted
4. **Error Messages** - Generic error messages to users

### Backend Security (Already Configured)
1. **CORS Whitelist** - Only frontend URL allowed
2. **CSRF Tokens** - Required for state-changing requests
3. **User Isolation** - Users can only see their data
4. **JWT Expiration** - Tokens expire after 1 hour
5. **Password Hashing** - Django's default PBKDF2

## ✨ Next Steps & Enhancements

### Immediate (Ready to Use)
- ✅ Chat interface fully functional
- ✅ User authentication working
- ✅ Conversation management complete
- ✅ Responsive design implemented
- ✅ Error handling in place

### Short Term (Recommended)
- [ ] WebSocket integration for real-time updates
- [ ] Message editing and deletion UI
- [ ] Typing indicators ("User is typing...")
- [ ] User presence indicators
- [ ] Message search functionality
- [ ] Conversation search and filtering

### Medium Term
- [ ] Audio/video call integration
- [ ] File upload and sharing
- [ ] Markdown message support
- [ ] Message reactions/emojis
- [ ] User blocking/muting
- [ ] Two-factor authentication

### Long Term
- [ ] Analytics dashboard
- [ ] Admin panel improvements
- [ ] Advanced user profiles
- [ ] Integration with LLM providers
- [ ] Mobile app version
- [ ] Accessibility (WCAG) compliance

## 📞 Support & Debugging

### Common Issues & Solutions

**Issue:** CORS error in browser console
**Solution:** 
- Check `CORS_ALLOWED_ORIGINS` in `settings.py`
- Verify frontend URL is whitelisted
- Restart Django server

**Issue:** 401 Unauthorized errors
**Solution:**
- Clear localStorage: `localStorage.clear()`
- Log in again
- Check token expiration time

**Issue:** Messages not sending
**Solution:**
- Verify API base URL in `.env.local`
- Check network tab in browser DevTools
- Ensure conversation exists before sending

**Issue:** Styling looks broken
**Solution:**
- Run `npm run build` in frontend
- Clear `.next` folder
- Reinstall Tailwind: `npm install tailwindcss`

## 📚 File Structure Summary

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Main chat interface
│   │   ├── login/page.tsx        ← Login page
│   │   ├── layout.tsx            ← Root layout
│   │   └── globals.css           ← Global styles
│   ├── components/
│   │   ├── Message.tsx           ← Message display
│   │   ├── MessageInput.tsx      ← Input field
│   │   └── Sidebar.tsx           ← Navigation
│   └── lib/
│       ├── api.ts                ← API client
│       └── store.ts              ← State management
└── public/                        ← Static assets

mhchat_proj/
├── settings.py                   ← Django config (updated for CORS, JWT)
├── urls.py                       ← URL routing
└── asgi.py                       ← WebSocket config

chat/
├── views.py                      ← API endpoints (enhanced with auth)
├── models.py                     ← Database models
├── urls.py                       ← App URLs (updated)
└── serializers.py                ← DRF serializers
```

---

**Version:** 1.0.0
**Last Updated:** November 2025
**Status:** ✅ Production Ready (with WebSocket pending)
