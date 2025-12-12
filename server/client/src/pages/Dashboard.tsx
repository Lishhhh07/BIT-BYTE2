import Globe from 'react-globe.gl'
import { motion } from 'framer-motion'
import { Search, MapPin, SatelliteDish } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AnalysisView from './AnalysisView'
import ReportModal from '../components/ReportModal'

type Location = {
  name: string
  lat: number
  lng: number
  description: string
}

const locations: Location[] = [
  {
    name: 'Bangalore',
    lat: 12.9716,
    lng: 77.5946,
    description: 'Urban expansion with surrounding forest pressure.',
  },
  {
    name: 'Hasdeo Arand',
    lat: 22.6333,
    lng: 82.1333,
    description: 'Coal block deforestation corridor.',
  },
  {
    name: 'Aravalli Range',
    lat: 27.8826,
    lng: 76.0248,
    description: 'Illegal mining and quarry traces.',
  },
]

const earthTexture =
  'https://unpkg.com/three-globe/example/img/earth-dark.jpg'
const bumpMap =
  'https://unpkg.com/three-globe/example/img/earth-topology.png'

const Dashboard = () => {
  const globeRef = useRef<any>(null)
  const [query, setQuery] = useState('')
  const [globeOpacity, setGlobeOpacity] = useState(1)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [analysisCoords, setAnalysisCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isZooming, setIsZooming] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 0.45
  }, [autoRotate])

  const arcsData = useMemo(
    () =>
      locations.map((loc) => ({
        startLat: loc.lat,
        startLng: loc.lng,
        endLat: loc.lat + 4 * Math.random(),
        endLng: loc.lng + 4 * Math.random(),
        color: ['#a855f7', '#3b82f6', '#10b981'][Math.floor(Math.random() * 3)],
      })),
    []
  )

  const handleSearch = () => {
    const selected = locations.find(
      (loc) => loc.name.toLowerCase() === query.trim().toLowerCase()
    )
    if (!selected || !globeRef.current) return

    setAutoRotate(false)
    setIsZooming(true)
    globeRef.current.pointOfView(
      {
        lat: selected.lat,
        lng: selected.lng,
        altitude: 1.6,
      },
      2000
    )
    setAnalysisCoords({ lat: selected.lat, lng: selected.lng })

    window.setTimeout(() => {
      setGlobeOpacity(0)
      setShowMap(true)
      setIsZooming(false)
    }, 2100)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-starfield opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/70 to-slate-950" />

      <div className="relative z-10 flex min-h-screen flex-col gap-8 px-4 pb-12 pt-6 md:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SatelliteDish className="h-6 w-6 text-electricBlue" />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Orbital Dashboard
              </p>
              <p className="font-display text-xl text-white">EcoWatch Deep Space</p>
            </div>
          </div>

          <div className="glass flex w-full max-w-xl items-center gap-3 rounded-full px-4 py-3 shadow-glow">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              placeholder="Enter Coordinates or Region (try “Bangalore”)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="rounded-full bg-gradient-to-r from-neonPurple to-electricBlue px-4 py-2 text-xs font-semibold text-white transition hover:scale-[1.02]"
            >
              Lock Target
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: globeOpacity }}
            transition={{ duration: 0.8 }}
            className="fade-edge absolute inset-0"
          >
            <Globe
              ref={globeRef}
              globeImageUrl={earthTexture}
              bumpImageUrl={bumpMap}
              backgroundColor="rgba(0,0,0,0)"
              arcsData={arcsData}
              arcColor={(d: any) => d.color}
              arcDashLength={0.6}
              arcDashGap={0.2}
              arcDashAnimateTime={4000}
              animateIn
            />
          </motion.div>

          {showMap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 grid place-items-center bg-gradient-to-b from-slate-900/90 to-slate-950"
            >
              <div className="relative w-[90%] max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <p className="mb-3 flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-slate-300">
                  <MapPin className="h-4 w-4" />
                  Satellite View
                </p>
                <div className="h-72 w-full overflow-hidden rounded-2xl bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80')] bg-cover bg-center opacity-90" />
              </div>
            </motion.div>
          )}

          {isZooming && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-24 w-24 animate-ping rounded-full bg-electricBlue/30" />
            </div>
          )}
        </div>

        {showMap && (
          <AnalysisView
            coordinates={analysisCoords}
            onReportReady={() => setReportOpen(true)}
          />
        )}
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        coordinates={analysisCoords}
      />
    </div>
  )
}

export default Dashboard

