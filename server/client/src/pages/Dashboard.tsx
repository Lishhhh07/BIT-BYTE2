import Globe from 'react-globe.gl'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, SatelliteDish, AlertTriangle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import AnalysisView from './AnalysisView'
import ReportEditor from '../components/ReportEditor'
import StarsBackground from '../components/StarsBackground'

type Hotspot = {
  id: string
  name: string
  lat: number
  lng: number
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low'
}

const AUTH_API_URL = 'http://localhost:5001/api'

const earthTexture =
  'https://unpkg.com/three-globe/example/img/earth-dark.jpg'
const bumpMap =
  'https://unpkg.com/three-globe/example/img/earth-topology.png'

const Dashboard = () => {
  const globeRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [filteredHotspots, setFilteredHotspots] = useState<Hotspot[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [globeOpacity, setGlobeOpacity] = useState(1)
  const [autoRotate, setAutoRotate] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [analysisCoords, setAnalysisCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isZooming, setIsZooming] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [warpSpeed, setWarpSpeed] = useState(false)
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)

  // Fetch hotspots from API
  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        const response = await axios.get(`${AUTH_API_URL}/locations`)
        if (response.data.success) {
          setHotspots(response.data.hotspots)
        }
      } catch (error) {
        console.error('Failed to fetch hotspots:', error)
      }
    }
    fetchHotspots()
  }, [])

  // Filter hotspots based on query
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredHotspots([])
      setShowSuggestions(false)
      return
    }

    const filtered = hotspots.filter((hotspot) =>
      hotspot.name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredHotspots(filtered)
    setShowSuggestions(filtered.length > 0)
  }, [query, hotspots])

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls()
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 0.45
  }, [autoRotate])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.suggestions-dropdown')
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const arcsData = useMemo(
    () =>
      hotspots.map((loc) => ({
        startLat: loc.lat,
        startLng: loc.lng,
        endLat: loc.lat + 4 * Math.random(),
        endLng: loc.lng + 4 * Math.random(),
        color:
          loc.risk_level === 'Critical'
            ? '#ef4444'
            : loc.risk_level === 'High'
              ? '#f59e0b'
              : '#3b82f6',
      })),
    [hotspots]
  )

  const flyToLocation = (hotspot: Hotspot) => {
    if (!globeRef.current) return

    setQuery(hotspot.name)
    setShowSuggestions(false)
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
          lat: hotspot.lat,
          lng: hotspot.lng,
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
    setAnalysisCoords({ lat: hotspot.lat, lng: hotspot.lng })
  }

  const handleSearch = () => {
    if (filteredHotspots.length === 0) return
    // Select the first filtered result
    flyToLocation(filteredHotspots[0])
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical':
        return 'text-red-400'
      case 'High':
        return 'text-orange-400'
      case 'Medium':
        return 'text-yellow-400'
      default:
        return 'text-green-400'
    }
  }

  const pointsData = useMemo(
    () =>
      hotspots.map((hotspot) => ({
        lat: hotspot.lat,
        lng: hotspot.lng,
        name: hotspot.name,
        risk_level: hotspot.risk_level,
        size: hotspot.risk_level === 'Critical' ? 20 : hotspot.risk_level === 'High' ? 15 : 10,
      })),
    [hotspots]
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <StarsBackground />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/70 to-slate-950 z-[1]" />

      <div className="relative z-10 flex min-h-screen flex-col gap-8 px-4 pb-12 pt-24 md:px-8">
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

          <div className="relative w-full max-w-xl">
            <div className="backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-full flex items-center gap-3 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                ref={searchInputRef}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                placeholder="Search deforestation hotspots..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && filteredHotspots.length > 0 && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredHotspots.length > 0) {
                    handleSearch()
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false)
                  }
                }}
              />
              <button
                onClick={handleSearch}
                disabled={filteredHotspots.length === 0}
                className="rounded-full bg-gradient-to-r from-neonPurple to-electricBlue px-4 py-2 text-xs font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lock Target
              </button>
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && filteredHotspots.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="suggestions-dropdown absolute top-full mt-2 w-full backdrop-blur-xl bg-black/40 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
                >
                  {filteredHotspots.map((hotspot) => (
                    <button
                      key={hotspot.id}
                      onClick={() => flyToLocation(hotspot)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-3 group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {hotspot.name}
                          </p>
                          <span
                            className={`text-xs font-semibold ${getRiskColor(hotspot.risk_level)}`}
                          >
                            {hotspot.risk_level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                        </p>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-red-400/50 group-hover:text-red-400 transition-colors" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
              pointColor={(d: any) =>
                d.risk_level === 'Critical'
                  ? '#ef4444'
                  : d.risk_level === 'High'
                    ? '#f59e0b'
                    : '#3b82f6'
              }
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
                {hotspots.find((h) => h.name === hoveredHotspot)?.risk_level} Risk Level
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
            onReportReady={(data) => {
              setAnalysisData(data)
              setReportOpen(true)
            }}
          />
        )}
      </div>

      <ReportEditor
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        coordinates={analysisCoords}
        analysisData={analysisData}
        regionName={hotspots.find((h) => 
          h.lat === analysisCoords?.lat && h.lng === analysisCoords?.lng
        )?.name || 'India'}
      />
    </div>
  )
}

export default Dashboard

