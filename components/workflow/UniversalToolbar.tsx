'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Combine,
  Scissors,
  Compress,
  RotateCw,
  Lock,
  FileEdit,
  FileText,
  Image,
  Layers,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Tool {
  id: string
  name: string
  icon: React.ReactNode
  action: string
}

const QUICK_TOOLS: Tool[] = [
  { id: 'pdf-merge', name: 'Merge', icon: <Combine className="w-5 h-5" />, action: 'merge' },
  { id: 'pdf-split', name: 'Split', icon: <Scissors className="w-5 h-5" />, action: 'split' },
  { id: 'pdf-compress', name: 'Compress', icon: <Compress className="w-5 h-5" />, action: 'compress' },
  { id: 'pdf-rotate', name: 'Rotate', icon: <RotateCw className="w-5 h-5" />, action: 'rotate' },
  { id: 'pdf-protect', name: 'Protect', icon: <Lock className="w-5 h-5" />, action: 'protect' },
  { id: 'pdf-edit', name: 'Edit', icon: <FileEdit className="w-5 h-5" />, action: 'edit' },
  { id: 'pdf-sign', name: 'Sign', icon: <FileEdit className="w-5 h-5" />, action: 'sign' },
  { id: 'pdf-to-word', name: 'To Word', icon: <FileText className="w-5 h-5" />, action: 'convert' },
  { id: 'pdf-to-image', name: 'To Image', icon: <Image className="w-5 h-5" />, action: 'convert' },
]

interface UniversalToolbarProps {
  fileIds?: string[]
  onToolSelect?: (toolId: string) => void
  compact?: boolean
}

export default function UniversalToolbar({ fileIds, onToolSelect, compact = false }: UniversalToolbarProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(!compact)

  const handleToolClick = (tool: Tool) => {
    if (onToolSelect) {
      onToolSelect(tool.id)
    } else if (fileIds && fileIds.length > 0) {
      // Navigate to tool with file IDs
      router.push(`/dashboard/workflow/process/${tool.id}?files=${fileIds.join(',')}`)
    } else {
      // Navigate to tool page
      router.push(`/dashboard/tools/${tool.id}`)
    }
  }

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-3 glass-card border border-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#00d4ff]" />
          <span className="text-white font-semibold">Quick Tools</span>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </button>
    )
  }

  return (
    <div className="glass-card border border-[#00d4ff]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#00d4ff]" />
          <h3 className="text-lg font-bold text-white">Quick Tools</h3>
        </div>
        {compact && (
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition"
          >
            <ChevronUp className="w-5 h-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {QUICK_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool)}
            className="flex flex-col items-center gap-2 p-3 glass-strong hover:bg-[rgba(0,212,255,0.1)] hover:border-[#00d4ff] rounded-lg transition group"
            title={tool.name}
          >
            <div className="text-[#00d4ff] group-hover:scale-110 transition-transform">
              {tool.icon}
            </div>
            <span className="text-xs text-gray-300 group-hover:text-white transition text-center">
              {tool.name}
            </span>
          </button>
        ))}
      </div>

      {/* Download Button (if applicable) */}
      {fileIds && fileIds.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
          <button className="w-full px-4 py-2 glass-strong hover:bg-[rgba(0,212,255,0.1)] rounded-lg transition flex items-center justify-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            <span className="text-white">Download Original</span>
          </button>
        </div>
      )}
    </div>
  )
}
