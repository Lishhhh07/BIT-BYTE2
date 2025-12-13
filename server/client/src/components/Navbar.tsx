import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, User, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'

const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase()
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)]">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-3 text-neonPurple cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Sparkles className="h-6 w-6" />
            <span className="font-display text-lg tracking-wide">EcoWatch</span>
          </div>

          <div className="flex items-center gap-4">
            {location.pathname !== '/dashboard' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Dashboard
              </button>
            )}

            {/* Optional: Show user info if logged in, but don't require it */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3"
              >
                <div className="flex items-center gap-2 backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-full px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(user.email)}
                  </div>
                  <span className="text-sm text-white hidden md:block max-w-[150px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}

export default Navbar

