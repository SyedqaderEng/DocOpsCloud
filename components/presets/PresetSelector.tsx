'use client'

import { useState } from 'react'
import { ToolPreset, getPresetsForTool } from '@/lib/presets/tool-presets'
import { Star, ChevronDown, ChevronUp, Settings } from 'lucide-react'

interface PresetSelectorProps {
  toolId: string
  onSelectPreset: (preset: ToolPreset) => void
  selectedPresetId?: string
}

export default function PresetSelector({ toolId, onSelectPreset, selectedPresetId }: PresetSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const presets = getPresetsForTool(toolId)

  if (presets.length === 0) return null

  const selectedPreset = presets.find(p => p.id === selectedPresetId)

  return (
    <div className="glass-card border border-[#00d4ff]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#00d4ff]" />
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">Quick Presets</h3>
            {selectedPreset && (
              <p className="text-xs text-gray-400">{selectedPreset.name}</p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Presets Grid */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-gray-400 mb-3">
            Select a preset to apply common settings automatically
          </p>

          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset)
                setIsExpanded(false)
              }}
              className={`w-full p-3 rounded-lg text-left transition ${
                selectedPresetId === preset.id
                  ? 'bg-gradient-to-r from-[rgba(0,212,255,0.2)] to-[rgba(168,85,247,0.2)] border-2 border-[#00d4ff]'
                  : 'glass-strong hover:bg-[rgba(0,212,255,0.1)]'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${
                      selectedPresetId === preset.id ? 'text-[#00d4ff]' : 'text-white'
                    }`}>
                      {preset.name}
                    </span>
                    {preset.popular && (
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{preset.description}</p>

                  {/* Settings Preview */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(preset.settings).slice(0, 3).map(([key, value]) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 bg-[rgba(0,0,0,0.3)] rounded text-[10px] text-gray-400"
                      >
                        {key}: {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
