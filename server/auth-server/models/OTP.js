import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpCode: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes in seconds
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster lookups
otpSchema.index({ email: 1, createdAt: 1 })

const OTP = mongoose.model('OTP', otpSchema)

export default OTP

