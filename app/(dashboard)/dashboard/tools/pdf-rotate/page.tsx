'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Download, FileText, AlertCircle, CheckCircle, RotateCw } from 'lucide-react'
import Link from 'next/link'
import { validateFileSize } from '@/lib/utils/file-validation'
import { SubscriptionTier } from '@prisma/client'

type Rotation = '90' | '180' | '270'

export default function PDFRotateTool() {
  const router = useRouter()
  const { user } = useAuth()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [rotation, setRotation] = useState<Rotation>('90')
  const [pages, setPages] = useState('all')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
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

  const handleRotate = async () => {
    if (!uploadedFile) {
      setError('Please upload a PDF file first')
      return
    }
    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const idToken = await user?.getIdToken()
      if (!idToken) throw new Error('Not authenticated')

      const formData = new FormData()
      formData.append('file', uploadedFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData,
      })

      if (!uploadResponse.ok) throw new Error('Failed to upload file')
      const { fileId } = await uploadResponse.json()

      const rotateResponse = await fetch('/api/tools/pdf-rotate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId, rotation, pages }),
      })

      const data = await rotateResponse.json()
      if (!rotateResponse.ok) throw new Error(data.error || 'Rotation failed')

      const jobId = data.jobId
      let attempts = 0
      const maxAttempts = 30

      const pollInterval = setInterval(async () => {
        attempts++
        if (attempts > maxAttempts) {
          clearInterval(pollInterval)
          throw new Error('Rotation processing timed out')
        }

        const statusResponse = await fetch(`/api/jobs/${jobId}`, {
          headers: { 'Authorization': `Bearer ${idToken}` },
        })

        const statusData = await statusResponse.json()

        if (statusData.status === 'completed') {
          clearInterval(pollInterval)
          setDownloadUrl(statusData.download_url || `/api/files/${statusData.output_file_id}`)
          setSuccess(`PDF rotated ${rotation}° successfully!`)
          setProcessing(false)
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval)
          throw new Error(statusData.error_message || 'Rotation failed')
        }
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to rotate PDF')
      setProcessing(false)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setDownloadUrl(null)
    setError(null)
    setSuccess(null)
  }

  const rotations: { value: Rotation; label: string; icon: string }[] = [
    { value: '90', label: '90° Clockwise', icon: '↻' },
    { value: '180', label: '180° Upside Down', icon: '↺' },
    { value: '270', label: '270° Counter-Clockwise', icon: '↶' },
  ]

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🔄</span>
            <div>
              <h1 className="text-3xl font-bold text-white">Rotate PDF</h1>
              <p className="text-gray-300">Rotate PDF pages by 90, 180, or 270 degrees</p>
            </div>
          </div>
        </div>

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

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
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

            {uploadedFile && !downloadUrl && (
              <>
                <div className="glass-card">
                  <h2 className="text-xl font-bold text-white mb-4">Rotation Angle</h2>
                  <div className="space-y-3">
                    {rotations.map((rot) => (
                      <button
                        key={rot.value}
                        onClick={() => setRotation(rot.value)}
                        className={`w-full p-4 rounded-lg transition flex items-center gap-3 ${
                          rotation === rot.value
                            ? 'bg-[rgba(0,212,255,0.2)] border-2 border-[#00d4ff]'
                            : 'glass hover:border-[#00d4ff]'
                        }`}
                        disabled={processing}
                      >
                        <span className="text-3xl">{rot.icon}</span>
                        <span className="text-white font-medium">{rot.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-card">
                  <h2 className="text-xl font-bold text-white mb-4">Pages to Rotate</h2>
                  <input
                    type="text"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    placeholder="all or 1,3,5 or 1-5"
                    className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
                    disabled={processing}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Enter "all" for all pages, or specify pages like "1,3,5" or "1-5"
                  </p>
                </div>

                <button
                  onClick={handleRotate}
                  disabled={processing}
                  className="w-full btn-neon py-3 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Rotating...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-5 h-5" />
                      Rotate PDF
                    </>
                  )}
                </button>
              </>
            )}

            {downloadUrl && (
              <div className="space-y-2">
                <button
                  onClick={() => window.open(downloadUrl, '_blank')}
                  className="w-full btn-neon py-3 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Rotated PDF
                </button>
                <button
                  onClick={clearFile}
                  className="w-full glass-card hover:border-[#00d4ff] py-3 text-center transition"
                >
                  Rotate Another File
                </button>
              </div>
            )}
          </div>

          <div className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">Features</h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-start gap-3">
                <div className="text-[#00d4ff]">•</div>
                <div>
                  <div className="font-medium text-white">Three Rotation Options</div>
                  <div className="text-sm">Rotate 90°, 180°, or 270 degrees</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-[#00d4ff]">•</div>
                <div>
                  <div className="font-medium text-white">Selective Page Rotation</div>
                  <div className="text-sm">Rotate all pages or specific pages only</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-[#00d4ff]">•</div>
                <div>
                  <div className="font-medium text-white">Fast Processing</div>
                  <div className="text-sm">Quick rotation without quality loss</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-[#00d4ff]">•</div>
                <div>
                  <div className="font-medium text-white">Batch Support</div>
                  <div className="text-sm">Rotate multiple pages at once</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
