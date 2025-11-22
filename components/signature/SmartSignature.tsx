'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Pen,
  Type,
  Upload,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Download,
  Wand2,
} from 'lucide-react'
import {
  detectSignatureFields,
  suggestSignaturePlacement,
  resizeSignature,
  applySignatureToPages,
  SignatureField,
  SIGNATURE_TEMPLATES,
} from '@/lib/utils/signature-detector'

interface SmartSignatureProps {
  documentPages: number
  onSignatureComplete?: (signatures: any[]) => void
}

export default function SmartSignature({ documentPages, onSignatureComplete }: SmartSignatureProps) {
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>('draw')
  const [signature, setSignature] = useState<string | null>(null)
  const [detectedFields, setDetectedFields] = useState<SignatureField[]>([])
  const [showDetection, setShowDetection] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(SIGNATURE_TEMPLATES[0])
  const [autoPlacement, setAutoPlacement] = useState(true)
  const [applyToAllPages, setApplyToAllPages] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    // Auto-detect signature fields
    const mockText = 'Please sign here. Applicant signature required. Date signed.'
    const fields = detectSignatureFields(mockText, documentPages)
    setDetectedFields(fields)
  }, [documentPages])

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000000'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignature(null)
  }

  const handleAutoPlace = () => {
    if (!signature) {
      alert('Please create a signature first')
      return
    }

    const placements = applyToAllPages
      ? Array.from({ length: documentPages }, (_, i) => i + 1)
      : [documentPages] // Last page by default

    const positions = applySignatureToPages(signature, placements, 'bottom-right')

    alert(`Signature placed on ${positions.length} page(s)`)

    if (onSignatureComplete) {
      onSignatureComplete(positions)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-[#00d4ff]" />
          <h3 className="text-2xl font-bold text-white">Smart Signature</h3>
        </div>
        {detectedFields.length > 0 && (
          <button
            onClick={() => setShowDetection(!showDetection)}
            className="px-4 py-2 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg font-semibold transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {showDetection ? 'Hide' : 'Show'} Detected Fields ({detectedFields.length})
          </button>
        )}
      </div>

      {/* Auto-detected Fields */}
      {showDetection && detectedFields.length > 0 && (
        <div className="glass-card border-2 border-[#00d4ff]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#00d4ff]" />
            <h4 className="text-white font-semibold">Auto-Detected Signature Fields</h4>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {detectedFields.map((field) => (
              <div key={field.id} className="glass-strong p-3 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold flex items-center gap-2">
                      {field.type === 'signature' && '✍️'}
                      {field.type === 'initial' && '📝'}
                      {field.type === 'date' && '📅'}
                      {field.label || field.type}
                    </p>
                    <p className="text-xs text-gray-400">
                      Page {field.pageNumber} • {field.confidence}% confidence
                    </p>
                  </div>
                  {field.required && (
                    <span className="px-2 py-1 bg-[#ff0055] text-white text-xs rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <button className="w-full px-3 py-2 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg text-sm font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition">
                  Apply Signature Here
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Creation */}
      <div className="glass-card">
        <h4 className="text-white font-semibold mb-4">Create Signature</h4>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('draw')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              mode === 'draw'
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
            }`}
          >
            <Pen className="w-5 h-5" />
            Draw
          </button>
          <button
            onClick={() => setMode('type')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              mode === 'type'
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
            }`}
          >
            <Type className="w-5 h-5" />
            Type
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              mode === 'upload'
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload
          </button>
        </div>

        {/* Drawing Canvas */}
        {mode === 'draw' && (
          <div>
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full border-2 border-gray-600 rounded-lg bg-white cursor-crosshair"
            />
            <button
              onClick={clearSignature}
              className="mt-3 px-4 py-2 glass-strong hover:bg-[rgba(255,0,85,0.1)] text-white rounded-lg font-semibold transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
          </div>
        )}

        {/* Type Signature */}
        {mode === 'type' && (
          <div>
            <input
              type="text"
              placeholder="Type your name"
              className="w-full px-4 py-3 glass-strong rounded-lg text-white placeholder-gray-400 text-2xl font-signature focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
              style={{ fontFamily: 'Brush Script MT, cursive' }}
              onChange={(e) => setSignature(e.target.value)}
            />
          </div>
        )}

        {/* Upload Image */}
        {mode === 'upload' && (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-2">Upload Signature Image</p>
            <p className="text-sm text-gray-400 mb-4">PNG, JPG up to 5MB</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="signature-upload"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (e) => {
                    setSignature(e.target?.result as string)
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            <label
              htmlFor="signature-upload"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition cursor-pointer"
            >
              Choose File
            </label>
          </div>
        )}
      </div>

      {/* Placement Options */}
      {signature && (
        <div className="glass-card">
          <h4 className="text-white font-semibold mb-4">Placement Options</h4>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={autoPlacement}
                onChange={(e) => setAutoPlacement(e.target.checked)}
                className="w-5 h-5"
              />
              <div>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00d4ff]" />
                  Auto-Detect Best Position
                </p>
                <p className="text-xs text-gray-400">
                  AI will find the optimal signature placement
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={applyToAllPages}
                onChange={(e) => setApplyToAllPages(e.target.checked)}
                className="w-5 h-5"
              />
              <div>
                <p className="text-white font-semibold">Apply to All Pages</p>
                <p className="text-xs text-gray-400">
                  Place signature on all {documentPages} pages
                </p>
              </div>
            </label>

            <button
              onClick={handleAutoPlace}
              className="w-full px-6 py-4 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg text-lg font-bold hover:from-[#00e5ff] hover:to-[#b966ff] transition shadow-lg flex items-center justify-center gap-2"
            >
              <Wand2 className="w-6 h-6" />
              Apply Signature Automatically
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
