import nodemailer from 'nodemailer'

// Email transporter configuration
const createTransporter = () => {
  // If SMTP credentials are provided, use them
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Default to Gmail SMTP for development if no SMTP config is provided
  // This requires an App Password from Gmail (not regular password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }

  // Development fallback: log OTP to console if no email config
  if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST) {
    console.warn('⚠️  Email not configured. Using console fallback for development.')
    return {
      sendMail: async (options) => {
        console.log('\n' + '='.repeat(60))
        console.log('📧 OTP EMAIL (Development Mode - Not Actually Sent)')
        console.log('='.repeat(60))
        console.log('To:', options.to)
        console.log('Subject:', options.subject)
        console.log('OTP Code:', options.text.match(/\d{6}/)?.[0] || 'Not found')
        console.log('='.repeat(60))
        console.log('⚠️  To send real emails, configure SMTP or Gmail in .env file')
        console.log('='.repeat(60) + '\n')
        return { messageId: 'dev-' + Date.now() }
      },
    }
  }

  // Production: throw error if no email config
  throw new Error(
    'Email configuration missing. Please set either SMTP_HOST, SMTP_USER, SMTP_PASS OR GMAIL_USER, GMAIL_APP_PASSWORD environment variables.'
  )
}

let transporter = null

// Initialize transporter with error handling
try {
  transporter = createTransporter()
} catch (error) {
  console.error('❌ Email transporter initialization failed:', error.message)
  console.error('⚠️  Using console fallback for development.')
  // Use console fallback in development
  transporter = {
    sendMail: async (options) => {
      console.log('\n' + '='.repeat(60))
      console.log('📧 OTP EMAIL (Development Mode - Not Actually Sent)')
      console.log('='.repeat(60))
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      const otpMatch = options.text?.match(/\d{6}/) || options.html?.match(/\d{6}/)
      if (otpMatch) {
        console.log('🔑 OTP Code:', otpMatch[0])
      }
      console.log('='.repeat(60))
      console.log('⚠️  To send real emails, configure SMTP or Gmail in .env file')
      console.log('='.repeat(60) + '\n')
      return { messageId: 'dev-' + Date.now() }
    },
  }
}

export const sendOTPEmail = async (email, otpCode) => {
  if (!transporter) {
    const error = new Error('Email service not configured')
    console.error('❌ Cannot send email:', error.message)
    throw error
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@ecowatch.com',
    to: email,
    subject: 'EcoWatch - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">EcoWatch Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #1e293b; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #a855f7; font-size: 32px; letter-spacing: 8px; margin: 0;">${otpCode}</h1>
        </div>
        <p style="color: #64748b;">This code will expire in 10 minutes.</p>
        <p style="color: #64748b;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
    text: `Your EcoWatch verification code is: ${otpCode}. This code will expire in 10 minutes.`,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ OTP email sent successfully to:', email)
    console.log('📧 Message ID:', info.messageId)
    return info
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

