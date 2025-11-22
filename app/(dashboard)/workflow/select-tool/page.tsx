'use client'

import { useState, useEffect, use, Suspense } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, FileText, Scissors, Compress, Combine, RotateCw, Lock, FileEdit, Mail, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

interface ToolOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'pdf' | 'word' | 'excel' | 'image'
  apiEndpoint: string
}

const PDF_TOOLS: ToolOption[] = [
  {
    id: 'pdf-compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    icon: <Compress className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/tools/pdf-compress',
  },
  {
    id: 'pdf-merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDF files into one',
    icon: <Combine className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/process/pdf/merge',
  },
  {
    id: 'pdf-split',
    name: 'Split PDF',
    description: 'Split a PDF into separate pages or sections',
    icon: <Scissors className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/process/pdf/split',
  },
  {
    id: 'pdf-rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages to correct orientation',
    icon: <RotateCw className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/process/pdf/rotate',
  },
  {
    id: 'pdf-protect',
    name: 'Protect PDF',
    description: 'Add password protection to your PDF',
    icon: <Lock className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/process/pdf/protect',
  },
  {
    id: 'pdf-edit',
    name: 'Edit PDF',
    description: 'Edit text and content in your PDF',
    icon: <FileEdit className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/process/pdf/edit',
  },
  {
    id: 'pdf-sign',
    name: 'Sign PDF',
    description: 'Add digital signature to your PDF',
    icon: <FileEdit className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/process/pdf/sign',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF to editable Word document',
    icon: <FileText className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/process/pdf/to-word',
  },
  {
    id: 'pdf-to-image',
    name: 'PDF to Image',
    description: 'Convert PDF pages to images',
    icon: <ImageIcon className="w-6 h-6" />,
    category: 'pdf',
    apiEndpoint: '/api/process/pdf/to-image',
  },
]

function ToolSelectionContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTool, setSelectedTool] = useState<ToolOption | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const fetchFiles = async () => {
      const fileIds = searchParams.get('files')?.split(',') || []
      if (fileIds.length === 0) {
        router.push('/dashboard/workflow/upload')
        return
      }

      try {
        const idToken = await user?.getIdToken()
        if (!idToken) {
          router.push('/auth/signin')
          return
        }

        // Fetch file details
        const filesData = await Promise.all(
          fileIds.map(async (fileId) => {
            const res = await fetch(`/api/files/${fileId}`, {
              headers: { 'Authorization': `Bearer ${idToken}` },
            })
            if (res.ok) {
              return await res.json()
            }
            return null
          })
        )

        setFiles(filesData.filter(Boolean))
      } catch (err) {
        console.error('Failed to fetch files:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [searchParams, user, router])

  const handleToolSelect = (tool: ToolOption) => {
    setSelectedTool(tool)
  }

  const handleProcess = async () => {
    if (!selectedTool || files.length === 0) return

    setProcessing(true)

    try {
      const idToken = await user?.getIdToken()
      if (!idToken) throw new Error('Not authenticated')

      // Create processing job
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: files[0].id, // Use first file for now
          operation: selectedTool.id,
          options: {},
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create job')
      }

      const { jobId } = await res.json()

      // Navigate to processing/download page
      router.push(`/dashboard/jobs/${jobId}`)
    } catch (err: any) {
      console.error('Processing failed:', err)
      alert(err.message || 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/workflow/upload"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Select Tool</h1>
          <p className="text-gray-300">Choose what you want to do with your files</p>
        </div>

        {/* Workflow Progress */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-8 h-8 glass-strong rounded-full flex items-center justify-center text-sm font-bold text-gray-400">
              ✓
            </div>
            <span className="text-gray-400 font-semibold">Upload</span>
          </div>
          <div className="flex-1 h-1 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <span className="text-white font-semibold">Select Tool</span>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Files Preview */}
          <div className="glass-card">
            <h2 className="text-xl font-bold text-white mb-4">Your Files</h2>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-3 bg-[rgba(0,0,0,0.3)] rounded-lg border border-[rgba(255,255,255,0.1)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {file.originalName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedTool && (
              <div className="mt-6 p-4 bg-gradient-to-r from-[rgba(0,212,255,0.1)] to-[rgba(168,85,247,0.1)] rounded-lg border border-[#00d4ff]">
                <p className="text-sm font-semibold text-white mb-2">Selected Tool:</p>
                <div className="flex items-center gap-2">
                  <div className="text-[#00d4ff]">{selectedTool.icon}</div>
                  <p className="text-[#00d4ff] font-bold">{selectedTool.name}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={!selectedTool || processing}
              className="w-full mt-6 btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  Process File
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Tool Selection Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Available Tools</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PDF_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool)}
                  className={`glass-card text-left transition-all hover:scale-105 ${
                    selectedTool?.id === tool.id
                      ? 'border-2 border-[#00d4ff] bg-gradient-to-r from-[rgba(0,212,255,0.1)] to-[rgba(168,85,247,0.1)]'
                      : 'hover:border-[#00d4ff]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                    selectedTool?.id === tool.id
                      ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7]'
                      : 'bg-[rgba(0,0,0,0.3)]'
                  }`}>
                    <div className={selectedTool?.id === tool.id ? 'text-white' : 'text-gray-400'}>
                      {tool.icon}
                    </div>
                  </div>
                  <h3 className={`font-semibold mb-1 ${
                    selectedTool?.id === tool.id ? 'text-[#00d4ff]' : 'text-white'
                  }`}>
                    {tool.name}
                  </h3>
                  <p className="text-sm text-gray-400">{tool.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ToolSelectionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
      </div>
    }>
      <ToolSelectionContent />
    </Suspense>
  )
}
