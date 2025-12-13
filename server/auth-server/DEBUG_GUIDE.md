# Debug Mode Guide

## Phase 1: Enable Debugging and Log Errors

### Enable Debugging Logs (CRITICAL)

#### Windows (PowerShell)
```powershell
$env:DEBUG = "express:*,mongo*"
node server.js
```

Or use the provided script:
```powershell
.\start-debug.ps1
```

#### Linux/macOS (Bash)
```bash
DEBUG=express:*,mongo* node server.js
```

Or use the provided script:
```bash
chmod +x start-debug.sh
./start-debug.sh
```

#### Using npm scripts
```bash
npm run debug:windows  # Windows
npm run debug:unix     # Linux/macOS
```

### What Debug Mode Shows

- **express:*** - All Express internal logs (routing, middleware, etc.)
- **mongo*** - All MongoDB/Mongoose connection and query logs

### Watch for These Errors

When running in debug mode, watch the console for:

1. **EHOSTUNREACH** - Cannot reach MongoDB server
   - Check internet connection
   - Verify MongoDB Atlas cluster is running
   - Check firewall settings

2. **ECONNREFUSED** - Connection refused
   - MongoDB server may be down
   - Check MongoDB Atlas IP whitelist
   - Verify network connectivity

3. **Bad auth** - Authentication failed
   - Username or password is incorrect
   - Check for angle brackets in connection string
   - Verify credentials in MongoDB Atlas

## Phase 2: Configuration & Database Checks

### Database Connection Credentials

#### Action 1: Check .env file
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

**Important:**
- ✅ No angle brackets (`<` or `>`)
- ✅ No placeholder text (`your-username`, `example`, etc.)
- ✅ Special characters in password are URL-encoded
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `%` becomes `%25`
  - `&` becomes `%26`

#### Action 2: Server Validation

The server now automatically checks for:
- ❌ Angle brackets in connection string
- ❌ Placeholder text
- ❌ Invalid URI format

If found, the server will exit with a clear error message.

### Password Hashing/Comparison

#### Signup (Password Hashing)
The password is automatically hashed in the User model's `pre('save')` hook:
```javascript
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})
```

**Logging shows:**
- 🔒 Hashing password...
- ✅ Password hashed successfully
- 🔑 Hash length: 60 (verification)

#### Login (Password Comparison)
Password comparison uses bcrypt.compare():
```javascript
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}
```

**Logging shows:**
- 🔐 Comparing password (bcrypt)...
- 🔐 Password comparison result: match/no match

### Body Parser Middleware

The middleware is correctly ordered in `server.js`:

```javascript
// 1. CORS (must be before other middleware)
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

// 2. Body parsing (must be before routes)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 3. Cookie parser
app.use(cookieParser())

// 4. Routes (after all middleware)
app.use('/api/auth', authRoutes)
```

**Request logging shows:**
- Email: provided/missing
- Password: provided/missing
- Full request body (for debugging)

## Error Logging Format

All authentication errors now log in this format:

```
Auth Failure Error: [error message]
```

This makes it easy to search logs for authentication failures.

### Specific Error Detection

The server automatically detects and highlights:
- 🔴 EHOSTUNREACH
- 🔴 ECONNREFUSED  
- 🔴 Bad auth

## Testing Checklist

1. ✅ Start server with debug mode
2. ✅ Check MongoDB connection logs
3. ✅ Verify no angle brackets in connection string
4. ✅ Test signup and watch password hashing logs
5. ✅ Test login and watch password comparison logs
6. ✅ Check request body is being received
7. ✅ Look for "Auth Failure Error:" messages

## Quick Diagnostic Commands

### Check server health
```bash
curl http://localhost:5001/health
```

### Check MongoDB connection
Look for these in logs:
- ✅ MongoDB connected successfully
- ✅ Mongoose connected to MongoDB

### Check request body parsing
Look for request logs showing:
```
[timestamp] POST /api/auth/signup { body: { email: '...', password: '...' } }
```

## Common Issues and Solutions

### Issue: "Auth Failure Error: EHOSTUNREACH"
**Solution:**
- Check internet connection
- Verify MongoDB Atlas cluster is running
- Check firewall/network settings

### Issue: "Auth Failure Error: ECONNREFUSED"
**Solution:**
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)
- Verify network connectivity
- Check if MongoDB server is down

### Issue: "Auth Failure Error: Bad auth"
**Solution:**
- Verify username and password in connection string
- Remove any angle brackets
- URL-encode special characters in password
- Check credentials in MongoDB Atlas dashboard

### Issue: req.body.email is undefined
**Solution:**
- Verify `express.json()` is before routes
- Check Content-Type header is `application/json`
- Verify request body is valid JSON

