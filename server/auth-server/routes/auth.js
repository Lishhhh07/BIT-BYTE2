import express from 'express'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import OTP from '../models/OTP.js'
import { sendOTPEmail } from '../utils/email.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString()
}

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const startTime = Date.now()
  console.log('\n📝 SIGNUP REQUEST START')
  console.log('   Email:', req.body?.email ? 'provided' : 'missing')
  console.log('   Password:', req.body?.password ? 'provided' : 'missing')

  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      console.log('   ❌ Validation failed: Missing email or password')
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      console.log('   ❌ Validation failed: Password too short')
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim()
    console.log('   📧 Normalized email:', normalizedEmail)

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('   ❌ Database not connected. State:', mongoose.connection.readyState)
      return res.status(503).json({ 
        error: 'Database connection unavailable. Please try again later.' 
      })
    }

    // Check if user already exists
    console.log('   🔍 Checking for existing user...')
    let existingUser
    try {
      existingUser = await User.findOne({ email: normalizedEmail })
      console.log('   📊 User lookup result:', existingUser ? 'found' : 'not found')
    } catch (dbError) {
      console.error('   ❌ Database query error:', dbError)
      console.error('   Error details:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
      })
      return res.status(500).json({ 
        error: 'Database error. Please try again.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      })
    }

    if (existingUser) {
      if (existingUser.isVerified) {
        console.log('   ⚠️  User already exists and verified')
        return res.status(400).json({ error: 'User already exists. Please login instead.' })
      } else {
        console.log('   🔄 Resending OTP for unverified user')
      }
    }

    // Create or update user (password will be hashed by pre-save hook)
    console.log('   🔐 Creating/updating user...')
    let user
    try {
      if (existingUser) {
        // Update existing unverified user
        console.log('   📝 Updating existing user password')
        existingUser.password = password // Will be re-hashed by pre-save hook
        user = await existingUser.save()
        console.log('   ✅ User updated successfully')
      } else {
        // Create new user
        console.log('   ➕ Creating new user')
        user = new User({ email: normalizedEmail, password })
        await user.save()
        console.log('   ✅ User created successfully')
        console.log('   🆔 User ID:', user._id)
        console.log('   🔒 Password hashed:', user.password ? 'yes' : 'no')
      }
    } catch (saveError) {
      console.error('   ❌ User save error:', saveError)
      console.error('Auth Failure Error:', saveError.message)
      console.error('   Error details:', {
        name: saveError.name,
        message: saveError.message,
        code: saveError.code,
        errors: saveError.errors,
      })
      
      // Check for specific error codes
      if (saveError.message.includes('EHOSTUNREACH')) {
        console.error('   🔴 EHOSTUNREACH detected in user save')
      }
      if (saveError.message.includes('ECONNREFUSED')) {
        console.error('   🔴 ECONNREFUSED detected in user save')
      }
      if (saveError.message.includes('Bad auth')) {
        console.error('   🔴 Bad auth detected in user save')
      }
      
      if (saveError.code === 11000) {
        return res.status(400).json({ error: 'User already exists' })
      }
      
      return res.status(500).json({ 
        error: 'Failed to create user account',
        details: process.env.NODE_ENV === 'development' ? saveError.message : undefined
      })
    }

    // Generate OTP
    console.log('   🔑 Generating OTP...')
    const otpCode = generateOTP()
    console.log('   🔑 OTP generated:', otpCode)

    // Delete any existing OTPs for this email
    try {
      const deletedCount = await OTP.deleteMany({ email: normalizedEmail })
      console.log('   🗑️  Deleted old OTPs:', deletedCount.deletedCount)
    } catch (otpDeleteError) {
      console.error('   ⚠️  Error deleting old OTPs:', otpDeleteError.message)
      // Continue anyway
    }

    // Save new OTP
    console.log('   💾 Saving OTP to database...')
    try {
      const otp = new OTP({ email: normalizedEmail, otpCode })
      await otp.save()
      console.log('   ✅ OTP saved successfully')
    } catch (otpSaveError) {
      console.error('   ❌ OTP save error:', otpSaveError)
      console.error('Auth Failure Error:', otpSaveError.message)
      return res.status(500).json({ 
        error: 'Failed to generate verification code',
        details: process.env.NODE_ENV === 'development' ? otpSaveError.message : undefined
      })
    }

    // Send OTP email
    console.log('   📧 Attempting to send OTP email...')
    try {
      await sendOTPEmail(email, otpCode)
      console.log('   ✅ Email sent successfully')
      const duration = Date.now() - startTime
      console.log(`   ⏱️  Signup completed in ${duration}ms`)
      console.log('📝 SIGNUP REQUEST END - SUCCESS\n')
      
      res.json({ 
        message: 'OTP sent to your email',
        // In development, also return OTP in response for testing
        ...(process.env.NODE_ENV === 'development' && { 
          devOtp: otpCode,
          note: 'OTP returned in development mode only. Check server console for OTP.'
        })
      })
    } catch (emailError) {
      console.error('   ❌ Email sending error:', emailError)
      console.error('   Error details:', {
        name: emailError.name,
        message: emailError.message,
      })
      
      // In development, still allow signup to proceed and return OTP
      if (process.env.NODE_ENV === 'development') {
        console.log('   ⚠️  Development mode: Returning OTP in response')
        const duration = Date.now() - startTime
        console.log(`   ⏱️  Signup completed in ${duration}ms (email failed)`)
        console.log('📝 SIGNUP REQUEST END - SUCCESS (EMAIL FAILED)\n')
        
        res.json({ 
          message: 'OTP generated (email not sent - check console)',
          devOtp: otpCode,
          warning: 'Email not configured. OTP returned for development only.'
        })
      } else {
        const duration = Date.now() - startTime
        console.log(`   ⏱️  Signup failed in ${duration}ms`)
        console.log('📝 SIGNUP REQUEST END - EMAIL ERROR\n')
        
        res.status(500).json({ 
          error: 'Failed to send email. Please check email configuration or contact support.',
          details: emailError.message
        })
      }
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('   ❌ UNEXPECTED SIGNUP ERROR:', error)
    console.error('Auth Failure Error:', error.message)
    console.error('   Error name:', error.name)
    console.error('   Error message:', error.message)
    console.error('   Error stack:', error.stack)
    
    // Check for specific error codes
    if (error.message && error.message.includes('EHOSTUNREACH')) {
      console.error('   🔴 EHOSTUNREACH detected in signup')
    }
    if (error.message && error.message.includes('ECONNREFUSED')) {
      console.error('   🔴 ECONNREFUSED detected in signup')
    }
    if (error.message && error.message.includes('Bad auth')) {
      console.error('   🔴 Bad auth detected in signup')
    }
    
    console.log(`   ⏱️  Signup failed in ${duration}ms`)
    console.log('📝 SIGNUP REQUEST END - ERROR\n')
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  const startTime = Date.now()
  console.log('\n✅ VERIFY REQUEST START')
  console.log('   Email:', req.body?.email ? 'provided' : 'missing')
  console.log('   OTP:', req.body?.otp ? 'provided' : 'missing')

  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      console.log('   ❌ Validation failed: Missing email or OTP')
      return res.status(400).json({ error: 'Email and OTP are required' })
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('   ❌ Database not connected. State:', mongoose.connection.readyState)
      return res.status(503).json({ 
        error: 'Database connection unavailable. Please try again later.' 
      })
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()
    console.log('   📧 Normalized email:', normalizedEmail)
    console.log('   🔑 OTP provided:', otp)

    // Find OTP
    console.log('   🔍 Searching for OTP...')
    let otpRecord
    try {
      otpRecord = await OTP.findOne({ email: normalizedEmail, otpCode: otp })
      console.log('   📊 OTP lookup result:', otpRecord ? 'found' : 'not found')
    } catch (dbError) {
      console.error('   ❌ Database query error:', dbError)
      console.error('Auth Failure Error:', dbError.message)
      
      // Check for specific error codes
      if (dbError.message && dbError.message.includes('EHOSTUNREACH')) {
        console.error('   🔴 EHOSTUNREACH detected in verify query')
      }
      if (dbError.message && dbError.message.includes('ECONNREFUSED')) {
        console.error('   🔴 ECONNREFUSED detected in verify query')
      }
      if (dbError.message && dbError.message.includes('Bad auth')) {
        console.error('   🔴 Bad auth detected in verify query')
      }
      
      return res.status(500).json({ 
        error: 'Database error. Please try again.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      })
    }

    if (!otpRecord) {
      console.log('   ❌ Verification failed: Invalid or expired OTP')
      const duration = Date.now() - startTime
      console.log(`   ⏱️  Verification failed in ${duration}ms`)
      console.log('✅ VERIFY REQUEST END - INVALID OTP\n')
      return res.status(400).json({ error: 'Invalid or expired OTP' })
    }

    // Check if OTP is expired (10 minutes)
    const now = new Date()
    const createdAt = new Date(otpRecord.createdAt)
    const diffMinutes = (now - createdAt) / (1000 * 60)
    console.log('   ⏰ OTP age:', diffMinutes.toFixed(2), 'minutes')

    if (diffMinutes > 10) {
      console.log('   ⚠️  OTP expired')
      await OTP.deleteOne({ _id: otpRecord._id })
      const duration = Date.now() - startTime
      console.log(`   ⏱️  Verification failed in ${duration}ms`)
      console.log('✅ VERIFY REQUEST END - EXPIRED OTP\n')
      return res.status(400).json({ error: 'OTP has expired' })
    }

    // Update user verification status
    console.log('   👤 Updating user verification status...')
    let user
    try {
      user = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { isVerified: true },
        { new: true }
      )
      console.log('   📊 User update result:', user ? 'found and updated' : 'not found')
    } catch (dbError) {
      console.error('   ❌ Database update error:', dbError)
      console.error('Auth Failure Error:', dbError.message)
      
      // Check for specific error codes
      if (dbError.message && dbError.message.includes('EHOSTUNREACH')) {
        console.error('   🔴 EHOSTUNREACH detected in user update')
      }
      if (dbError.message && dbError.message.includes('ECONNREFUSED')) {
        console.error('   🔴 ECONNREFUSED detected in user update')
      }
      if (dbError.message && dbError.message.includes('Bad auth')) {
        console.error('   🔴 Bad auth detected in user update')
      }
      
      return res.status(500).json({ 
        error: 'Database error. Please try again.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      })
    }

    if (!user) {
      console.log('   ❌ Verification failed: User not found')
      const duration = Date.now() - startTime
      console.log(`   ⏱️  Verification failed in ${duration}ms`)
      console.log('✅ VERIFY REQUEST END - USER NOT FOUND\n')
      return res.status(404).json({ error: 'User not found' })
    }

    // Delete used OTP
    console.log('   🗑️  Deleting used OTP...')
    try {
      await OTP.deleteOne({ _id: otpRecord._id })
      console.log('   ✅ OTP deleted')
    } catch (deleteError) {
      console.error('   ⚠️  Error deleting OTP (non-critical):', deleteError.message)
    }

    // Generate JWT token
    console.log('   🎫 Generating JWT token...')
    let token
    try {
      token = generateToken(user._id)
      console.log('   ✅ Token generated successfully')
    } catch (tokenError) {
      console.error('   ❌ Token generation error:', tokenError)
      return res.status(500).json({ 
        error: 'Failed to generate authentication token',
        details: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
      })
    }

    const duration = Date.now() - startTime
    console.log('   ✅ Verification successful')
    console.log(`   ⏱️  Verification completed in ${duration}ms`)
    console.log('✅ VERIFY REQUEST END - SUCCESS\n')

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('   ❌ UNEXPECTED VERIFY ERROR:', error)
    console.error('Auth Failure Error:', error.message)
    console.error('   Error name:', error.name)
    console.error('   Error message:', error.message)
    console.error('   Error stack:', error.stack)
    
    // Check for specific error codes
    if (error.message && error.message.includes('EHOSTUNREACH')) {
      console.error('   🔴 EHOSTUNREACH detected in verify')
    }
    if (error.message && error.message.includes('ECONNREFUSED')) {
      console.error('   🔴 ECONNREFUSED detected in verify')
    }
    if (error.message && error.message.includes('Bad auth')) {
      console.error('   🔴 Bad auth detected in verify')
    }
    
    console.log(`   ⏱️  Verification failed in ${duration}ms`)
    console.log('✅ VERIFY REQUEST END - ERROR\n')
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const startTime = Date.now()
  console.log('\n🔐 LOGIN REQUEST START')
  console.log('   Email:', req.body?.email ? 'provided' : 'missing')
  console.log('   Password:', req.body?.password ? 'provided' : 'missing')

  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      console.log('   ❌ Validation failed: Missing email or password')
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('   ❌ Database not connected. State:', mongoose.connection.readyState)
      return res.status(503).json({ 
        error: 'Database connection unavailable. Please try again later.' 
      })
    }

    // Find user (case-insensitive email search)
    const normalizedEmail = email.toLowerCase().trim()
    console.log('   📧 Normalized email:', normalizedEmail)
    console.log('   🔍 Searching for user...')
    
    let user
    try {
      user = await User.findOne({ email: normalizedEmail })
      console.log('   📊 User lookup result:', user ? 'found' : 'not found')
      if (user) {
        console.log('   🆔 User ID:', user._id)
        console.log('   ✅ Verified:', user.isVerified)
        console.log('   🔒 Has password hash:', user.password ? 'yes' : 'no')
      }
    } catch (dbError) {
      console.error('   ❌ Database query error:', dbError)
      console.error('   Error details:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
      })
      return res.status(500).json({ 
        error: 'Database error. Please try again.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      })
    }
    
    if (!user) {
      console.log('   ❌ Login failed: User not found')
      const duration = Date.now() - startTime
      console.log(`   ⏱️  Login failed in ${duration}ms`)
      console.log('🔐 LOGIN REQUEST END - USER NOT FOUND\n')
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    console.log('   🔐 Comparing password...')
    let isPasswordValid
    try {
      isPasswordValid = await user.comparePassword(password)
      console.log('   🔐 Password comparison result:', isPasswordValid ? 'valid' : 'invalid')
    } catch (compareError) {
      console.error('   ❌ Password comparison error:', compareError)
      console.error('Auth Failure Error:', compareError.message)
      console.error('   Error details:', {
        name: compareError.name,
        message: compareError.message,
      })
      return res.status(500).json({ 
        error: 'Authentication error. Please try again.',
        details: process.env.NODE_ENV === 'development' ? compareError.message : undefined
      })
    }
    
    if (!isPasswordValid) {
      console.log('   ❌ Login failed: Invalid password')
      const duration = Date.now() - startTime
      console.log(`   ⏱️  Login failed in ${duration}ms`)
      console.log('🔐 LOGIN REQUEST END - INVALID PASSWORD\n')
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check if verified
    if (!user.isVerified) {
      console.log('   ⚠️  Login failed: Email not verified')
      const duration = Date.now() - startTime
      console.log(`   ⏱️  Login failed in ${duration}ms`)
      console.log('🔐 LOGIN REQUEST END - NOT VERIFIED\n')
      return res.status(403).json({ 
        error: 'Please verify your email first. Check your inbox for the OTP code.',
        needsVerification: true
      })
    }

    // Generate JWT token
    console.log('   🎫 Generating JWT token...')
    let token
    try {
      token = generateToken(user._id)
      console.log('   ✅ Token generated successfully')
    } catch (tokenError) {
      console.error('   ❌ Token generation error:', tokenError)
      return res.status(500).json({ 
        error: 'Failed to generate authentication token',
        details: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
      })
    }

    const duration = Date.now() - startTime
    console.log('   ✅ Login successful')
    console.log(`   ⏱️  Login completed in ${duration}ms`)
    console.log('🔐 LOGIN REQUEST END - SUCCESS\n')
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('   ❌ UNEXPECTED LOGIN ERROR:', error)
    console.error('Auth Failure Error:', error.message)
    console.error('   Error name:', error.name)
    console.error('   Error message:', error.message)
    console.error('   Error stack:', error.stack)
    
    // Check for specific error codes
    if (error.message && error.message.includes('EHOSTUNREACH')) {
      console.error('   🔴 EHOSTUNREACH detected in login')
    }
    if (error.message && error.message.includes('ECONNREFUSED')) {
      console.error('   🔴 ECONNREFUSED detected in login')
    }
    if (error.message && error.message.includes('Bad auth')) {
      console.error('   🔴 Bad auth detected in login')
    }
    
    console.log(`   ⏱️  Login failed in ${duration}ms`)
    console.log('🔐 LOGIN REQUEST END - ERROR\n')
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export default router

