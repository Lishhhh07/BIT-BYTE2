# Authentication Diagnostics Guide

## Overview

This document explains the comprehensive logging and diagnostic features added to help identify and fix authentication issues.

## What Was Fixed

### 1. ✅ Comprehensive Logging
- **Request Logging**: Every request is logged with timestamp, method, path, body, and IP
- **Step-by-step Logging**: Each authentication step is logged with clear markers
- **Error Logging**: Detailed error information including name, message, code, and stack traces
- **Performance Logging**: Request duration tracking for performance analysis

### 2. ✅ Database Connection Diagnostics
- Connection state checking before operations
- Detailed connection error messages with specific guidance
- Connection event listeners for monitoring
- Health check endpoint at `/health`

### 3. ✅ Password Hashing Verification
- Logging in User model pre-save hook
- Password comparison logging
- Hash length verification
- Error handling for hashing failures

### 4. ✅ Middleware Ordering
- Correct order: CORS → Body Parsing → Cookie Parser → Routes
- JSON parsing error handling
- Request size limits configured

### 5. ✅ Error Handling
- Try-catch blocks around all database operations
- Specific error messages for different failure types
- Development vs production error details

## How to Use Diagnostics

### Starting the Server with Debug Mode

```bash
# Enable Express debug mode
DEBUG=express:* npm start

# Or set in .env file
DEBUG=express:*
```

### Reading the Logs

#### Signup Request Flow
```
📝 SIGNUP REQUEST START
   Email: provided
   Password: provided
   📧 Normalized email: user@example.com
   🔍 Checking for existing user...
   📊 User lookup result: not found
   🔐 Creating/updating user...
   ➕ Creating new user
   🔒 Hashing password...
   ✅ Password hashed successfully
   🔑 Hash length: 60
   ✅ User created successfully
   🆔 User ID: 507f1f77bcf86cd799439011
   🔑 Generating OTP...
   🔑 OTP generated: 123456
   💾 Saving OTP to database...
   ✅ OTP saved successfully
   📧 Attempting to send OTP email...
   ✅ Email sent successfully
   ⏱️  Signup completed in 245ms
📝 SIGNUP REQUEST END - SUCCESS
```

#### Login Request Flow
```
🔐 LOGIN REQUEST START
   Email: provided
   Password: provided
   📧 Normalized email: user@example.com
   🔍 Searching for user...
   📊 User lookup result: found
   🆔 User ID: 507f1f77bcf86cd799439011
   ✅ Verified: true
   🔒 Has password hash: yes
   🔐 Comparing password...
   🔐 Comparing password (bcrypt)...
   🔐 Password comparison result: match
   🎫 Generating JWT token...
   ✅ Token generated successfully
   ✅ Login successful
   ⏱️  Login completed in 89ms
🔐 LOGIN REQUEST END - SUCCESS
```

### Common Error Patterns

#### Database Connection Error
```
❌ MongoDB connection error:
   Error name: MongoServerSelectionError
   Error message: getaddrinfo ENOTFOUND cluster0.tvxjo8r.mongodb.net
   ⚠️  Cannot reach MongoDB server. Check:
      - Internet connection
      - MongoDB Atlas IP whitelist
      - Connection string is correct
```

#### Password Mismatch
```
🔐 LOGIN REQUEST START
   ...
   🔐 Password comparison result: no match
   ❌ Login failed: Invalid password
   ⏱️  Login failed in 45ms
🔐 LOGIN REQUEST END - INVALID PASSWORD
```

#### User Not Found
```
🔐 LOGIN REQUEST START
   ...
   📊 User lookup result: not found
   ❌ Login failed: User not found
   ⏱️  Login failed in 32ms
🔐 LOGIN REQUEST END - USER NOT FOUND
```

## Health Check Endpoint

Check server and database status:

```bash
curl http://localhost:5001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": {
    "status": "connected",
    "readyState": 1
  }
}
```

## Troubleshooting Steps

### 1. Check Database Connection
- Look for `✅ MongoDB connected successfully` in logs
- Check `/health` endpoint
- Verify `MONGO_URI` in `.env` file
- Check MongoDB Atlas IP whitelist

### 2. Check Password Hashing
- Look for `🔒 Hashing password...` and `✅ Password hashed successfully`
- Verify hash length is 60 characters
- Check for any hashing errors

### 3. Check Password Comparison
- Look for `🔐 Comparing password (bcrypt)...`
- Check comparison result (match/no match)
- Verify stored hash exists

### 4. Check Request Body
- Look for request logging at start of each request
- Verify email and password are being received
- Check for JSON parsing errors

### 5. Check OTP Flow
- Verify OTP is generated and saved
- Check OTP lookup results
- Verify OTP expiration logic

## Environment Variables

Required for full functionality:
```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/

# JWT
JWT_SECRET=your-secret-key

# Email (optional for development)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Debug (optional)
DEBUG=express:*
```

## Next Steps if Issues Persist

1. **Check Logs**: Review all log output for error patterns
2. **Test Database**: Verify MongoDB connection independently
3. **Test Password Hashing**: Create a test script to verify bcrypt
4. **Check Network**: Verify CORS and network connectivity
5. **Verify Environment**: Ensure all environment variables are set correctly

## Performance Monitoring

All requests include duration tracking. Monitor for:
- Signup: Should be < 500ms
- Login: Should be < 200ms
- Verify: Should be < 300ms

If durations are high, check:
- Database query performance
- Network latency
- Email sending (if configured)

