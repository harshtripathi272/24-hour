# 🎬 API-First Video App

A full-stack video streaming application demonstrating **API-first architecture** where the React Native mobile app acts as a thin client, with all business logic residing in the Flask backend.

## 🏗️ Architecture

```
React Native App  →  Flask API  →  MongoDB
                         ↓
                    YouTube (hidden behind backend)
```

**Key Principle**: The mobile app never directly accesses YouTube. All video URLs are abstracted behind secure, signed playback tokens.

## ✨ Features

### Backend (Flask)
- 🔐 JWT Authentication with refresh tokens
- 🔒 Bcrypt password hashing
- 🎥 Secure video streaming with signed playback tokens
- ⏱️ Rate limiting (5 login attempts/minute)
- 📝 Request logging to file
- 📊 Video watch tracking

### Mobile (React Native)
- 📱 Clean, modern UI with dark theme
- 🔑 Secure token storage (expo-secure-store)
- 🎬 Video player with controls (play/pause, mute)
- 🔄 Pull-to-refresh on dashboard
- 🚪 Proper logout with token invalidation

## 📁 Project Structure

```
24-hour/
├── backend/                 # Flask API
│   ├── app/
│   │   ├── models/          # User, Video models
│   │   ├── routes/          # Auth, Video endpoints
│   │   ├── middleware/      # JWT authentication
│   │   └── utils/           # Token utilities
│   ├── seed.py              # Database seeder
│   ├── run.py               # Entry point
│   └── requirements.txt
│
├── mobile/                  # React Native (Expo)
│   ├── app/
│   │   ├── (auth)/          # Login, Signup screens
│   │   └── (app)/           # Dashboard, Settings, Video player
│   ├── components/          # VideoTile, VideoPlayer
│   ├── services/            # API client
│   └── context/             # Auth context
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- MongoDB (local or Atlas)
- Expo Go app on your phone (for testing)

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment file
copy .env.example .env  # Windows
# cp .env.example .env  # macOS/Linux

# 5. Start MongoDB (if local)
mongod

# 6. Seed the database
python seed.py

# 7. Run the server
python run.py
```

The API will be available at `http://localhost:5000`

### Mobile Setup

```bash
# 1. Navigate to mobile
cd mobile

# 2. Install dependencies
npm install

# 3. Update API URL in services/api.ts
# For Android emulator: http://10.0.2.2:5000
# For iOS simulator: http://localhost:5000
# For physical device: http://<your-computer-ip>:5000

# 4. Start Expo
npx expo start
```

Scan the QR code with Expo Go app to run on your device.

## 🔑 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login | No |
| GET | `/auth/me` | Get profile | JWT |
| POST | `/auth/logout` | Logout | JWT |
| POST | `/auth/refresh` | Refresh token | Refresh Token |

### Videos

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Get 2 videos | JWT |
| GET | `/video/<id>/stream` | Get stream URL | JWT + Playback Token |
| POST | `/video/<id>/track` | Track watch event | JWT |

## 🔒 Security: YouTube URL Abstraction

### The Problem
The requirement states apps should NOT expose YouTube URLs like `https://youtube.com/watch?v=abc123`.

### Our Solution (Option B - Signed Playback Tokens)

1. **Dashboard Response**
   ```json
   {
     "videos": [{
       "id": "video_id",
       "title": "...",
       "thumbnail_url": "...",
       "playback_token": "eyJhbGciOiJIUzI1NiIsInR..."
     }]
   }
   ```
   
2. **Stream Request**
   ```
   GET /video/<id>/stream?token=<playback_token>
   ```
   
3. **Stream Response**
   ```json
   {
     "stream_url": "https://www.youtube-nocookie.com/embed/xyz?autoplay=1",
     "expires_at": 1706400000
   }
   ```

### Security Benefits
- ✅ Dashboard never exposes YouTube IDs
- ✅ Playback tokens are signed and time-limited (1 hour)
- ✅ Tokens are video-specific (can't reuse for other videos)
- ✅ Using youtube-nocookie for privacy-enhanced embedding

## 🧪 Testing

### Test API with curl

```bash
# Signup
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"Test123"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'

# Get Dashboard (use token from login)
curl http://localhost:5000/dashboard \
  -H "Authorization: Bearer <access_token>"

# Get Stream URL (use playback_token from dashboard)
curl "http://localhost:5000/video/<id>/stream?token=<playback_token>" \
  -H "Authorization: Bearer <access_token>"
```

## ⭐ Bonus Features Implemented

| Feature | Status | Description |
|---------|--------|-------------|
| Refresh Tokens | ✅ | `/auth/refresh` endpoint |
| Token Expiry | ✅ | 15min access, 7 days refresh |
| Rate Limiting | ✅ | 5 login attempts/minute |
| Logging | ✅ | Rotating file logs in `logs/` |
| Watch Tracking | ✅ | `/video/<id>/track` endpoint |

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=video_app
JWT_SECRET_KEY=your-super-secret-key
JWT_ACCESS_TOKEN_EXPIRES=900
JWT_REFRESH_TOKEN_EXPIRES=604800
PLAYBACK_TOKEN_SECRET=your-playback-secret
PLAYBACK_TOKEN_EXPIRES=3600
```

### Mobile
Update `API_BASE_URL` in `services/api.ts`:
```typescript
const API_BASE_URL = 'http://10.0.2.2:5000'; // Android emulator
```

## 🎥 Demo Flow

1. **Signup** → Creates account with hashed password
2. **Login** → Receives JWT tokens, stored securely
3. **Dashboard** → Displays 2 video tiles (no YouTube URLs visible)
4. **Play Video** → App requests stream URL with playback token
5. **Video Player** → Plays embedded video with controls
6. **Settings** → Shows profile, logout clears tokens

## 🛠️ Tech Stack

- **Backend**: Flask, PyMongo, PyJWT, bcrypt, Flask-Limiter
- **Database**: MongoDB
- **Mobile**: React Native, Expo, Expo Router, Axios
- **Security**: JWT, Signed Playback Tokens, Secure Storage

## 📄 License

MIT
