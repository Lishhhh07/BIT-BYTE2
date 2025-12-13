# EcoWatch Authentication Server

Node.js/Express authentication server with OTP email verification and deforestation hotspot management.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (or use the provided MongoDB URI):
```env
PORT=5001
MONGO_URI=mongodb+srv://LISH:lishmongo@cluster0.tvxjo8r.mongodb.net/
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration (REQUIRED for OTP emails to work)
# Option 1: Custom SMTP Configuration
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM=noreply@ecowatch.com

# Option 2: Gmail (Simpler - uses Gmail service directly)
# GMAIL_USER=your-email@gmail.com
# GMAIL_APP_PASSWORD=your-gmail-app-password
# Note: For Gmail, you need to generate an App Password:
# 1. Go to your Google Account settings
# 2. Enable 2-Step Verification
# 3. Generate an App Password for "Mail"
# 4. Use that 16-character password as GMAIL_APP_PASSWORD
```

3. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## Features

- ✅ Password hashing with bcrypt
- ✅ 6-digit OTP generation
- ✅ OTP expiration (10 minutes)
- ✅ JWT token generation
- ✅ Email verification required for login
- ✅ MongoDB integration
- ✅ Real email sending via SMTP or Gmail (configuration required)
- ✅ Automatic hotspot seeding on server start
- ✅ Proper error handling for email failures
- ✅ Deforestation hotspot API

## API Endpoints

### Authentication

#### POST /api/auth/signup
Register a new user and send OTP email.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email"
}
```

#### POST /api/auth/verify
Verify OTP and complete registration.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "Email verified successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "isVerified": true
  }
}
```

#### POST /api/auth/login
Login with email and password (requires verified account).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "isVerified": true
  }
}
```

### Locations

#### GET /api/locations
Get all deforestation hotspots.

**Response:**
```json
{
  "success": true,
  "count": 15,
  "hotspots": [
    {
      "id": "hotspot-id",
      "name": "Hasdeo Arand, Chhattisgarh",
      "lat": 22.78,
      "lng": 82.65,
      "risk_level": "Critical"
    },
    ...
  ]
}
```

Hotspots are sorted by risk level (Critical > High > Medium > Low), then alphabetically by name.

## Database Models

### User
- `email` (unique, required)
- `password` (hashed, required)
- `isVerified` (boolean, default: false)
- `createdAt`, `updatedAt` (timestamps)

### OTP
- `email` (required, indexed)
- `otpCode` (required)
- `createdAt` (auto-expires after 10 minutes)

### Hotspot
- `name` (required)
- `lat` (required, number)
- `lng` (required, number)
- `risk_level` (required, enum: Critical, High, Medium, Low)
- `createdAt`, `updatedAt` (timestamps)

## Seeding

On server startup, the application automatically checks if the `hotspots` collection is empty. If it is, it seeds the database with data from `server/seeds/hotspot.json`.

To manually trigger seeding (or re-seed), you can:
1. Delete all documents from the `hotspots` collection in MongoDB
2. Restart the server

The seeding process will only run if the collection is empty to prevent duplicate entries.
