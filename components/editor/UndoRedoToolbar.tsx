'use client'

import { useState, useEffect } from 'react'
import { Undo2, Redo2, History, X } from 'lucide-react'
import { HistoryManager, Action } from '@/lib/utils/history-manager'

interface UndoRedoToolbarProps {
  historyManager: HistoryManager
  onUndo: (action: Action) => void
  onRedo: (action: Action) => void
  onJumpTo?: (index: number) => void
}

export default function UndoRedoToolbar({
  historyManager,
  onUndo,
  onRedo,
  onJumpTo,
}: UndoRedoToolbarProps) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [counts, setCounts] = useState({ undoCount: 0, redoCount: 0 })
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<Action[]>([])
  const [currentAction, setCurrentAction] = useState<Action | null>(null)

  useEffect(() => {
    updateState()
  }, [historyManager])

  const updateState = () => {
    setCanUndo(historyManager.canUndo())
    setCanRedo(historyManager.canRedo())
    setCounts(historyManager.getCounts())
    setHistory(historyManager.getHistory())
    setCurrentAction(historyManager.getCurrentAction())
  }

  const handleUndo = () => {
    const action = historyManager.undo()
    if (action) {
      onUndo(action)
      updateState()
    }
  }

  const handleRedo = () => {
    const action = historyManager.redo()
    if (action) {
      onRedo(action)
      updateState()
    }
  }

  const handleJumpTo = (index: number) => {
    if (onJumpTo) {
      historyManager.jumpTo(index)
      onJumpTo(index)
      updateState()
      setShowHistory(false)
    }
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const getActionIcon = (type: string): string => {
    const icons: Record<string, string> = {
      PAGE_ADD: '➕',
      PAGE_DELETE: '🗑️',
      PAGE_ROTATE: '🔄',
      WATERMARK_ADD: '💧',
      ANNOTATION_ADD: '✏️',
      ANNOTATION_DELETE: '❌',
      SIGNATURE_ADD: '✍️',
      TEXT_EDIT: '📝',
    }
    return icons[type] || '📄'
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="glass-card px-4 py-2 flex items-center gap-2">
        {/* Undo Button */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition ${
            canUndo
              ? 'text-white hover:bg-[rgba(0,212,255,0.1)] cursor-pointer'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title={`Undo${canUndo ? ` (${counts.undoCount} actions)` : ''}`}
        >
          <Undo2 className="w-5 h-5" />
          <span className="text-sm">Undo</span>
          {counts.undoCount > 0 && (
            <span className="px-2 py-0.5 bg-[rgba(0,212,255,0.2)] text-[#00d4ff] text-xs rounded-full">
              {counts.undoCount}
            </span>
          )}
        </button>

        {/* Redo Button */}
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition ${
            canRedo
              ? 'text-white hover:bg-[rgba(168,85,247,0.1)] cursor-pointer'
              : 'text-gray-600 cursor-not-allowed'
          }`}
          title={`Redo${canRedo ? ` (${counts.redoCount} actions)` : ''}`}
        >
          <Redo2 className="w-5 h-5" />
          <span className="text-sm">Redo</span>
          {counts.redoCount > 0 && (
            <span className="px-2 py-0.5 bg-[rgba(168,85,247,0.2)] text-[#a855f7] text-xs rounded-full">
              {counts.redoCount}
            </span>
          )}
        </button>

        {/* Divider */}
        {history.length > 0 && <div className="w-px h-6 bg-gray-700 mx-2" />}

        {/* History Button */}
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-white hover:bg-[rgba(0,255,136,0.1)] transition"
            title="View history"
          >
            <History className="w-5 h-5" />
            <span className="text-sm">History</span>
            <span className="px-2 py-0.5 bg-[rgba(0,255,136,0.2)] text-[#00ff88] text-xs rounded-full">
              {history.length}
            </span>
          </button>
        )}

        {/* Current Action */}
        {currentAction && (
          <div className="flex items-center gap-2 px-3 py-2 glass-strong rounded-lg">
            <span className="text-xl">{getActionIcon(currentAction.type)}</span>
            <span className="text-sm text-gray-300">{currentAction.description}</span>
            <span className="text-xs text-gray-500">{formatTime(currentAction.timestamp)}</span>
          </div>
        )}
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card border-2 border-[#00d4ff] max-h-96 overflow-y-auto z-50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-[#00d4ff]" />
              Action History
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="p-2">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No actions yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {history.map((action, index) => {
                  const isCurrent = currentAction?.id === action.id
                  const isPast = index <= history.indexOf(currentAction!)
                  const isFuture = !isPast && !isCurrent

                  return (
                    <button
                      key={action.id}
                      onClick={() => handleJumpTo(index)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                          : isPast
                          ? 'glass-strong text-white hover:bg-[rgba(0,212,255,0.1)]'
                          : 'glass-strong text-gray-500 hover:bg-[rgba(168,85,247,0.1)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getActionIcon(action.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold truncate ${
                              isFuture ? 'text-gray-400' : ''
                            }`}
                          >
                            {action.description}
                          </p>
                          <p className="text-xs text-gray-400">{formatTime(action.timestamp)}</p>
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-1 bg-white text-[#00d4ff] text-xs rounded-full font-semibold flex-shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div className="p-4 border-t border-gray-700 text-center">
              <p className="text-xs text-gray-400">
                Click any action to jump to that point in history
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
