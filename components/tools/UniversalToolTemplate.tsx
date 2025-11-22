'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { validateFileSize } from '@/lib/utils/file-validation'
import { SubscriptionTier } from '@prisma/client'

interface ToolConfig {
  id: string
  name: string
  description: string
  icon: string
  apiEndpoint: string
  acceptedFileTypes: string
  acceptedMimeTypes: string
}

interface UniversalToolTemplateProps {
  config: ToolConfig
  renderSettings?: (props: {
    settings: any
    setSettings: (settings: any) => void
    processing: boolean
  }) => ReactNode
  defaultSettings?: any
  prepareRequestBody: (fileId: string | string[], settings: any) => any
  features?: Array<{ title: string; description: string }>
  multiFileMode?: boolean
  minFiles?: number
}

export default function UniversalToolTemplate({
  config,
  renderSettings,
  defaultSettings = {},
  prepareRequestBody,
  features = [],
  multiFileMode = false,
  minFiles = 2,
}: UniversalToolTemplateProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [settings, setSettings] = useState(defaultSettings)
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
    if (multiFileMode) {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) handleFiles(files)
    } else {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    }
  }

  const handleFile = (file: File) => {
    setError(null)
    setDownloadUrl(null)

    const validation = validateFileSize(file, userTier)
    if (!validation.valid) {
      setError(validation.error || 'File too large')
      return
    }

    setUploadedFile(file)
  }

  const handleFiles = (files: File[]) => {
    setError(null)
    setDownloadUrl(null)

    // Validate each file
    for (const file of files) {
      const validation = validateFileSize(file, userTier)
      if (!validation.valid) {
        setError(validation.error || 'File too large')
        return
      }
    }

    if (files.length < minFiles) {
      setError(`Please select at least ${minFiles} files`)
      return
    }

    setUploadedFiles(files)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleProcess = async () => {
    if (multiFileMode) {
      if (uploadedFiles.length < minFiles) {
        setError(`Please upload at least ${minFiles} files`)
        return
      }
    } else {
      if (!uploadedFile) {
        setError('Please upload a file first')
        return
      }
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const idToken = await user?.getIdToken()
      if (!idToken) throw new Error('Not authenticated')

      let requestBody: any

      if (multiFileMode) {
        // Upload all files and collect fileIds
        const fileIds: string[] = []
        for (const file of uploadedFiles) {
          const formData = new FormData()
          formData.append('file', file)

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
            body: formData,
          })

          if (!uploadResponse.ok) throw new Error(`Failed to upload ${file.name}`)
          const { fileId } = await uploadResponse.json()
          fileIds.push(fileId)
        }

        requestBody = prepareRequestBody(fileIds, settings)
      } else {
        // Single file upload
        const formData = new FormData()
        formData.append('file', uploadedFile!)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${idToken}` },
          body: formData,
        })

        if (!uploadResponse.ok) throw new Error('Failed to upload file')
        const { fileId } = await uploadResponse.json()

        requestBody = prepareRequestBody(fileId, settings)
      }

      const processResponse = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await processResponse.json()
      if (!processResponse.ok) throw new Error(data.error || 'Processing failed')

      const jobId = data.jobId
      let attempts = 0
      const maxAttempts = 30

      const pollInterval = setInterval(async () => {
        attempts++
        if (attempts > maxAttempts) {
          clearInterval(pollInterval)
          throw new Error('Processing timed out')
        }

        const statusResponse = await fetch(`/api/jobs/${jobId}`, {
          headers: { 'Authorization': `Bearer ${idToken}` },
        })

        const statusData = await statusResponse.json()

        if (statusData.status === 'completed') {
          clearInterval(pollInterval)
          setDownloadUrl(statusData.download_url || `/api/files/${statusData.output_file_id}`)
          setSuccess('Processing completed successfully!')
          setProcessing(false)
        } else if (statusData.status === 'failed') {
          clearInterval(pollInterval)
          throw new Error(statusData.error_message || 'Processing failed')
        }
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Processing failed')
      setProcessing(false)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setUploadedFiles([])
    setDownloadUrl(null)
    setError(null)
    setSuccess(null)
    setSettings(defaultSettings)
  }

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{config.icon}</span>
            <div>
              <h1 className="text-3xl font-bold text-white">{config.name}</h1>
              <p className="text-gray-300">{config.description}</p>
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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-card">
              <h2 className="text-xl font-bold text-white mb-4">
                {multiFileMode ? `Upload Files (min ${minFiles})` : 'Upload File'}
              </h2>
              {(multiFileMode ? uploadedFiles.length === 0 : !uploadedFile) ? (
                <label className="block">
                  <input
                    type="file"
                    accept={config.acceptedFileTypes}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={processing}
                    multiple={multiFileMode}
                  />
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-xl p-8 text-center hover:border-[#00d4ff] transition cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-white font-semibold mb-1">
                      {multiFileMode ? 'Upload Files' : 'Upload File'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {multiFileMode ? `Select ${minFiles} or more files` : 'Single file only'}
                    </p>
                  </div>
                </label>
              ) : multiFileMode ? (
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium truncate">{file.name}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition"
                        disabled={processing}
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                  <label className="block">
                    <input
                      type="file"
                      accept={config.acceptedFileTypes}
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || [])
                        if (newFiles.length > 0) {
                          setUploadedFiles(prev => [...prev, ...newFiles])
                        }
                      }}
                      className="hidden"
                      disabled={processing}
                      multiple
                    />
                    <div className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-lg p-4 text-center hover:border-[#00d4ff] transition cursor-pointer">
                      <p className="text-sm text-gray-400">+ Add more files</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
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

            {((multiFileMode && uploadedFiles.length >= minFiles) || (!multiFileMode && uploadedFile)) && !downloadUrl && (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="w-full btn-neon py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : multiFileMode ? (
                  `Process ${uploadedFiles.length} Files`
                ) : (
                  `Process File`
                )}
              </button>
            )}

            {downloadUrl && (
              <div className="space-y-2">
                <button
                  onClick={() => window.open(downloadUrl, '_blank')}
                  className="w-full btn-neon py-3 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Result
                </button>
                <button
                  onClick={clearFile}
                  className="w-full glass-card hover:border-[#00d4ff] py-3 text-center transition"
                >
                  Process Another File
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {((multiFileMode && uploadedFiles.length > 0) || (!multiFileMode && uploadedFile)) && !downloadUrl && renderSettings && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
                {renderSettings({ settings, setSettings, processing })}
              </div>
            )}

            {(multiFileMode ? uploadedFiles.length === 0 : !uploadedFile) && features.length > 0 && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-4">Features</h2>
                <div className="space-y-3 text-gray-300">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="text-[#00d4ff]">•</div>
                      <div>
                        <div className="font-medium text-white">{feature.title}</div>
                        <div className="text-sm">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
