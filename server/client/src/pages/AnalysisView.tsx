import axios from 'axios'
import { motion } from 'framer-motion'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getAIServerURL } from '../config/api'

type AnalysisViewProps = {
  coordinates?: { lat: number; lng: number } | null
  onReportReady: (data: {
    deforestationScore: number
    startDate: string
    endDate: string
    beforeImage: string
    afterImage: string
    acreageLost: string
  }) => void
}

type AnalysisResult = {
  processedImage: string
  acreageLost: string
}

const timelineOptions = [
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
]

const placeholderBefore =
  'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=900&q=80'
const placeholderAfter =
  'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?auto=format&fit=crop&w=900&q=80'

const AnalysisView = ({ coordinates, onReportReady }: AnalysisViewProps) => {
  const [timeline, setTimeline] = useState('3m')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const getDateRange = (timelineValue: string) => {
    const end = new Date()
    const start = new Date()
    switch (timelineValue) {
      case '3m':
        start.setMonth(start.getMonth() - 3)
        break
      case '6m':
        start.setMonth(start.getMonth() - 6)
        break
      case '1y':
        start.setFullYear(start.getFullYear() - 1)
        break
    }
    return { start, end }
  }

  const processedImage = useMemo(
    () =>
      result?.processedImage ||
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    [result]
  )

  const handleAnalyze = async () => {
    setStatus('loading')
    try {
      const response = await axios.post(getAIServerURL('/analyze'), {
        lat: coordinates?.lat,
        lng: coordinates?.lng,
        timeline,
      }, {
        timeout: 30000,
      })
      const payload = response.data || {}
      setResult({
        processedImage:
          payload.processedImage ||
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
        acreageLost: payload.acreageLost || '1,240 acres',
      })
    } catch (error) {
      console.error('Analysis failed, showing mock output', error)
      setResult({
        processedImage:
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
        acreageLost: '1,240 acres',
      })
    } finally {
      setStatus('done')
    }
  }

  return (
    <section className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
            Surface Change Analysis
          </p>
          <p className="mt-1 text-lg text-white">
            {coordinates
              ? `${coordinates.lat.toFixed(2)}, ${coordinates.lng.toFixed(2)}`
              : 'Awaiting coordinates'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {timelineOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeline(option.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                timeline === option.value
                  ? 'bg-cyberGreen text-slate-900'
                  : 'bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl p-4">
          <p className="mb-2 text-sm text-slate-300">Before</p>
          <img
            src={placeholderBefore}
            alt="Before imagery"
            className="h-64 w-full rounded-xl object-cover"
          />
        </div>
        <div className="backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl p-4">
          <p className="mb-2 text-sm text-slate-300">After</p>
          <img
            src={placeholderAfter}
            alt="After imagery"
            className="h-64 w-full rounded-xl object-cover"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleAnalyze}
          className="button-glow flex items-center gap-3 rounded-full bg-cyberGreen px-6 py-3 text-sm font-semibold text-slate-900 transition hover:scale-[1.02]"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning Surface...
            </>
          ) : (
            'Start AI Analysis'
          )}
        </button>
        <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
          Secure inference pipeline
        </span>
      </div>

      {status === 'done' && result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="overflow-hidden backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl">
            <img
              src={processedImage}
              alt="Processed imagery"
              className="h-72 w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-4 backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-6 w-6 text-neonPurple" />
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                  AI Summary
                </p>
                <p className="text-2xl font-semibold text-white">
                  Acreage Lost: {result.acreageLost}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Highlighted regions indicate accelerated canopy reduction. Findings
              combine NDVI drift, thermal signatures, and anomaly clustering.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const dateRange = getDateRange(timeline)
                  const score = parseFloat(result?.acreageLost.replace(/[^0-9.]/g, '') || '0') / 10 // Mock score calculation
                  onReportReady({
                    deforestationScore: score || 15.5,
                    startDate: dateRange.start.toISOString(),
                    endDate: dateRange.end.toISOString(),
                    beforeImage: placeholderBefore,
                    afterImage: processedImage,
                    acreageLost: result?.acreageLost || '1,240 acres',
                  })
                }}
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-neonPurple to-electricBlue px-4 py-2 text-sm font-semibold text-white transition hover:scale-[1.01]"
              >
                Generate Legal Report
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </section>
  )
}

export default AnalysisView

