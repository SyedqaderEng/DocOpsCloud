'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import UndoRedoToolbar from '@/components/editor/UndoRedoToolbar'
import { HistoryManager, createAction, Action } from '@/lib/utils/history-manager'
import Link from 'next/link'
import {
  ArrowLeft,
  RotateCw,
  Trash2,
  Type,
  Image as ImageIcon,
  Save,
  Download,
} from 'lucide-react'

interface EditorState {
  pages: Array<{
    id: string
    number: number
    rotation: number
    annotations: Array<{
      id: string
      type: 'text' | 'signature' | 'image'
      content: string
      position: { x: number; y: number }
    }>
  }>
  watermark?: {
    text: string
    opacity: number
  }
}

export default function EditorPage() {
  const params = useParams()
  const { user } = useAuth()
  const fileId = params?.fileId as string

  const [editorState, setEditorState] = useState<EditorState>({
    pages: [
      { id: '1', number: 1, rotation: 0, annotations: [] },
      { id: '2', number: 2, rotation: 0, annotations: [] },
      { id: '3', number: 3, rotation: 0, annotations: [] },
    ],
  })

  const historyManagerRef = useRef(new HistoryManager())
  const [, forceUpdate] = useState({})

  // Handle undo
  const handleUndo = (action: Action) => {
    console.log('Undoing:', action)

    switch (action.type) {
      case 'PAGE_ROTATE':
        rotatePage(action.inverse.pageNumber, action.inverse.angle, false)
        break
      case 'PAGE_DELETE':
        // Restore deleted page
        break
      case 'WATERMARK_ADD':
        // Remove watermark
        setEditorState((prev) => ({ ...prev, watermark: undefined }))
        break
      // Add more undo handlers
    }
  }

  // Handle redo
  const handleRedo = (action: Action) => {
    console.log('Redoing:', action)

    switch (action.type) {
      case 'PAGE_ROTATE':
        rotatePage(action.data.pageNumber, action.data.angle, false)
        break
      case 'WATERMARK_ADD':
        setEditorState((prev) => ({
          ...prev,
          watermark: action.data.options,
        }))
        break
      // Add more redo handlers
    }
  }

  // Rotate page
  const rotatePage = (pageNumber: number, angle: number, addToHistory: boolean = true) => {
    setEditorState((prev) => ({
      ...prev,
      pages: prev.pages.map((page) =>
        page.number === pageNumber ? { ...page, rotation: page.rotation + angle } : page
      ),
    }))

    if (addToHistory) {
      historyManagerRef.current.addAction(createAction.pageRotate(pageNumber, angle))
      forceUpdate({})
    }
  }

  // Delete page
  const deletePage = (pageNumber: number) => {
    const page = editorState.pages.find((p) => p.number === pageNumber)
    if (!page) return

    setEditorState((prev) => ({
      ...prev,
      pages: prev.pages.filter((p) => p.number !== pageNumber),
    }))

    historyManagerRef.current.addAction(createAction.pageDelete(pageNumber, page))
    forceUpdate({})
  }

  // Add watermark
  const addWatermark = () => {
    const watermarkText = prompt('Enter watermark text:')
    if (!watermarkText) return

    const opacity = 0.3

    setEditorState((prev) => ({
      ...prev,
      watermark: { text: watermarkText, opacity },
    }))

    historyManagerRef.current.addAction(
      createAction.watermarkAdd(watermarkText, { text: watermarkText, opacity })
    )
    forceUpdate({})
  }

  return (
    <div className="min-h-screen gradient-animated">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-card border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="flex gap-2">
              <button className="px-4 py-2 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg font-semibold transition flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Undo/Redo Toolbar */}
          <UndoRedoToolbar
            historyManager={historyManagerRef.current}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onJumpTo={(index) => {
              console.log('Jump to index:', index)
              forceUpdate({})
            }}
          />
        </div>
      </div>

      {/* Editor Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Toolbar */}
          <div className="lg:col-span-1">
            <div className="glass-card sticky top-24">
              <h3 className="text-white font-semibold mb-4">Tools</h3>
              <div className="space-y-2">
                <button
                  onClick={() => rotatePage(1, 90)}
                  className="w-full px-4 py-3 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <RotateCw className="w-5 h-5" />
                  Rotate Page
                </button>
                <button
                  onClick={() => deletePage(editorState.pages[0]?.number)}
                  className="w-full px-4 py-3 glass-strong hover:bg-[rgba(255,0,85,0.1)] text-white rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Page
                </button>
                <button
                  onClick={addWatermark}
                  className="w-full px-4 py-3 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <Type className="w-5 h-5" />
                  Add Watermark
                </button>
              </div>

              {/* Watermark Info */}
              {editorState.watermark && (
                <div className="mt-4 p-3 glass-strong rounded-lg border border-[#00d4ff]">
                  <p className="text-xs text-gray-400 mb-1">Active Watermark:</p>
                  <p className="text-white font-semibold">{editorState.watermark.text}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pages */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                PDF Pages ({editorState.pages.length})
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {editorState.pages.map((page) => (
                  <div key={page.id} className="glass-card">
                    <div className="aspect-[8.5/11] bg-white rounded-lg flex items-center justify-center relative overflow-hidden">
                      {/* Page Content */}
                      <div
                        className="w-full h-full flex items-center justify-center text-gray-800"
                        style={{
                          transform: `rotate(${page.rotation}deg)`,
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        <div className="text-center">
                          <p className="text-6xl font-bold mb-2">{page.number}</p>
                          <p className="text-sm text-gray-500">
                            Rotation: {page.rotation}°
                          </p>
                        </div>
                      </div>

                      {/* Watermark */}
                      {editorState.watermark && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <p
                            className="text-6xl font-bold text-gray-400 rotate-45"
                            style={{ opacity: editorState.watermark.opacity }}
                          >
                            {editorState.watermark.text}
                          </p>
                        </div>
                      )}

                      {/* Annotations */}
                      {page.annotations.map((annotation) => (
                        <div
                          key={annotation.id}
                          className="absolute"
                          style={{
                            left: `${annotation.position.x}%`,
                            top: `${annotation.position.y}%`,
                          }}
                        >
                          {annotation.type === 'text' && (
                            <div className="bg-yellow-200 px-2 py-1 rounded shadow">
                              {annotation.content}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => rotatePage(page.number, 90)}
                        className="flex-1 px-3 py-2 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg text-sm font-semibold transition"
                      >
                        <RotateCw className="w-4 h-4 inline mr-1" />
                        Rotate
                      </button>
                      <button
                        onClick={() => deletePage(page.number)}
                        className="flex-1 px-3 py-2 glass-strong hover:bg-[rgba(255,0,85,0.1)] text-[#ff0055] rounded-lg text-sm font-semibold transition"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
