'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Layers,
  FileText,
  Zap
} from 'lucide-react'
import { validateFileSize, formatFileSize } from '@/lib/utils/file-validation'
import { SubscriptionTier } from '@prisma/client'
import Link from 'next/link'

interface FileWithStatus {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  fileId?: string
  outputFileId?: string
}

const BULK_TOOLS = [
  { id: 'pdf-compress', name: 'Compress All', description: 'Reduce size of all PDFs', icon: '📦' },
  { id: 'pdf-to-word', name: 'Convert All to Word', description: 'Convert PDFs to DOCX', icon: '📝' },
  { id: 'pdf-to-image', name: 'Convert All to Images', description: 'Convert PDFs to JPG/PNG', icon: '🖼️' },
  { id: 'pdf-rotate', name: 'Rotate All', description: 'Rotate all pages', icon: '🔄' },
  { id: 'pdf-protect', name: 'Protect All', description: 'Add password to all PDFs', icon: '🔒' },
  { id: 'image-compress', name: 'Compress All Images', description: 'Optimize all images', icon: '🎨' },
]

export default function BulkProcessingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE')
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)

  // Fetch user tier
  useState(() => {
    const fetchUserTier = async () => {
      if (!user) return
      try {
        const idToken = await user.getIdToken()
        const res = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        })
        if (res.ok) {
          const { user: profile } = await res.json()
          setUserTier(profile.subscription_tier)
        }
      } catch (err) {
        console.error('Failed to fetch user tier:', err)
      }
    }
    fetchUserTier()
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [userTier])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    addFiles(selectedFiles)
  }

  const addFiles = (newFiles: File[]) => {
    // Validate files
    const validFiles: FileWithStatus[] = []
    for (const file of newFiles) {
      const validation = validateFileSize(file, userTier)
      if (validation.valid) {
        validFiles.push({
          file,
          id: Math.random().toString(36).substring(7),
          status: 'pending',
          progress: 0
        })
      }
    }
    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleBulkProcess = async () => {
    if (!selectedTool || files.length === 0) return

    setProcessing(true)
    setCompletedCount(0)

    try {
      const idToken = await user?.getIdToken()
      if (!idToken) throw new Error('Not authenticated')

      // Process each file sequentially
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i]

        // Update status to uploading
        setFiles(prev => prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ))

        try {
          // Upload file
          const uploadResult = await uploadFile(fileObj.file, idToken)

          // Update to uploaded
          setFiles(prev => prev.map(f =>
            f.id === fileObj.id ? { ...f, status: 'uploaded' as const, fileId: uploadResult.fileId } : f
          ))

          // Create processing job
          setFiles(prev => prev.map(f =>
            f.id === fileObj.id ? { ...f, status: 'processing' as const } : f
          ))

          const jobRes = await fetch('/api/jobs/create', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileId: uploadResult.fileId,
              operation: selectedTool,
              options: {}
            })
          })

          if (!jobRes.ok) throw new Error('Failed to create job')

          const { jobId } = await jobRes.json()

          // Poll for completion
          await pollJobCompletion(jobId, idToken, fileObj.id)

          setCompletedCount(prev => prev + 1)
        } catch (err: any) {
          setFiles(prev => prev.map(f =>
            f.id === fileObj.id ? { ...f, status: 'failed' as const, error: err.message } : f
          ))
        }
      }
    } catch (err) {
      console.error('Bulk processing failed:', err)
    } finally {
      setProcessing(false)
    }
  }

  const uploadFile = async (file: File, idToken: string): Promise<{ fileId: string }> => {
    // Get presigned URL
    const presignedRes = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size
      })
    })

    if (!presignedRes.ok) throw new Error('Failed to get upload URL')

    const { uploadUrl, fileId } = await presignedRes.json()

    // Upload to S3
    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    })

    // Mark complete
    await fetch('/api/upload/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fileId })
    })

    return { fileId }
  }

  const pollJobCompletion = async (jobId: string, idToken: string, fileObjId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${jobId}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          })

          if (!res.ok) {
            clearInterval(interval)
            reject(new Error('Failed to fetch job status'))
            return
          }

          const job = await res.json()

          if (job.status === 'completed') {
            clearInterval(interval)
            setFiles(prev => prev.map(f =>
              f.id === fileObjId
                ? { ...f, status: 'completed' as const, outputFileId: job.outputFile?.id }
                : f
            ))
            resolve()
          } else if (job.status === 'failed') {
            clearInterval(interval)
            setFiles(prev => prev.map(f =>
              f.id === fileObjId ? { ...f, status: 'failed' as const, error: job.error } : f
            ))
            reject(new Error(job.error || 'Processing failed'))
          }
        } catch (err) {
          clearInterval(interval)
          reject(err)
        }
      }, 2000)
    })
  }

  const downloadAll = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.outputFileId)
    completedFiles.forEach(f => {
      window.open(`/api/files/download/${f.outputFileId}`, '_blank')
    })
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const completedFiles = files.filter(f => f.status === 'completed')

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-10 h-10 text-[#00d4ff]" />
            <h1 className="text-4xl font-bold text-white">Bulk Processing</h1>
          </div>
          <p className="text-gray-300">Upload multiple files and apply one tool to all of them</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Zone */}
            <div className="glass-card">
              <h2 className="text-xl font-bold text-white mb-4">Upload Files</h2>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
                  dragActive
                    ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.1)]'
                    : 'border-[rgba(255,255,255,0.2)] hover:border-[#00d4ff]'
                }`}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="bulk-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label htmlFor="bulk-upload" className="cursor-pointer">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white font-semibold mb-2 text-lg">
                    Drop multiple files here or click to browse
                  </p>
                  <p className="text-sm text-gray-400">
                    Upload as many files as you need - process them all at once
                  </p>
                </label>
              </div>
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="glass-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Files ({files.length})
                  </h2>
                  {completedFiles.length > 0 && (
                    <button
                      onClick={downloadAll}
                      className="px-4 py-2 btn-neon text-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Download All ({completedFiles.length})
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {files.map(fileObj => (
                    <div
                      key={fileObj.id}
                      className="p-3 glass-strong rounded-lg flex items-center gap-3"
                    >
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{fileObj.file.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatFileSize(fileObj.file.size)}
                          </span>
                          {fileObj.status === 'completed' && (
                            <span className="text-xs text-[#00ff88]">✓ Completed</span>
                          )}
                          {fileObj.status === 'processing' && (
                            <span className="text-xs text-[#00d4ff]">⏳ Processing...</span>
                          )}
                          {fileObj.status === 'failed' && (
                            <span className="text-xs text-[#ff0055]">✗ Failed</span>
                          )}
                        </div>
                      </div>
                      {fileObj.status === 'pending' && (
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tool Selection */}
          <div className="space-y-6">
            <div className="glass-card">
              <h2 className="text-xl font-bold text-white mb-4">Select Tool</h2>
              <p className="text-sm text-gray-400 mb-4">
                Choose one tool to apply to all files
              </p>

              <div className="space-y-2">
                {BULK_TOOLS.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`w-full p-3 rounded-lg text-left transition ${
                      selectedTool === tool.id
                        ? 'bg-gradient-to-r from-[rgba(0,212,255,0.2)] to-[rgba(168,85,247,0.2)] border-2 border-[#00d4ff]'
                        : 'glass-strong hover:bg-[rgba(0,212,255,0.1)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{tool.icon}</span>
                      <span className={`text-sm font-semibold ${
                        selectedTool === tool.id ? 'text-[#00d4ff]' : 'text-white'
                      }`}>
                        {tool.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{tool.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={handleBulkProcess}
              disabled={processing || !selectedTool || pendingCount === 0}
              className="w-full btn-neon py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing {completedCount}/{files.length}...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Process {pendingCount} File{pendingCount !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
