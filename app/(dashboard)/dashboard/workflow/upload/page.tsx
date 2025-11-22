'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import { ALL_TOOLS } from '@/lib/tools-data'
import { validateFileSize } from '@/lib/utils/file-validation'

interface Tool {
  id: string
  name: string
  description: string
  icon: string
}

export default function UploadFirstWorkflow() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<string>('')
  const [suggestedTools, setSuggestedTools] = useState<Tool[]>([])
  const [transferring, setTransferring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  const detectFileTypeAndSuggestTools = (file: File) => {
    const mimeType = file.type
    const extension = file.name.split('.').pop()?.toLowerCase()

    let category = ''
    let tools: Tool[] = []

    // Detect file category
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      category = 'pdf'
      tools = ALL_TOOLS.pdf?.tools || []
    } else if (
      mimeType.includes('word') ||
      extension === 'doc' ||
      extension === 'docx'
    ) {
      category = 'word'
      tools = ALL_TOOLS.word?.tools || []
    } else if (
      mimeType.includes('excel') ||
      mimeType.includes('spreadsheet') ||
      extension === 'xls' ||
      extension === 'xlsx' ||
      extension === 'csv'
    ) {
      category = 'excel'
      tools = [...(ALL_TOOLS.excel?.tools || []), ...(ALL_TOOLS.csv?.tools || [])]
    } else if (mimeType.startsWith('image/')) {
      category = 'image'
      tools = ALL_TOOLS.image?.tools || []
    } else if (mimeType.startsWith('video/')) {
      category = 'video'
      tools = ALL_TOOLS.video?.tools || []
    } else if (mimeType.startsWith('audio/')) {
      category = 'audio'
      tools = ALL_TOOLS.audio?.tools || []
    } else if (
      mimeType === 'application/zip' ||
      mimeType === 'application/x-rar-compressed' ||
      mimeType === 'application/x-7z-compressed' ||
      extension === 'zip' ||
      extension === 'rar' ||
      extension === '7z'
    ) {
      category = 'archive'
      tools = ALL_TOOLS.archive?.tools || []
    } else {
      category = 'other'
      tools = ALL_TOOLS.utility?.tools || []
    }

    setFileType(category)
    setSuggestedTools(tools.slice(0, 12)) // Show max 12 tools
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file size (will check against user's tier)
    const validation = validateFileSize(file, 'FREE') // Will be updated with actual tier
    if (!validation.valid) {
      setError(validation.error || 'File too large')
      return
    }

    setUploadedFile(file)
    detectFileTypeAndSuggestTools(file)
  }

  const handleToolSelect = async (toolId: string) => {
    if (!uploadedFile) return

    setTransferring(true)
    setError(null)

    try {
      // Use file transfer system to pass file to tool
      const { fileTransferManager } = await import('@/lib/utils/file-transfer')
      const transferId = await fileTransferManager.storeFiles([uploadedFile], {
        sourceRoute: 'upload-workflow',
        timestamp: Date.now(),
      })

      // Navigate to tool page with transfer ID
      router.push(`/dashboard/tools/${toolId}?transfer=${transferId}`)
    } catch (err) {
      console.error('Failed to transfer file:', err)
      setError('Failed to transfer file. Please try again.')
      setTransferring(false)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
    setFileType('')
    setSuggestedTools([])
    setError(null)
  }

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">📤</span>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Upload & Process</h1>
              <p className="text-slate-600">Upload your file first, then choose what to do with it</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Upload Section */}
        {!uploadedFile ? (
          <div className="glass-card max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Step 1: Upload Your File</h2>
            <label className="block">
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={transferring}
              />
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-blue-500 transition cursor-pointer bg-slate-50">
                <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-900 font-semibold mb-2 text-lg">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-slate-500">
                  PDF, Word, Excel, Images, Videos, Audio, Archives, and more
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Max file size depends on your plan
                </p>
              </div>
            </label>
          </div>
        ) : (
          <>
            {/* Uploaded File Info */}
            <div className="glass-card max-w-2xl mx-auto mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{uploadedFile.name}</div>
                    <div className="text-xs text-slate-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {fileType.toUpperCase()} file
                    </div>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  disabled={transferring}
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Tool Selection */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Step 2: Choose What To Do
              </h2>
              <p className="text-slate-600 mb-6">
                Here are {suggestedTools.length} tools you can use with your {fileType.toUpperCase()} file:
              </p>

              {suggestedTools.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestedTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      disabled={transferring}
                      className="glass-card hover:border-blue-500 group transition-all hover:scale-105 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-4xl mb-3 block">{tool.icon}</span>
                      <h3 className="text-slate-900 font-semibold mb-1 group-hover:text-blue-600 transition">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                        {tool.description}
                      </p>
                      <div className="flex items-center text-xs text-blue-600">
                        {transferring ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <span>Use this tool</span>
                            <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="glass-card text-center py-12">
                  <div className="text-6xl mb-4">🤔</div>
                  <p className="text-slate-600 mb-2">
                    No specific tools found for this file type
                  </p>
                  <Link
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                  >
                    Browse all tools →
                  </Link>
                </div>
              )}
            </div>

            {/* Alternative: Browse All Tools */}
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-3">
                Don't see what you're looking for?
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition font-semibold"
              >
                Browse All Tools
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
