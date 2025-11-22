'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Download, FileText, AlertCircle, CheckCircle, Gauge } from 'lucide-react'
import Link from 'next/link'
import { validateFileSize } from '@/lib/utils/file-validation'
import { SubscriptionTier } from '@prisma/client'

type Quality = 'low' | 'medium' | 'high'

interface CompressionResult {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  downloadUrl: string
}

export default function PDFCompressTool() {
  const router = useRouter()
  const { user } = useAuth()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [quality, setQuality] = useState<Quality>('medium')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE')
  const [result, setResult] = useState<CompressionResult | null>(null)

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
            router.replace('/dashboard/tools/pdf-compress', { scroll: false })
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
    setResult(null)

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

  const handleCompress = async () => {
    if (!uploadedFile) {
      setError('Please upload a PDF file first')
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

      // First, upload the file
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

      // Then compress it
      const compressResponse = await fetch('/api/tools/pdf-compress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          quality,
        }),
      })

      const data = await compressResponse.json()

      if (!compressResponse.ok) {
        throw new Error(data.error || 'Compression failed')
      }

      // Poll for job completion
      const jobId = data.jobId
      let attempts = 0
      const maxAttempts = 30

      const pollInterval = setInterval(async () => {
        attempts++

        if (attempts > maxAttempts) {
          clearInterval(pollInterval)
          throw new Error('Compression timed out')
        }

        const statusResponse = await fetch(`/api/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        })

        const statusData = await statusResponse.json()

        if (statusData.status === 'completed') {
          clearInterval(pollInterval)

          const originalSize = uploadedFile.size
          const compressedSize = statusData.output_file_size || originalSize * 0.6
          const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100

          setResult({
            originalSize,
            compressedSize,
            compressionRatio,
            downloadUrl: statusData.download_url || `/api/files/${statusData.output_file_id}`,
          })

          setSuccess(`PDF compressed successfully! Reduced by ${compressionRatio.toFixed(1)}%`)
          setProcessing(false)
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval)
          throw new Error(statusData.error_message || 'Compression failed')
        }
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to compress PDF')
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (result?.downloadUrl) {
      window.open(result.downloadUrl, '_blank')
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setResult(null)
    setError(null)
    setSuccess(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const qualityOptions: { value: Quality; label: string; description: string; reduction: string }[] = [
    { value: 'high', label: 'High Quality', description: 'Minimal compression, best quality', reduction: '~30-40%' },
    { value: 'medium', label: 'Medium Quality', description: 'Balanced compression', reduction: '~50-60%' },
    { value: 'low', label: 'Low Quality', description: 'Maximum compression, smaller file', reduction: '~70-80%' },
  ]

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-5xl mx-auto">
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
            <span className="text-5xl">🗜️</span>
            <div>
              <h1 className="text-3xl font-bold text-white">Compress PDF</h1>
              <p className="text-gray-300">Reduce PDF file size up to 90%</p>
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Upload & Settings */}
          <div className="space-y-4">
            {/* Upload */}
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

            {/* Quality Settings */}
            {uploadedFile && !result && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-4">Compression Quality</h2>

                <div className="space-y-3">
                  {qualityOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                        quality === option.value
                          ? 'bg-[rgba(0,212,255,0.1)] border-2 border-[#00d4ff]'
                          : 'glass hover:border-[#00d4ff]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="quality"
                        value={option.value}
                        checked={quality === option.value}
                        onChange={(e) => setQuality(e.target.value as Quality)}
                        className="w-4 h-4 mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium flex items-center gap-2">
                          {option.label}
                          <span className="text-xs px-2 py-0.5 bg-[rgba(0,212,255,0.2)] text-[#00d4ff] rounded-full">
                            {option.reduction}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Compress Button */}
            {uploadedFile && !result && (
              <button
                onClick={handleCompress}
                disabled={processing}
                className="w-full btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  <>
                    <Gauge className="w-5 h-5" />
                    Compress PDF
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-4">
            {!result && !processing && !uploadedFile && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-4">Features</h2>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="text-[#00d4ff]">•</div>
                    <div>
                      <div className="font-medium text-white">Smart Compression</div>
                      <div className="text-sm">Reduces file size while maintaining quality</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-[#00d4ff]">•</div>
                    <div>
                      <div className="font-medium text-white">Three Quality Levels</div>
                      <div className="text-sm">Choose between high, medium, or low quality</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-[#00d4ff]">•</div>
                    <div>
                      <div className="font-medium text-white">Fast Processing</div>
                      <div className="text-sm">Compress large PDFs in seconds</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-[#00d4ff]">•</div>
                    <div>
                      <div className="font-medium text-white">Up to 90% Reduction</div>
                      <div className="text-sm">Significantly reduce file size for easy sharing</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-4">Compression Results</h2>

                <div className="space-y-4">
                  {/* Size Comparison */}
                  <div className="glass rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Original Size</div>
                        <div className="text-lg font-bold text-white">{formatFileSize(result.originalSize)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Compressed Size</div>
                        <div className="text-lg font-bold text-[#00ff88]">{formatFileSize(result.compressedSize)}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00d4ff] to-[#00ff88] transition-all"
                        style={{ width: `${result.compressionRatio}%` }}
                      />
                    </div>

                    <div className="mt-2 text-center">
                      <div className="text-2xl font-bold text-[#00ff88]">
                        {result.compressionRatio.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Size Reduction</div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="w-full btn-neon py-3 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Compressed PDF
                  </button>

                  {/* Start Over */}
                  <button
                    onClick={clearFile}
                    className="w-full glass-card hover:border-[#00d4ff] py-3 text-center transition"
                  >
                    Compress Another File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
