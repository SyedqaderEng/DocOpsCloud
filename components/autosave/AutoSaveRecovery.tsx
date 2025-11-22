'use client'

import { useEffect, useState } from 'react'
import { AutoSaveData, loadAutoSave, clearAutoSave, getTimeSinceLastSave } from '@/lib/utils/auto-save'
import { RefreshCw, X, Clock } from 'lucide-react'

interface AutoSaveRecoveryProps {
  toolId: string
  onRecover: (data: AutoSaveData) => void
  onDismiss?: () => void
}

export default function AutoSaveRecovery({ toolId, onRecover, onDismiss }: AutoSaveRecoveryProps) {
  const [autoSaveData, setAutoSaveData] = useState<AutoSaveData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const savedData = loadAutoSave(toolId)
    if (savedData) {
      setAutoSaveData(savedData)
    }
  }, [toolId])

  if (!autoSaveData || dismissed) return null

  const handleRecover = () => {
    onRecover(autoSaveData)
    setDismissed(true)
  }

  const handleDismiss = () => {
    clearAutoSave(toolId)
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  const timeSince = getTimeSinceLastSave(toolId)

  return (
    <div className="glass-card border-2 border-[#00d4ff] animate-in slide-in-from-top duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded-lg flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold mb-1">Work in Progress Detected</h3>
          <p className="text-sm text-gray-300 mb-2">
            We found unsaved work from your previous session.
          </p>

          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeSince}
            </div>
            <div>{autoSaveData.files.length} file{autoSaveData.files.length !== 1 ? 's' : ''}</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRecover}
              className="px-4 py-2 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition text-sm"
            >
              Recover Work
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 glass-strong hover:bg-[rgba(255,255,255,0.1)] text-gray-300 rounded-lg font-semibold transition text-sm"
            >
              Start Fresh
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}

/**
 * Auto-save indicator component
 */
interface AutoSaveIndicatorProps {
  isSaving: boolean
  lastSaved?: Date
}

export function AutoSaveIndicator({ isSaving, lastSaved }: AutoSaveIndicatorProps) {
  if (!isSaving && !lastSaved) return null

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      {isSaving ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <div className="w-2 h-2 bg-[#00ff88] rounded-full" />
          <span>Auto-saved {formatTimeSince(lastSaved)}</span>
        </>
      ) : null}
    </div>
  )
}

function formatTimeSince(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffSeconds < 10) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  return 'a while ago'
}
