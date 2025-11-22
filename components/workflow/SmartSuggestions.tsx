'use client'

import { useRouter } from 'next/navigation'
import { FileSuggestion } from '@/lib/utils/file-analysis'
import { Sparkles, ArrowRight } from 'lucide-react'

interface SmartSuggestionsProps {
  suggestions: FileSuggestion[]
  onSelectTool?: (toolId: string) => void
}

export default function SmartSuggestions({ suggestions, onSelectTool }: SmartSuggestionsProps) {
  const router = useRouter()

  if (suggestions.length === 0) return null

  const highPriority = suggestions.filter(s => s.priority === 'high')
  const otherSuggestions = suggestions.filter(s => s.priority !== 'high')

  const handleToolClick = (toolId: string) => {
    if (onSelectTool) {
      onSelectTool(toolId)
    } else {
      router.push(`/dashboard/tools/${toolId}`)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#00d4ff]" />
        <h3 className="text-lg font-bold text-white">Smart Suggestions</h3>
      </div>

      {/* High Priority Suggestions */}
      {highPriority.length > 0 && (
        <div className="space-y-2">
          {highPriority.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleToolClick(suggestion.toolId)}
              className="w-full p-4 glass-card border-2 border-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-white font-semibold group-hover:text-[#00d4ff] transition">
                      {suggestion.tool}
                    </h4>
                    <span className="px-2 py-0.5 bg-[rgba(0,212,255,0.2)] border border-[#00d4ff] rounded-full text-xs text-[#00d4ff] font-semibold uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{suggestion.reason}</p>
                  <div className="mt-2 flex items-center text-xs text-[#00d4ff]">
                    <span>Try this tool</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Other Suggestions */}
      {otherSuggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-400 mb-2 uppercase">
            Other Options
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {otherSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleToolClick(suggestion.toolId)}
                className="p-3 glass-strong hover:border-[#00d4ff] transition text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{suggestion.icon}</span>
                  <h5 className="text-sm text-white font-semibold group-hover:text-[#00d4ff] transition">
                    {suggestion.tool}
                  </h5>
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{suggestion.reason}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
