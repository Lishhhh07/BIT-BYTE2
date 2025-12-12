import Globe from 'react-globe.gl'
import { motion } from 'framer-motion'
import { Search, MapPin, SatelliteDish } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AnalysisView from './AnalysisView'
import ReportModal from '../components/ReportModal'
import StarsBackground from '../components/StarsBackground'

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
  const [warpSpeed, setWarpSpeed] = useState(false)
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)

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
    setWarpSpeed(true)

    // Warp speed effect: rapidly move camera forward
    const controls = globeRef.current.controls()
    const startAltitude = controls.getDistance()
    const targetAltitude = 0.5
    const duration = 2000
    const startTime = Date.now()

    const animateWarp = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentAltitude = startAltitude - (startAltitude - targetAltitude) * easeOut
      globeRef.current.pointOfView(
        {
          lat: selected.lat,
          lng: selected.lng,
          altitude: currentAltitude,
        },
        0
      )

      if (progress < 1) {
        requestAnimationFrame(animateWarp)
      } else {
        setWarpSpeed(false)
        setGlobeOpacity(0)
        setShowMap(true)
        setIsZooming(false)
      }
    }

    animateWarp()
    setAnalysisCoords({ lat: selected.lat, lng: selected.lng })
  }

  const pointsData = useMemo(
    () =>
      locations.map((loc) => ({
        lat: loc.lat,
        lng: loc.lng,
        name: loc.name,
        description: loc.description,
        size: 15,
      })),
    []
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <StarsBackground />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/70 to-slate-950 z-[1]" />

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

          <div className="backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-full flex w-full max-w-xl items-center gap-3 px-4 py-3">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              placeholder="Enter Coordinates or Region (try "Bangalore")"
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

        <div className="relative flex-1 overflow-hidden backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl">
          {warpSpeed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 pointer-events-none"
            >
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at center, transparent, rgba(59, 130, 246, 0.2), rgba(30, 58, 138, 0.4))'
              }} />
              <div
                className="absolute inset-0 warp-lines"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.2) 2px, rgba(59, 130, 246, 0.2) 4px)',
                }}
              />
            </motion.div>
          )}

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
              pointsData={pointsData}
              pointColor={() => '#ef4444'}
              pointRadius={(d: any) => d.size || 15}
              pointResolution={2}
              pointLabel={(d: any) => d.name}
              onPointHover={(point: any, prevPoint: any) => {
                if (point) {
                  setHoveredHotspot(point.name)
                } else {
                  setHoveredHotspot(null)
                }
              }}
              animateIn
            />
          </motion.div>

          {hoveredHotspot && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-4 backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl p-4 z-20"
            >
              <p className="text-sm font-semibold text-white">{hoveredHotspot}</p>
              <p className="text-xs text-slate-400 mt-1">
                {locations.find((l) => l.name === hoveredHotspot)?.description}
              </p>
            </motion.div>
          )}

          {showMap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 grid place-items-center bg-gradient-to-b from-slate-900/90 to-slate-950"
            >
              <div className="relative w-[90%] max-w-4xl overflow-hidden backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl p-4">
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

