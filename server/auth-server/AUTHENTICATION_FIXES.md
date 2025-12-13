# Authentication Fixes

## Issues Fixed

### 1. Port Mismatch ✅
- **Problem**: Frontend was calling `localhost:5000` but auth server runs on `5001`
- **Fix**: Updated `AuthModal.tsx` to use correct port `5001`

### 2. Email Not Sending ✅
- **Problem**: Email configuration was required but not set up, causing signup to fail
- **Fix**: 
  - Added development fallback that logs OTP to console
  - In development mode, OTP is also returned in API response
  - Signup now succeeds even without email config (for development)
  - Real emails will be sent when SMTP/Gmail is configured

### 3. Login Failing ✅
- **Problem**: Various issues causing login failures
- **Fixes**:
  - Improved error messages (more specific)
  - Added email normalization (lowercase, trim)
  - Better logging for debugging
  - Fixed user ID serialization (toString())
  - Improved handling of unverified users

### 4. Signup Improvements ✅
- **Fixes**:
  - Allow resending OTP for unverified users
  - Email normalization (case-insensitive)
  - Better error handling
  - Development mode OTP display

## How to Use

### Development Mode (No Email Config Required)
1. Start the auth server: `cd ecowatch-app/server/auth-server && npm start`
2. When signing up, check the server console for the OTP code
3. The OTP will also be shown in the browser error message temporarily (dev mode only)

### Production Mode (With Email Config)
1. Set up email configuration in `.env`:
   ```env
   # Option 1: Gmail
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   
   # Option 2: Custom SMTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-password
   SMTP_FROM=noreply@ecowatch.com
   ```
2. Restart the server
3. OTPs will be sent via email

## Testing

1. **Signup Flow**:
   - Enter email and password
   - Check server console for OTP (development)
   - Enter OTP to verify
   - User is logged in automatically

2. **Login Flow**:
   - Enter verified email and password
   - Should login successfully
   - If email not verified, you'll get a helpful error message

3. **Resend OTP**:
   - If user exists but not verified, signup again will resend OTP

## API Endpoints

- `POST /api/auth/signup` - Create account and send OTP
- `POST /api/auth/verify` - Verify OTP and complete registration
- `POST /api/auth/login` - Login with email and password

All endpoints now have improved error handling and logging.

