import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ParallaxStarfield from '../components/ParallaxStarfield'
import DecoderText from '../components/DecoderText'

const caseStudies = [
  { title: 'Hasdeo Arand', region: 'Chhattisgarh, India', status: 'Under Review' },
  { title: 'Aravalli Range', region: 'Rajasthan, India', status: 'Monitoring' },
  { title: 'Western Ghats', region: 'Karnataka, India', status: 'Escalated' },
  { title: 'Sundarbans Delta', region: 'West Bengal, India', status: 'Safe' },
]

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <ParallaxStarfield />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-950 z-[1]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-12 md:px-10 md:py-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-neonPurple">
            <Sparkles className="h-6 w-6" />
            <span className="font-display text-lg tracking-wide">EcoWatch</span>
          </div>
          <span className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Deep Space Monitoring
          </span>
        </header>

        <main className="mt-16 flex flex-1 flex-col gap-12 md:mt-24">
          <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-8">
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.2em] text-slate-300 backdrop-blur"
              >
                Orbital Command
                <span className="h-1.5 w-1.5 rounded-full bg-cyberGreen shadow-glow" />
              </motion.p>

              <h1 className="font-display text-4xl leading-tight text-white md:text-5xl lg:text-6xl">
                <DecoderText text="Defending Earth from Space" delay={100} />
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 1.8 }}
                className="max-w-xl text-lg text-slate-300"
              >
                EcoWatch fuses satellite intelligence, AI analysis, and immersive 3D
                visualization to detect deforestation before it becomes irreversible.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 2.0 }}
                className="flex flex-wrap items-center gap-4"
              >
                <button
                  onClick={() => navigate('/dashboard')}
                  className="holographic-button flex items-center gap-3 rounded-full border-2 border-cyan-400 bg-transparent px-6 py-3 text-lg font-semibold text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.8)] hover:scale-[1.02] relative overflow-hidden"
                >
                  <span className="relative z-10">Start Monitoring</span>
                  <ArrowRight className="h-5 w-5 relative z-10" />
                </button>
                <span className="text-sm text-slate-400">
                  Cinematic deep-space dashboard awaits
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl relative overflow-hidden p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neonPurple/20 via-electricBlue/10 to-transparent" />
              <div className="relative space-y-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
                  Recent Case Studies
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {caseStudies.map((item, idx) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{
                        type: 'spring',
                        stiffness: 100,
                        damping: 15,
                        delay: idx * 0.1,
                      }}
                      className="backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl flex cursor-pointer flex-col gap-2 p-4 transition hover:border-white/30 hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-display text-lg text-white">{item.title}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === 'Safe'
                              ? 'bg-cyberGreen/20 text-cyberGreen'
                              : 'bg-white/10 text-slate-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{item.region}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default LandingPage

