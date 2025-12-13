import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    console.log('   🔒 Password not modified, skipping hash')
    return next()
  }
  
  try {
    console.log('   🔒 Hashing password...')
    const hashedPassword = await bcrypt.hash(this.password, 10)
    this.password = hashedPassword
    console.log('   ✅ Password hashed successfully')
    console.log('   🔑 Hash length:', hashedPassword.length)
    next()
  } catch (hashError) {
    console.error('   ❌ Password hashing error:', hashError)
    next(hashError)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log('   🔐 Comparing password (bcrypt)...')
    const result = await bcrypt.compare(candidatePassword, this.password)
    console.log('   🔐 Password comparison result:', result ? 'match' : 'no match')
    return result
  } catch (compareError) {
    console.error('   ❌ Password comparison error:', compareError)
    throw compareError
  }
}

const User = mongoose.model('User', userSchema)

export default User

