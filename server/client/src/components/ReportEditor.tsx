import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, X, Edit2, Save } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

type ReportEditorProps = {
  open: boolean
  onClose: () => void
  coordinates?: { lat: number; lng: number } | null
  analysisData?: {
    deforestationScore?: number
    startDate?: string
    endDate?: string
    beforeImage?: string
    afterImage?: string
    acreageLost?: string
  }
  userName?: string
  regionName?: string
}

const ReportEditor = ({
  open,
  onClose,
  coordinates,
  analysisData,
  userName = 'EcoWatch Environmental Protection Organization',
  regionName = 'India',
}: ReportEditorProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<Record<string, string>>({})
  const contentRef = useRef<HTMLDivElement>(null)

  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getDefaultContent = () => {
    const coords = coordinates
      ? `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
      : '[Coordinates]'
    const score = analysisData?.deforestationScore || 0
    const startDate = formatDate(analysisData?.startDate)
    const endDate = formatDate(analysisData?.endDate)
    const acreage = analysisData?.acreageLost || 'Not calculated'

    return {
      state: '[INSERT STATE]',
      tribunal: '[INSERT LOCAL AUTHORITY]',
      place: '[INSERT PLACE]',
      petitioner: userName,
      region: regionName,
      coordinates: coords,
      deforestationScore: score.toFixed(2),
      startDate,
      endDate,
      acreageLost: acreage,
      contractor: '[INSERT PRIVATE CONTRACTOR NAME]',
    }
  }

  const [content, setContent] = useState(getDefaultContent())

  useEffect(() => {
    const defaults = getDefaultContent()
    setContent({ ...defaults, ...editedContent })
  }, [coordinates, analysisData, userName, regionName])

  const handleContentChange = (key: string, value: string) => {
    setEditedContent((prev) => ({ ...prev, [key]: value }))
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgScaledWidth = imgWidth * ratio
      const imgScaledHeight = imgHeight * ratio
      const xOffset = (pdfWidth - imgScaledWidth) / 2
      const yOffset = (pdfHeight - imgScaledHeight) / 2

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgScaledWidth, imgScaledHeight)
      pdf.save(`Legal_Petition_${content.region}_${Date.now()}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  if (!open) return null

  const EditableField = ({
    id,
    value,
    className = '',
    placeholder,
    multiline = false,
  }: {
    id: string
    value: string
    className?: string
    placeholder?: string
    multiline?: boolean
  }) => {
    if (isEditing) {
      if (multiline) {
        return (
          <textarea
            value={value}
            onChange={(e) => handleContentChange(id, e.target.value)}
            className={`${className} border border-blue-300 rounded px-1 py-0.5 bg-yellow-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder={placeholder}
            rows={3}
          />
        )
      }
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleContentChange(id, e.target.value)}
          className={`${className} border border-blue-300 rounded px-1 py-0.5 bg-yellow-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
          placeholder={placeholder}
        />
      )
    }
    return (
      <span
        className={value.includes('[') ? 'bg-yellow-100 px-1 rounded' : className}
        contentEditable={isEditing}
        suppressContentEditableWarning
      >
        {value}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl my-8"
      >
        {/* Floating Action Buttons */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 backdrop-blur-xl bg-black/30 border border-white/10 shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-full px-4 py-3 text-white hover:bg-white/10 transition-colors"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            <span className="text-sm font-semibold">{isEditing ? 'Save' : 'Edit'}</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 backdrop-blur-xl bg-gradient-to-r from-neonPurple to-electricBlue rounded-full px-4 py-3 text-white shadow-lg hover:scale-105 transition-transform"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-semibold">Sign & Download Petition</span>
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-cyan-400 transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Document Container - A4 Paper Style */}
        <div
          ref={contentRef}
          className="bg-white shadow-2xl mx-auto"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            fontFamily: 'Times New Roman, serif',
            fontSize: '12pt',
            lineHeight: '1.6',
            color: '#000000',
          }}
        >
          {/* Header with Emblem */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/200px-Emblem_of_India.svg.png"
                alt="National Emblem of India"
                className="h-16 mx-auto mb-2"
              />
            </div>
            <p className="text-sm font-bold uppercase tracking-wide mb-2">
              GOVERNMENT OF <EditableField id="state" value={content.state} /> - FOREST DEPARTMENT AUTHORITY
            </p>
          </div>

          {/* Court Title */}
          <div className="text-center mb-6">
            <p className="text-sm font-bold">
              BEFORE THE NATIONAL GREEN TRIBUNAL / <EditableField id="tribunal" value={content.tribunal} /> AT{' '}
              <EditableField id="place" value={content.place} />
            </p>
          </div>

          {/* Parties Section */}
          <div className="mb-6 space-y-2">
            <p>
              <span className="font-bold">Petitioner:</span>{' '}
              <EditableField id="petitioner" value={content.petitioner} /> (Working for environment protection in{' '}
              <EditableField id="region" value={content.region} />)
            </p>
            <p className="text-center font-bold">VERSUS</p>
            <p>
              <span className="font-bold">Respondent No. 1:</span> Union of India / State of{' '}
              <EditableField id="state" value={content.state} />
            </p>
            <p>
              <span className="font-bold">Respondent No. 2:</span>{' '}
              <EditableField id="tribunal" value={content.tribunal} />
            </p>
            <p>
              <span className="font-bold">Respondent No. 3:</span>{' '}
              <EditableField id="contractor" value={content.contractor} /> (Private Contractor)
            </p>
          </div>

          {/* Subject Line */}
          <div className="mb-4 text-center">
            <p className="font-bold text-base uppercase mb-2">
              REPORT SEEKING IMMEDIATE CESSATION OF DEFORESTATION IN{' '}
              <EditableField id="region" value={content.region} />
            </p>
            <p className="text-sm italic text-slate-700 mt-2">धर्मस्ततो जयः</p>
            <p className="text-xs text-slate-600 mt-1">(Where there is Dharma, there is Victory)</p>
          </div>

          <hr className="my-6 border-t-2 border-black" />

          {/* Paragraph 1 - Introduction */}
          <div className="mb-4">
            <p className="text-justify">
              The Petitioner above named most respectfully submits as under:
            </p>
          </div>

          {/* Paragraph 2 - Factual Matrix */}
          <div className="mb-4">
            <p className="font-bold mb-2">2. FACTUAL MATRIX:</p>
            <p className="text-justify">
              It is submitted that the forest land located at{' '}
              <span className="bg-yellow-100 px-1 rounded font-semibold">
                <EditableField id="coordinates" value={content.coordinates} />
              </span>{' '}
              is currently witnessing massive deforestation. Satellite analysis from{' '}
              <span className="bg-yellow-100 px-1 rounded">
                <EditableField id="startDate" value={content.startDate} />
              </span>{' '}
              to{' '}
              <span className="bg-yellow-100 px-1 rounded">
                <EditableField id="endDate" value={content.endDate} />
              </span>{' '}
              reveals a vegetation loss of{' '}
              <span className="bg-yellow-100 px-1 rounded font-semibold">
                <EditableField id="deforestationScore" value={`${content.deforestationScore}%`} />
              </span>
              . The total acreage lost amounts to approximately{' '}
              <span className="bg-yellow-100 px-1 rounded">
                <EditableField id="acreageLost" value={content.acreageLost} />
              </span>
              .
            </p>
          </div>

          {/* Annexure A - Satellite Evidence */}
          <div className="mb-6">
            <p className="font-bold mb-3">ANNEXURE A: SATELLITE EVIDENCE</p>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <img
                  src={analysisData?.beforeImage || 'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=400&q=80'}
                  alt="Before deforestation"
                  className="w-full h-48 object-cover border-2 border-gray-300"
                />
                <p className="text-xs text-center mt-1 italic">Before</p>
              </div>
              <div>
                <img
                  src={analysisData?.afterImage || 'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?auto=format&fit=crop&w=400&q=80'}
                  alt="After deforestation"
                  className="w-full h-48 object-cover border-2 border-gray-300"
                />
                <p className="text-xs text-center mt-1 italic">After</p>
              </div>
            </div>
            <p className="text-xs italic text-center">
              Figure 1: Comparative Analysis showing clear vegetation loss at{' '}
              <span className="font-semibold">{content.coordinates}</span>.
            </p>
          </div>

          {/* Paragraph 3 - Legal Grounds */}
          <div className="mb-4">
            <p className="font-bold mb-2">3. LEGAL GROUNDS:</p>
            <div className="space-y-3 text-justify">
              <p>
                <span className="font-bold">A. Violation of Statutory Laws:</span> The deforestation activities
                constitute a clear violation of{' '}
                <span className="font-semibold">The Forest (Conservation) Act, 1980</span> and{' '}
                <span className="font-semibold">The Environment (Protection) Act, 1986</span>. These Acts mandate
                that any diversion of forest land requires prior approval from the Central Government and
                compliance with environmental safeguards.
              </p>
              <p>
                <span className="font-bold">B. Public Trust Doctrine:</span> The State is a trustee of all
                natural resources, including forests, and is obligated to protect them for the benefit of present
                and future generations. The unauthorized deforestation violates this fundamental principle of
                environmental governance.
              </p>
              <p>
                <span className="font-bold">C. Article 21 of the Constitution:</span> The right to life under
                Article 21 of the Constitution of India includes the right to a clean and healthy environment.
                The destruction of forests directly violates this fundamental right by degrading air quality,
                disrupting water cycles, and threatening biodiversity.
              </p>
            </div>
          </div>

          {/* Paragraph 4 - Prayer */}
          <div className="mb-4">
            <p className="font-bold mb-2">4. PRAYER:</p>
            <p className="text-justify">
              In view of the above, it is most respectfully prayed that this Hon'ble Tribunal may be pleased to:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4 mt-2">
              <li>Issue an immediate order to cease all deforestation activities at the aforementioned location.</li>
              <li>Direct the Respondents to restore the degraded forest land to its original state.</li>
              <li>Impose appropriate penalties on the Respondents for violation of environmental laws.</li>
              <li>Direct the Respondents to submit a comprehensive action plan for forest restoration.</li>
              <li>Pass such other orders as this Hon'ble Tribunal may deem fit and proper in the circumstances.</li>
            </ol>
          </div>

          {/* Signature Section */}
          <div className="mt-12 text-right">
            <p className="mb-2">Respectfully submitted,</p>
            <p className="font-semibold">{content.petitioner}</p>
            <p className="text-xs mt-4">Date: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ReportEditor

