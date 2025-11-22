'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'
import { validateFileSize, formatFileSize } from '@/lib/utils/file-validation'
import { analyzeFiles, FileAnalysis } from '@/lib/utils/file-analysis'
import SmartSuggestions from '@/components/workflow/SmartSuggestions'
import { SubscriptionTier } from '@prisma/client'
import Link from 'next/link'

interface UploadedFileWithPreview {
  file: File
  id: string
  preview?: string
  uploaded: boolean
  uploading: boolean
  progress: number
  error?: string
  fileId?: string
}

export default function WorkflowUploadPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFileWithPreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE')
  const [error, setError] = useState<string | null>(null)
  const [fileAnalysis, setFileAnalysis] = useState<FileAnalysis | null>(null)

  // Analyze files when they change
  useEffect(() => {
    if (files.length > 0) {
      const justFiles = files.map(f => f.file)
      analyzeFiles(justFiles).then(analysis => {
        setFileAnalysis(analysis)
      })
    } else {
      setFileAnalysis(null)
    }
  }, [files])

  // Fetch user tier on mount
  useState(() => {
    const fetchUserTier = async () => {
      if (!user) return
      try {
        const idToken = await user.getIdToken()
        const res = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${idToken}` },
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
    handleFiles(droppedFiles)
  }, [userTier])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }

  const handleFiles = async (newFiles: File[]) => {
    setError(null)

    // Validate files
    for (const file of newFiles) {
      const validation = validateFileSize(file, userTier)
      if (!validation.valid) {
        setError(validation.error || 'File validation failed')
        return
      }
    }

    // Add files to state
    const filesWithPreview: UploadedFileWithPreview[] = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      uploaded: false,
      uploading: false,
      progress: 0,
    }))

    setFiles(prev => [...prev, ...filesWithPreview])

    // Start uploading each file
    for (const fileObj of filesWithPreview) {
      uploadFile(fileObj)
    }
  }

  const uploadFile = async (fileObj: UploadedFileWithPreview) => {
    // Update state to uploading
    setFiles(prev => prev.map(f =>
      f.id === fileObj.id ? { ...f, uploading: true, progress: 0 } : f
    ))

    try {
      const idToken = await user?.getIdToken()
      if (!idToken) throw new Error('Not authenticated')

      // Step 1: Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: fileObj.file.name,
          contentType: fileObj.file.type,
          size: fileObj.file.size,
        }),
      })

      if (!presignedRes.ok) {
        const error = await presignedRes.json()
        throw new Error(error.error || 'Failed to get upload URL')
      }

      const { uploadUrl, fileId, key } = await presignedRes.json()

      // Step 2: Upload to S3
      const uploadXhr = new XMLHttpRequest()

      uploadXhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100
          setFiles(prev => prev.map(f =>
            f.id === fileObj.id ? { ...f, progress } : f
          ))
        }
      })

      await new Promise((resolve, reject) => {
        uploadXhr.addEventListener('load', resolve)
        uploadXhr.addEventListener('error', reject)
        uploadXhr.addEventListener('abort', reject)

        uploadXhr.open('PUT', uploadUrl)
        uploadXhr.setRequestHeader('Content-Type', fileObj.file.type)
        uploadXhr.send(fileObj.file)
      })

      // Step 3: Mark upload as complete
      const completeRes = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })

      if (!completeRes.ok) {
        throw new Error('Failed to complete upload')
      }

      // Generate preview for PDF
      let preview: string | undefined
      if (fileObj.file.type === 'application/pdf') {
        // Generate thumbnail using canvas
        preview = await generatePDFPreview(fileObj.file)
      }

      // Update state to uploaded
      setFiles(prev => prev.map(f =>
        f.id === fileObj.id
          ? { ...f, uploaded: true, uploading: false, progress: 100, fileId, preview }
          : f
      ))
    } catch (err: any) {
      setFiles(prev => prev.map(f =>
        f.id === fileObj.id
          ? { ...f, uploading: false, error: err.message }
          : f
      ))
    }
  }

  const generatePDFPreview = async (file: File): Promise<string | undefined> => {
    try {
      // Use PDF.js to generate thumbnail
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)

      const viewport = page.getViewport({ scale: 0.5 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise

      return canvas.toDataURL()
    } catch (err) {
      console.error('Failed to generate PDF preview:', err)
      return undefined
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const proceedToToolSelection = () => {
    const uploadedFiles = files.filter(f => f.uploaded && f.fileId)
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file')
      return
    }

    // Navigate to tool selection with file IDs
    const fileIds = uploadedFiles.map(f => f.fileId).join(',')
    router.push(`/dashboard/workflow/select-tool?files=${fileIds}`)
  }

  const allUploaded = files.length > 0 && files.every(f => f.uploaded)
  const anyUploading = files.some(f => f.uploading)

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">PDF Workflow</h1>
          <p className="text-gray-300">Upload your files to get started</p>
        </div>

        {/* Workflow Progress */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <span className="text-white font-semibold">Upload</span>
          </div>
          <div className="flex-1 h-1 bg-[rgba(255,255,255,0.2)] rounded" />
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 glass-strong rounded-full flex items-center justify-center text-sm font-bold text-gray-400">
              2
            </div>
            <span className="text-gray-400 font-semibold">Select Tool</span>
          </div>
          <div className="flex-1 h-1 bg-[rgba(255,255,255,0.2)] rounded" />
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 glass-strong rounded-full flex items-center justify-center text-sm font-bold text-gray-400">
              3
            </div>
            <span className="text-gray-400 font-semibold">Process</span>
          </div>
          <div className="flex-1 h-1 bg-[rgba(255,255,255,0.2)] rounded" />
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 glass-strong rounded-full flex items-center justify-center text-sm font-bold text-gray-400">
              4
            </div>
            <span className="text-gray-400 font-semibold">Download</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Area */}
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
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.csv"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-white font-semibold mb-2 text-lg">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-400 mb-2">
                  Supports PDF, Word, Excel, Images
                </p>
                <p className="text-xs text-gray-500">
                  Max size: {formatFileSize(userTier === 'FREE' ? 10 * 1024 * 1024 : userTier === 'PRO' ? 500 * 1024 * 1024 : 2 * 1024 * 1024 * 1024)}
                </p>
              </label>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-[rgba(255,0,85,0.1)] border border-[#ff0055] rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-[#ff0055] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Files List with Preview */}
          <div className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">
              Uploaded Files ({files.filter(f => f.uploaded).length}/{files.length})
            </h2>

            {files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No files uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="p-4 glass-strong rounded-lg border border-[rgba(255,255,255,0.1)]"
                  >
                    <div className="flex items-start gap-3">
                      {/* Preview Thumbnail */}
                      {fileObj.preview ? (
                        <img
                          src={fileObj.preview}
                          alt={fileObj.file.name}
                          className="w-16 h-20 object-cover rounded border border-[rgba(255,255,255,0.2)]"
                        />
                      ) : (
                        <div className="w-16 h-20 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded flex items-center justify-center">
                          <FileText className="w-8 h-8 text-white" />
                        </div>
                      )}

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {fileObj.file.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatFileSize(fileObj.file.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFile(fileObj.id)}
                            className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>

                        {/* Status */}
                        <div className="mt-2">
                          {fileObj.uploading && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-[#00d4ff]">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Uploading... {Math.round(fileObj.progress)}%
                              </div>
                              <div className="w-full bg-[rgba(0,0,0,0.3)] rounded-full h-1">
                                <div
                                  className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] h-1 rounded-full transition-all"
                                  style={{ width: `${fileObj.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          {fileObj.uploaded && (
                            <div className="flex items-center gap-2 text-xs text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Uploaded successfully
                            </div>
                          )}
                          {fileObj.error && (
                            <div className="flex items-center gap-2 text-xs text-red-400">
                              <AlertCircle className="w-3 h-3" />
                              {fileObj.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Continue Button */}
            {files.length > 0 && (
              <button
                onClick={proceedToToolSelection}
                disabled={!allUploaded || anyUploading}
                className="w-full mt-4 btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {anyUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading files...
                  </>
                ) : allUploaded ? (
                  <>
                    Continue to Tool Selection
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  'Waiting for uploads...'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
