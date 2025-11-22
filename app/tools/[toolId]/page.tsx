'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getToolById, getAllToolsFlat } from '@/lib/tools-data'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, Upload, X, FileText, Image, FileSpreadsheet, File, Zap, Download, Loader2, Check } from 'lucide-react'

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export default function ToolPage() {
  const params = useParams()
  const router = useRouter()
  const toolId = params.toolId as string
  const tool = getToolById(toolId)
  const allTools = getAllToolsFlat()

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<ProcessingStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingTransfer, setLoadingTransfer] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check for transferred files from landing page
  useEffect(() => {
    const checkForTransferredFiles = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const transferId = urlParams.get('transfer')

      if (transferId) {
        setLoadingTransfer(true)
        try {
          const { fileTransferManager } = await import('@/lib/utils/file-transfer')
          const data = await fileTransferManager.retrieveFiles(transferId)

          if (data && data.files && data.files.length > 0) {
            setUploadedFiles(data.files)
            // Clean up the transfer
            await fileTransferManager.deleteFiles(transferId)
            // Remove transfer param from URL
            router.replace(`/tools/${toolId}`, { scroll: false })
          }
        } catch (err) {
          console.error('Failed to retrieve transferred files:', err)
        } finally {
          setLoadingTransfer(false)
        }
      }
    }

    checkForTransferredFiles()
  }, [toolId, router])

  // Get related tools
  const relatedTools = tool
    ? allTools.filter(t => t.category === tool.category && t.id !== tool.id).slice(0, 6)
    : []

  // File type validation based on tool
  const getAcceptedTypes = () => {
    if (!tool) return '*'
    if (toolId.startsWith('pdf')) return '.pdf'
    if (toolId.startsWith('word')) return '.doc,.docx'
    if (toolId.startsWith('excel') || toolId.startsWith('csv')) return '.xls,.xlsx,.csv'
    if (toolId.startsWith('image')) return '.png,.jpg,.jpeg,.gif,.webp,.svg,.avif,.tiff'
    return '*'
  }

  // File drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files].slice(0, 10))
      setStatus('idle')
      setError(null)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files].slice(0, 10))
      setStatus('idle')
      setError(null)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (uploadedFiles.length <= 1) {
      setStatus('idle')
      setResultUrl(null)
    }
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-400" />
    if (type.includes('word') || type.includes('document')) return <FileText className="w-6 h-6 text-blue-400" />
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="w-6 h-6 text-green-400" />
    if (type.includes('image')) return <Image className="w-6 h-6 text-purple-400" />
    return <File className="w-6 h-6 text-gray-400" />
  }

  // Process files via API
  const processFiles = async () => {
    if (uploadedFiles.length === 0) return

    setStatus('uploading')
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      uploadedFiles.forEach((file, index) => {
        formData.append(`file${index}`, file)
      })
      formData.append('toolId', toolId)

      // Upload progress simulation
      const uploadInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 30))
      }, 100)

      const response = await fetch(`/api/tools/${toolId}`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(uploadInterval)
      setProgress(30)
      setStatus('processing')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Processing failed')
      }

      // Processing progress simulation
      const processInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 95))
      }, 200)

      const result = await response.json()
      clearInterval(processInterval)
      setProgress(100)

      if (result.downloadUrl) {
        setResultUrl(result.downloadUrl)
      }
      setStatus('complete')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Processing failed')
    }
  }

  if (!tool) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Tool Not Found</h1>
          <p className="text-gray-400 mb-6">The tool you're looking for doesn't exist.</p>
          <Link href="/tools" className="btn-neon">Browse All Tools</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-animated">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-[rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Doc<span className="text-neon-cyan">Ops</span>Cloud
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">Home</Link>
              <Link href="/tools" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">All Tools</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">Dashboard</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="hidden sm:block px-5 py-2.5 text-gray-200 hover:text-[#00d4ff] transition font-semibold">Sign In</Link>
              <Link href="/auth/signup" className="btn-neon">Start Free</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back Link */}
        <Link href="/tools" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] transition mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to All Tools
        </Link>

        {/* Tool Header */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">{tool.icon}</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
            {tool.name}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {tool.description}
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-[#00ff88]" />
              Free to use
            </span>
            <span>•</span>
            <span>No sign-up required</span>
            <span>•</span>
            <span>Files deleted in 1 hour</span>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="glass-card mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => status === 'idle' && fileInputRef.current?.click()}
            className={`relative cursor-pointer group transition-all duration-300 rounded-xl border-2 border-dashed ${
              isDragging
                ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.1)]'
                : 'border-[rgba(255,255,255,0.2)] hover:border-[#00d4ff]'
            } ${status !== 'idle' ? 'pointer-events-none' : ''}`}
          >
            <div className="p-12 text-center">
              {loadingTransfer && (
                <>
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#00d4ff] animate-spin" />
                  <h3 className="text-xl font-bold text-white mb-2">Loading your files...</h3>
                  <p className="text-gray-400">Please wait while we prepare your files</p>
                </>
              )}
              {status === 'idle' && !loadingTransfer && (
                <>
                  <Upload className={`w-16 h-16 mx-auto mb-4 text-[#00d4ff] transition-transform ${isDragging ? 'scale-110 animate-bounce' : 'group-hover:scale-105'}`} />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isDragging ? 'Drop your files here!' : 'Drag & Drop Files Here'}
                  </h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <p className="text-sm text-gray-500">
                    Accepted: {getAcceptedTypes()} • Max 10MB per file
                  </p>
                </>
              )}

              {(status === 'uploading' || status === 'processing') && (
                <div className="py-8">
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#00d4ff] animate-spin" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    {status === 'uploading' ? 'Uploading...' : 'Processing...'}
                  </h3>
                  <div className="max-w-md mx-auto">
                    <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00d4ff] to-[#a855f7] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-gray-400 mt-2">{progress}%</p>
                  </div>
                </div>
              )}

              {status === 'complete' && (
                <div className="py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[#00ff88]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Processing Complete!</h3>
                  <p className="text-gray-400 mb-4">Your file is ready to download</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle download
                    }}
                    className="btn-neon inline-flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Result
                  </button>
                </div>
              )}

              {status === 'error' && (
                <div className="py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Processing Failed</h3>
                  <p className="text-red-400 mb-4">{error || 'An error occurred'}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setStatus('idle')
                      setError(null)
                    }}
                    className="btn-neon"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={getAcceptedTypes()}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && status === 'idle' && (
            <div className="mt-6 border-t border-[rgba(255,255,255,0.1)] pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold">Selected Files ({uploadedFiles.length})</h4>
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-sm text-gray-400 hover:text-white transition"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-2 mb-6">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between glass rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-white text-sm font-medium truncate max-w-[300px]">{file.name}</p>
                        <p className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-400 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Process Button */}
              <button
                onClick={processFiles}
                className="w-full btn-neon py-4 text-lg font-semibold"
              >
                {tool.name} →
              </button>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="glass-card mb-8">
          <h3 className="text-xl font-bold text-white mb-6">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Upload Files', desc: 'Drag & drop or click to select your files' },
              { step: '2', title: 'Process', desc: 'We\'ll process your files securely in the cloud' },
              { step: '3', title: 'Download', desc: 'Download your processed files instantly' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-white font-bold text-lg">
                  {item.step}
                </div>
                <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Related Tools */}
        {relatedTools.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Related Tools</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedTools.map((relTool) => (
                <Link
                  key={relTool.id}
                  href={`/tools/${relTool.id}`}
                  className="glass-card hover:border-[#00d4ff] p-4 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{relTool.icon}</span>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{relTool.name}</p>
                      <p className="text-gray-400 text-xs truncate">{relTool.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="glass-strong border-t border-[rgba(255,255,255,0.1)] py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          <p>© 2025 DocOpsCloud. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
