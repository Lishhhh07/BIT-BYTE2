import { Download, X } from 'lucide-react'
import axios from 'axios'

type ReportModalProps = {
  open: boolean
  onClose: () => void
  coordinates?: { lat: number; lng: number } | null
}

const ReportModal = ({ open, onClose, coordinates }: ReportModalProps) => {
  if (!open) return null

  const now = new Date()
  const timestamp = now.toLocaleString()

  const handleDownload = async () => {
    try {
      await axios.get('http://localhost:5000/report', { responseType: 'blob' })
      // In a real build, handle Blob download; mocked here.
    } catch (error) {
      console.error('Failed to download report', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-700 transition hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="p-8 font-[Georgia,_serif] text-slate-900">
          <header className="mb-6 border-b border-slate-200 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              EcoWatch Legal Brief
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Subject: Violation of Indian Forest Act, 1927
            </h2>
          </header>

          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              <span className="font-semibold">Timestamp:</span> {timestamp}
            </p>
            <p>
              <span className="font-semibold">Coordinates:</span>{' '}
              {coordinates
                ? `${coordinates.lat.toFixed(3)}, ${coordinates.lng.toFixed(3)}`
                : 'Pending selection'}
            </p>
            <p>
              This report summarizes satellite-derived evidence indicating potential
              deforestation activity in the specified Indian jurisdiction. Findings
              align with preliminary violations under the Indian Forest Act, 1927 and
              may warrant escalation to regional authorities.
            </p>
            <p>
              Attached exhibits include processed satellite imagery, acreage loss
              estimations, and timeline comparisons used to substantiate the claim.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Mocked for prototype
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportModal

