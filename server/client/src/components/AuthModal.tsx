import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Mail, Shield } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

type AuthModalProps = {
  open: boolean
  onClose: () => void
}

type Step = 'signup' | 'otp' | 'login'

const AUTH_API_URL = 'http://localhost:5001/api/auth'

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [step, setStep] = useState<Step>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { login } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${AUTH_API_URL}/signup`, {
        email,
        password,
      })

      if (response.data.message) {
        setStep('otp')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        email,
        password,
      })

      if (response.data.token) {
        login(response.data.token, response.data.user)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
          resetForm()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit OTP')
      triggerShake()
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${AUTH_API_URL}/verify`, {
        email,
        otp: otpCode,
      })

      if (response.data.token) {
        login(response.data.token, response.data.user)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onClose()
          resetForm()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed')
      triggerShake()
      setOtp(['', '', '', '', '', ''])
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const resetForm = () => {
    setStep('login')
    setEmail('')
    setPassword('')
    setOtp(['', '', '', '', '', ''])
    setError('')
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-md"
      >
        {/* Success Particle Effect */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-50"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 2 }}
                  exit={{ scale: 3, opacity: 0 }}
                  className="w-64 h-64 rounded-full bg-cyberGreen/30 blur-2xl"
                />
                <motion.div
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="absolute text-6xl"
                >
                  ✓
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Modal */}
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-xl bg-black/40 border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.3)] rounded-2xl p-8 relative overflow-hidden"
        >
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <div className="h-full w-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent animate-pulse" />
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              onClose()
              resetForm()
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative z-10">
            <h2 className="text-2xl font-display text-white mb-2 flex items-center gap-2">
              <Shield className="h-6 w-6 text-cyan-400" />
              {step === 'signup'
                ? 'Create Account'
                : step === 'otp'
                  ? 'Verify Email'
                  : 'Login'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {step === 'signup'
                ? 'Enter your credentials to begin'
                : step === 'otp'
                  ? 'Enter the 6-digit code sent to your email'
                  : 'Enter your credentials to access'}
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm"
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 'signup' || step === 'login' ? (
                <motion.form
                  key={step}
                  initial={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={step === 'signup' ? handleSignup : handleLogin}
                  className="space-y-4"
                >
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-cyan-500/30 focus:border-cyan-400 text-white placeholder:text-slate-500 focus:outline-none transition-colors sci-fi-input"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cyan-400/50" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 bg-transparent border-b-2 border-cyan-500/30 focus:border-cyan-400 text-white placeholder:text-slate-500 focus:outline-none transition-colors sci-fi-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 text-white font-semibold rounded-lg hover:border-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {loading
                        ? 'Processing...'
                        : step === 'signup'
                          ? 'Send Verification Code'
                          : 'Login'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep(step === 'login' ? 'signup' : 'login')}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {step === 'login'
                        ? "Don't have an account? Sign up"
                        : 'Already have an account? Login'}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="otp"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleVerify}
                  className="space-y-6"
                >
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleOtpChange(index, e.target.value.replace(/\D/g, ''))
                        }
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-2xl font-mono bg-black/40 border-2 border-cyan-500/30 focus:border-cyan-400 text-white rounded-lg focus:outline-none transition-colors sci-fi-input"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/50 text-white font-semibold rounded-lg hover:border-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('signup')
                      setOtp(['', '', '', '', '', ''])
                      setError('')
                    }}
                    className="w-full text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    ← Back to Signup
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep('login')}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Already verified? Login instead
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AuthModal

