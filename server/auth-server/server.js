import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import locationsRoutes from './routes/locations.js'
import { seedHotspots } from './utils/seedHotspots.js'
const path = require('path');
const BASE_DIR = path.join(__dirname, '..'); 

// Inject these lines right after const app = express():

// Public URL: /tiles-public (for the original "Before" images)
app.use('/tiles-public', 
    express.static(path.join(BASE_DIR, 'server/ai_engine/data/train/tiles'))
);

// Public URL: /analysis-output (for the live "After" segmented mask)
app.use('/analysis-output', 
    express.static(path.join(BASE_DIR, 'server/ai_engine/output'))
);
dotenv.config()

// Enable Express debug mode if DEBUG env var is set
if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
  process.env.DEBUG = process.env.DEBUG || 'express:*'
  console.log('🔍 Debug mode enabled. Set DEBUG=express:* for detailed logs.')
}

const app = express()
const PORT = process.env.PORT || 5001

// Request logging middleware (must be first)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`, {
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    ip: req.ip,
  })
  next()
})

// Middleware - ORDER IS CRITICAL
// 1. CORS (must be before other middleware)
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

// 2. Body parsing (must be before routes)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 3. Cookie parser
app.use(cookieParser())

// Error handling middleware for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON parsing error:', err.message)
    return res.status(400).json({ error: 'Invalid JSON in request body' })
  }
  next(err)
})

// MongoDB connection with comprehensive error handling
let MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://LISH:lishmongo@cluster0.tvxjo8r.mongodb.net/'

// Validate and clean MongoDB URI
console.log('🔌 Validating MongoDB connection string...')

// Check for placeholder angle brackets (common mistake)
if (MONGO_URI.includes('<') || MONGO_URI.includes('>')) {
  console.error('❌ CRITICAL: MongoDB URI contains angle brackets (< or >)')
  console.error('   This is a placeholder! Replace with actual credentials.')
  console.error('   Example: mongodb+srv://username:password@cluster.mongodb.net/')
  process.exit(1)
}

// Check for placeholder text
if (MONGO_URI.includes('your-') || MONGO_URI.includes('example') || MONGO_URI.includes('placeholder')) {
  console.error('❌ CRITICAL: MongoDB URI contains placeholder text')
  console.error('   Replace with actual MongoDB connection string')
  process.exit(1)
}

// URL encode special characters in password if needed
try {
  const url = new URL(MONGO_URI)
  // If parsing succeeds, the URI is valid
  console.log('✅ MongoDB URI format is valid')
} catch (urlError) {
  console.error('❌ CRITICAL: MongoDB URI format is invalid')
  console.error('   Error:', urlError.message)
  console.error('   Expected format: mongodb+srv://username:password@cluster.mongodb.net/')
  process.exit(1)
}

console.log('📍 Connection string:', MONGO_URI.replace(/:[^:@]+@/, ':****@')) // Hide password

mongoose
  .connect(MONGO_URI, {
    dbName: 'ecowatch',
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 10000,
  })
  .then(async () => {
    console.log('✅ MongoDB connected successfully')
    console.log('📊 Database:', mongoose.connection.db.databaseName)
    console.log('🔗 Connection state:', mongoose.connection.readyState)
    
    // Verify connection by checking collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log('📁 Available collections:', collections.map(c => c.name))
    
    // Seed hotspots if database is empty
    try {
      await seedHotspots()
    } catch (seedError) {
      console.error('⚠️  Hotspot seeding error (non-critical):', seedError.message)
    }
  })
  .catch((err) => {
    console.error('\n❌ MongoDB connection error:')
    console.error('   Error name:', err.name)
    console.error('   Error message:', err.message)
    console.error('   Error code:', err.code)
    
    // Check for specific error codes
    if (err.code === 'EHOSTUNREACH' || err.message.includes('EHOSTUNREACH')) {
      console.error('\n   🔴 CRITICAL: EHOSTUNREACH - Cannot reach MongoDB server')
      console.error('      - Check internet connection')
      console.error('      - Verify MongoDB Atlas cluster is running')
      console.error('      - Check firewall settings')
      console.error('      - Verify connection string hostname is correct')
    }
    
    if (err.code === 'ECONNREFUSED' || err.message.includes('ECONNREFUSED')) {
      console.error('\n   🔴 CRITICAL: ECONNREFUSED - Connection refused')
      console.error('      - MongoDB server may be down')
      console.error('      - Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)')
      console.error('      - Verify network connectivity')
    }
    
    if (err.name === 'MongoServerSelectionError') {
      console.error('\n   🔴 CRITICAL: MongoServerSelectionError')
      console.error('      - Cannot reach MongoDB server')
      console.error('      - Check internet connection')
      console.error('      - MongoDB Atlas IP whitelist')
      console.error('      - Connection string is correct')
    }
    
    if (err.name === 'MongoAuthenticationError' || err.message.includes('Bad auth')) {
      console.error('\n   🔴 CRITICAL: Authentication Error (Bad auth)')
      console.error('      - Username or password is incorrect')
      console.error('      - Check for angle brackets (< or >) in connection string')
      console.error('      - Verify username and password in MongoDB Atlas')
      console.error('      - Special characters in password must be URL-encoded')
      console.error('      - Example: @ becomes %40, # becomes %23')
    }
    
    console.error('\n   Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
    console.error('   Stack trace:', err.stack)
    
    // Don't exit - let the server start but log the error
    // Routes will handle database errors gracefully
  })

// MongoDB connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err)
  console.error('Auth Failure Error:', err.message)
  
  // Log specific error codes
  if (err.message.includes('EHOSTUNREACH')) {
    console.error('🔴 EHOSTUNREACH detected in connection error')
  }
  if (err.message.includes('ECONNREFUSED')) {
    console.error('🔴 ECONNREFUSED detected in connection error')
  }
  if (err.message.includes('Bad auth') || err.message.includes('Authentication failed')) {
    console.error('🔴 Bad auth detected in connection error')
  }
})

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected from MongoDB')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log('MongoDB connection closed through app termination')
  process.exit(0)
})

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }[dbStatus] || 'unknown'

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusText,
      readyState: dbStatus,
    },
  })
})

// Routes (must be after middleware)
app.use('/api/auth', authRoutes)
app.use('/api/locations', locationsRoutes)

// 404 handler
app.use((req, res) => {
  console.warn(`⚠️  404: ${req.method} ${req.path} not found`)
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Auth server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔍 Debug mode: ${process.env.DEBUG ? 'enabled' : 'disabled'}`)
  console.log(`📡 Health check: http://localhost:${PORT}/health`)
})

