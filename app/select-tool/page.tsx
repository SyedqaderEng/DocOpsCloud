'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getAllToolsFlat } from '@/lib/tools-data'
import { ArrowLeft, ArrowRight, FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon, Zap } from 'lucide-react'

interface FileInfo {
  name: string
  type: string
  size: number
}

export default function SelectToolPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transferId = searchParams.get('transfer')

  const [files, setFiles] = useState<File[]>([])
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [recommendedTools, setRecommendedTools] = useState<any[]>([])

  const allTools = getAllToolsFlat()

  useEffect(() => {
    loadTransferredFiles()
  }, [transferId])

  const loadTransferredFiles = async () => {
    if (!transferId) {
      router.push('/')
      return
    }

    try {
      const { fileTransferManager } = await import('@/lib/utils/file-transfer')
      const data = await fileTransferManager.retrieveFiles(transferId)

      if (data && data.files && data.files.length > 0) {
        setFiles(data.files)
        setFileInfos(data.files.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        })))

        // Get recommended tools based on file types
        const tools = getRecommendedTools(data.files)
        setRecommendedTools(tools)
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Failed to load files:', err)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const getRecommendedTools = (uploadedFiles: File[]) => {
    const fileTypes = uploadedFiles.map(f => {
      if (f.type.includes('pdf')) return 'pdf'
      if (f.type.includes('word') || f.type.includes('document')) return 'word'
      if (f.type.includes('sheet') || f.type.includes('excel') || f.name.endsWith('.csv')) return 'excel'
      if (f.type.includes('image')) return 'image'
      return 'other'
    })

    const primaryType = fileTypes[0]
    const multipleFiles = uploadedFiles.length > 1

    // Filter tools based on file type and whether we have multiple files
    let tools = allTools.filter(tool => {
      const matchesType = tool.id.startsWith(primaryType) || tool.category === primaryType

      // If multiple files of same type, prioritize merge tools
      if (multipleFiles && fileTypes.every(t => t === primaryType)) {
        if (tool.id.includes('merge') || tool.id.includes('combine')) {
          return true
        }
      }

      return matchesType
    })

    // Sort: merge/combine tools first if multiple files, then others
    if (multipleFiles) {
      tools.sort((a, b) => {
        const aIsMerge = a.id.includes('merge') || a.id.includes('combine')
        const bIsMerge = b.id.includes('merge') || b.id.includes('combine')
        if (aIsMerge && !bIsMerge) return -1
        if (!aIsMerge && bIsMerge) return 1
        return 0
      })
    }

    return tools.slice(0, 12)
  }

  const navigateToTool = async (toolId: string) => {
    if (transferId) {
      router.push(`/tools/${toolId}?transfer=${transferId}`)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-400" />
    if (type.includes('word') || type.includes('document')) return <FileText className="w-6 h-6 text-blue-400" />
    if (type.includes('sheet') || type.includes('excel')) return <FileSpreadsheet className="w-6 h-6 text-green-400" />
    if (type.includes('image')) return <ImageIcon className="w-6 h-6 text-purple-400" />
    return <FileIcon className="w-6 h-6 text-gray-400" />
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your files...</p>
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
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="hidden sm:block px-5 py-2.5 text-white hover:text-[#00d4ff] transition font-semibold">Sign In</Link>
              <Link href="/auth/signup" className="btn-neon">Start Free</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] transition mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Choose Your <span className="text-gradient">Tool</span>
          </h1>
          <p className="text-xl text-gray-300">
            Select an operation for your {fileInfos.length} file{fileInfos.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Uploaded Files Display */}
        <div className="glass-card mb-10">
          <h3 className="text-lg font-bold text-white mb-4">Your Files</h3>
          <div className="space-y-2">
            {fileInfos.map((file, index) => (
              <div key={index} className="flex items-center gap-3 glass rounded-lg p-3">
                {getFileIcon(file.type)}
                <div className="flex-1">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <p className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Tools */}
        {recommendedTools.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              {fileInfos.length > 1 ? 'Recommended for Multiple Files' : 'Available Tools'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {recommendedTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => navigateToTool(tool.id)}
                  className="glass-card hover:border-[#00d4ff] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] p-6 text-left transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl group-hover:scale-110 transition-transform">{tool.icon}</span>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#00d4ff] transition opacity-0 group-hover:opacity-100" />
                  </div>
                  <h3 className="text-white font-bold mb-2 group-hover:text-[#00d4ff] transition">
                    {tool.name}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{tool.description}</p>
                </button>
              ))}
            </div>

            <div className="text-center">
              <Link href="/tools" className="inline-flex items-center gap-2 text-[#00d4ff] hover:underline font-semibold">
                Browse All Tools
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { icon: '⚡', title: 'Lightning Fast', desc: 'Process files in seconds' },
            { icon: '🔒', title: 'Secure', desc: 'Files deleted after 1 hour' },
            { icon: '✨', title: 'No Signup', desc: 'Start processing immediately' },
          ].map((item, i) => (
            <div key={i} className="glass-card text-center">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h4 className="text-white font-bold mb-1">{item.title}</h4>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
