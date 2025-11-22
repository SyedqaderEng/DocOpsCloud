'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Download, FileText, AlertCircle, CheckCircle, Type } from 'lucide-react'
import Link from 'next/link'
import { validateFileSize } from '@/lib/utils/file-validation'
import { SubscriptionTier } from '@prisma/client'

type Position = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export default function PDFWatermarkTool() {
  const router = useRouter()
  const { user } = useAuth()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [position, setPosition] = useState<Position>('center')
  const [opacity, setOpacity] = useState(0.3)
  const [fontSize, setFontSize] = useState(36)
  const [color, setColor] = useState('#000000')
  const [rotation, setRotation] = useState(45)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  // Fetch user profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const idToken = await user.getIdToken()
        const profileRes = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${idToken}` },
        })
        if (profileRes.ok) {
          const { user: profile } = await profileRes.json()
          setUserTier(profile.subscription_tier)
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }

    fetchUserData()
  }, [user])

  // Check for transferred files
  useEffect(() => {
    const checkForTransferredFiles = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const transferId = urlParams.get('transfer')

      if (transferId) {
        try {
          const { fileTransferManager } = await import('@/lib/utils/file-transfer')
          const data = await fileTransferManager.retrieveFiles(transferId)

          if (data && data.files && data.files.length > 0) {
            const pdfFile = data.files.find(f => f.type === 'application/pdf')
            if (pdfFile) {
              handleFile(pdfFile)
            }
            await fileTransferManager.deleteFiles(transferId)
            router.replace('/dashboard/tools/pdf-watermark', { scroll: false })
          }
        } catch (err) {
          console.error('Failed to retrieve transferred files:', err)
        }
      }
    }

    if (userTier) {
      checkForTransferredFiles()
    }
  }, [router, userTier])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    setError(null)
    setDownloadUrl(null)

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    const validation = validateFileSize(file, userTier)
    if (!validation.valid) {
      setError(validation.error || 'File too large')
      return
    }

    setUploadedFile(file)
  }

  const handleAddWatermark = async () => {
    if (!uploadedFile) {
      setError('Please upload a PDF file first')
      return
    }

    if (!watermarkText.trim()) {
      setError('Please enter watermark text')
      return
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const idToken = await user?.getIdToken()
      if (!idToken) {
        throw new Error('Not authenticated')
      }

      // Upload file first
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      const { fileId } = await uploadResponse.json()

      // Add watermark
      const watermarkResponse = await fetch('/api/tools/pdf-watermark', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          text: watermarkText,
          position,
          opacity,
          fontSize,
          color,
          rotation,
        }),
      })

      const data = await watermarkResponse.json()

      if (!watermarkResponse.ok) {
        throw new Error(data.error || 'Watermark failed')
      }

      // Poll for job completion
      const jobId = data.jobId
      let attempts = 0
      const maxAttempts = 30

      const pollInterval = setInterval(async () => {
        attempts++

        if (attempts > maxAttempts) {
          clearInterval(pollInterval)
          throw new Error('Watermark processing timed out')
        }

        const statusResponse = await fetch(`/api/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        })

        const statusData = await statusResponse.json()

        if (statusData.status === 'completed') {
          clearInterval(pollInterval)
          setDownloadUrl(statusData.download_url || `/api/files/${statusData.output_file_id}`)
          setSuccess('Watermark added successfully!')
          setProcessing(false)
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval)
          throw new Error(statusData.error_message || 'Watermark failed')
        }
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to add watermark')
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setDownloadUrl(null)
    setError(null)
    setSuccess(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const positions: { value: Position; label: string }[] = [
    { value: 'center', label: 'Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ]

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🏷️</span>
            <div>
              <h1 className="text-3xl font-bold text-white">Add Watermark</h1>
              <p className="text-gray-300">Add text watermarks to protect your PDFs</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-[rgba(255,0,85,0.1)] border border-[#ff0055] rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-[#ff0055] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-[rgba(0,255,136,0.1)] border border-[#00ff88] rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-[#00ff88] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card">
              <h2 className="text-xl font-bold text-white mb-4">Upload PDF</h2>

              {!uploadedFile ? (
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={processing}
                  />
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-xl p-8 text-center hover:border-[#00d4ff] transition cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-white font-semibold mb-1">Upload PDF File</p>
                    <p className="text-sm text-gray-400">Single file only</p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{uploadedFile.name}</div>
                      <div className="text-xs text-gray-400">{formatFileSize(uploadedFile.size)}</div>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="ml-2 p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition"
                    disabled={processing}
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Add Watermark Button */}
            {uploadedFile && !downloadUrl && (
              <button
                onClick={handleAddWatermark}
                disabled={processing || !watermarkText.trim()}
                className="w-full btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding Watermark...
                  </>
                ) : (
                  <>
                    <Type className="w-5 h-5" />
                    Add Watermark
                  </>
                )}
              </button>
            )}

            {/* Download Button */}
            {downloadUrl && (
              <div className="space-y-2">
                <button
                  onClick={handleDownload}
                  className="w-full btn-neon py-3 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF
                </button>
                <button
                  onClick={clearFile}
                  className="w-full glass-card hover:border-[#00d4ff] py-3 text-center transition"
                >
                  Add to Another File
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Watermark Settings */}
          <div className="lg:col-span-2 space-y-4">
            {uploadedFile && !downloadUrl && (
              <>
                {/* Watermark Text */}
                <div className="glass-card">
                  <h2 className="text-xl font-bold text-white mb-4">Watermark Text</h2>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter watermark text"
                    className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] transition"
                    disabled={processing}
                  />
                </div>

                {/* Position */}
                <div className="glass-card">
                  <h2 className="text-xl font-bold text-white mb-4">Position</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {positions.map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => setPosition(pos.value)}
                        className={`p-3 rounded-lg transition ${
                          position === pos.value
                            ? 'bg-[rgba(0,212,255,0.2)] border-2 border-[#00d4ff] text-white'
                            : 'glass hover:border-[#00d4ff] text-gray-300'
                        }`}
                        disabled={processing}
                      >
                        <div className="text-sm font-medium">{pos.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="glass-card">
                  <h2 className="text-xl font-bold text-white mb-4">Advanced Settings</h2>
                  <div className="space-y-4">
                    {/* Opacity */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm text-gray-300">Opacity</label>
                        <span className="text-sm text-[#00d4ff] font-semibold">{Math.round(opacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full"
                        disabled={processing}
                      />
                    </div>

                    {/* Font Size */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm text-gray-300">Font Size</label>
                        <span className="text-sm text-[#00d4ff] font-semibold">{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        step="2"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className="w-full"
                        disabled={processing}
                      />
                    </div>

                    {/* Rotation */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm text-gray-300">Rotation</label>
                        <span className="text-sm text-[#00d4ff] font-semibold">{rotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="15"
                        value={rotation}
                        onChange={(e) => setRotation(parseInt(e.target.value))}
                        className="w-full"
                        disabled={processing}
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">Color</label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-16 h-10 rounded cursor-pointer"
                          disabled={processing}
                        />
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          placeholder="#000000"
                          className="flex-1 px-3 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded text-white text-sm focus:outline-none focus:border-[#00d4ff]"
                          disabled={processing}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="glass-card">
                  <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
                  <div className="relative aspect-[8.5/11] bg-white rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="font-bold select-none"
                        style={{
                          opacity,
                          fontSize: `${fontSize}px`,
                          color,
                          transform: `rotate(${rotation}deg)`,
                          position: position === 'center' ? 'relative' : 'absolute',
                          ...(position === 'top-left' && { top: '20px', left: '20px' }),
                          ...(position === 'top-right' && { top: '20px', right: '20px' }),
                          ...(position === 'bottom-left' && { bottom: '20px', left: '20px' }),
                          ...(position === 'bottom-right' && { bottom: '20px', right: '20px' }),
                        }}
                      >
                        {watermarkText || 'Your watermark'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!uploadedFile && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-4">Features</h2>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="text-[#00d4ff]">•</div>
                    <div>
                      <div className="font-medium text-white">Custom Text Watermarks</div>
                      <div className="text-sm">Add any text as a watermark</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-[#00d4ff]">•</div>
                    <div>
                      <div className="font-medium text-white">5 Position Options</div>
                      <div className="text-sm">Center, corners, or custom placement</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-[#00d4ff]">•</div>
                    <div>
                      <div className="font-medium text-white">Customizable Appearance</div>
                      <div className="text-sm">Adjust opacity, size, rotation, and color</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-[#00d4ff]">•</div>
                    <div>
                      <div className="font-medium text-white">Live Preview</div>
                      <div className="text-sm">See how your watermark will look</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
