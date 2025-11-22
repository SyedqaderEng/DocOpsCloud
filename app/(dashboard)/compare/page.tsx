'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import SideBySideCompare from '@/components/compare/SideBySideCompare'
import Link from 'next/link'
import { ArrowRight, FileText, Upload, GitCompare } from 'lucide-react'

interface File {
  id: string
  name: string
  url: string
  thumbnailUrl?: string
}

export default function ComparePage() {
  const { user } = useAuth()
  const [leftFile, setLeftFile] = useState<File | null>(null)
  const [rightFile, setRightFile] = useState<File | null>(null)
  const [comparing, setComparing] = useState(false)

  // Mock file selection - in real app, this would fetch user's files
  const handleSelectFile = (side: 'left' | 'right') => {
    const mockFile: File = {
      id: Math.random().toString(36),
      name: `document_${side}.pdf`,
      url: '/path/to/file.pdf',
      thumbnailUrl: undefined,
    }

    if (side === 'left') {
      setLeftFile(mockFile)
    } else {
      setRightFile(mockFile)
    }
  }

  const handleStartCompare = () => {
    if (leftFile && rightFile) {
      setComparing(true)
    }
  }

  if (comparing && leftFile && rightFile) {
    return (
      <SideBySideCompare
        leftFile={leftFile}
        rightFile={rightFile}
        onClose={() => setComparing(false)}
      />
    )
  }

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
            <GitCompare className="w-10 h-10 text-[#00d4ff]" />
            <h1 className="text-4xl font-bold text-white">Compare Documents</h1>
          </div>
          <p className="text-gray-300">
            Compare two versions of a document side-by-side to see changes
          </p>
        </div>

        {/* File Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Left File */}
          <div className="glass-card border-2 border-[#00d4ff]">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-[#00d4ff]" />
              <h3 className="text-xl font-bold text-white">Original Document</h3>
            </div>

            {leftFile ? (
              <div className="glass-strong p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">{leftFile.name}</p>
                  <button
                    onClick={() => setLeftFile(null)}
                    className="text-[#ff0055] hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-xs text-gray-400">Selected for comparison</p>
              </div>
            ) : (
              <button
                onClick={() => handleSelectFile('left')}
                className="w-full aspect-[8.5/11] border-2 border-dashed border-gray-600 rounded-lg hover:border-[#00d4ff] transition flex flex-col items-center justify-center gap-3"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-white font-semibold mb-1">Upload Original</p>
                  <p className="text-sm text-gray-400">Click to select file</p>
                </div>
              </button>
            )}

            <p className="text-xs text-gray-500 mt-2">
              The baseline document for comparison
            </p>
          </div>

          {/* Right File */}
          <div className="glass-card border-2 border-[#a855f7]">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-[#a855f7]" />
              <h3 className="text-xl font-bold text-white">Modified Document</h3>
            </div>

            {rightFile ? (
              <div className="glass-strong p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">{rightFile.name}</p>
                  <button
                    onClick={() => setRightFile(null)}
                    className="text-[#ff0055] hover:underline text-sm"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-xs text-gray-400">Selected for comparison</p>
              </div>
            ) : (
              <button
                onClick={() => handleSelectFile('right')}
                className="w-full aspect-[8.5/11] border-2 border-dashed border-gray-600 rounded-lg hover:border-[#a855f7] transition flex flex-col items-center justify-center gap-3"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-white font-semibold mb-1">Upload Modified</p>
                  <p className="text-sm text-gray-400">Click to select file</p>
                </div>
              </button>
            )}

            <p className="text-xs text-gray-500 mt-2">
              The document to compare against the original
            </p>
          </div>
        </div>

        {/* Compare Button */}
        {leftFile && rightFile && (
          <div className="text-center">
            <button
              onClick={handleStartCompare}
              className="px-8 py-4 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg text-lg font-bold hover:from-[#00e5ff] hover:to-[#b966ff] transition shadow-lg flex items-center gap-3 mx-auto"
            >
              <GitCompare className="w-6 h-6" />
              Start Comparison
            </button>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <div className="glass-card">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded-lg flex items-center justify-center mb-3">
              <GitCompare className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">Side-by-Side View</h4>
            <p className="text-sm text-gray-400">
              View both documents simultaneously with synchronized scrolling
            </p>
          </div>

          <div className="glass-card">
            <div className="w-12 h-12 bg-gradient-to-br from-[#a855f7] to-[#ff6b35] rounded-lg flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">Difference Highlighting</h4>
            <p className="text-sm text-gray-400">
              Automatically highlights added and removed content
            </p>
          </div>

          <div className="glass-card">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] rounded-lg flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2">Multiple Formats</h4>
            <p className="text-sm text-gray-400">
              Compare PDFs, Word documents, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
