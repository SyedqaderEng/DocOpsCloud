'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ArrowLeftRight,
  Eye,
  EyeOff,
} from 'lucide-react'

interface CompareFile {
  id: string
  name: string
  url: string
  thumbnailUrl?: string
}

interface SideBySideCompareProps {
  leftFile: CompareFile
  rightFile: CompareFile
  onClose?: () => void
}

export default function SideBySideCompare({
  leftFile,
  rightFile,
  onClose,
}: SideBySideCompareProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [syncScroll, setSyncScroll] = useState(true)
  const [showDifferences, setShowDifferences] = useState(false)
  const [splitView, setSplitView] = useState(true)

  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  // Sync scroll between panels
  const handleScroll = (source: 'left' | 'right') => {
    if (!syncScroll) return

    if (source === 'left' && leftPanelRef.current && rightPanelRef.current) {
      rightPanelRef.current.scrollTop = leftPanelRef.current.scrollTop
    } else if (source === 'right' && leftPanelRef.current && rightPanelRef.current) {
      leftPanelRef.current.scrollTop = rightPanelRef.current.scrollTop
    }
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="h-screen gradient-animated flex flex-col">
      {/* Header Controls */}
      <div className="glass-card border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Compare Documents</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 glass-strong rounded-lg text-sm text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 glass-strong hover:bg-[rgba(255,0,85,0.1)] text-white rounded-lg font-semibold transition"
            >
              Close
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Navigation */}
          <div className="flex items-center gap-1 glass-strong rounded-lg p-1">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 glass-strong rounded-lg p-1">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            <span className="px-3 text-white font-semibold text-sm">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* View Options */}
          <button
            onClick={() => setSplitView(!splitView)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              splitView
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                : 'glass-strong text-white hover:bg-[rgba(0,212,255,0.1)]'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5 inline mr-2" />
            Split View
          </button>

          <button
            onClick={() => setSyncScroll(!syncScroll)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              syncScroll
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                : 'glass-strong text-white hover:bg-[rgba(0,212,255,0.1)]'
            }`}
          >
            {syncScroll ? (
              <Eye className="w-5 h-5 inline mr-2" />
            ) : (
              <EyeOff className="w-5 h-5 inline mr-2" />
            )}
            Sync Scroll
          </button>

          <button
            onClick={() => setShowDifferences(!showDifferences)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              showDifferences
                ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff0055] text-white'
                : 'glass-strong text-white hover:bg-[rgba(255,107,53,0.1)]'
            }`}
          >
            {showDifferences ? '🔍 Showing Differences' : '👁️ Show Differences'}
          </button>
        </div>
      </div>

      {/* Compare Panels */}
      <div className="flex-1 flex overflow-hidden">
        {splitView ? (
          <>
            {/* Left Panel */}
            <div className="flex-1 flex flex-col border-r border-gray-800">
              <div className="glass-strong px-4 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{leftFile.name}</p>
                    <p className="text-xs text-gray-400">Original Document</p>
                  </div>
                  <button className="p-2 hover:bg-[rgba(0,212,255,0.1)] rounded transition">
                    <Download className="w-5 h-5 text-[#00d4ff]" />
                  </button>
                </div>
              </div>

              <div
                ref={leftPanelRef}
                onScroll={() => handleScroll('left')}
                className="flex-1 overflow-auto p-6 bg-[rgba(0,0,0,0.3)]"
              >
                <div
                  className="mx-auto bg-white shadow-2xl"
                  style={{
                    width: `${zoom}%`,
                    aspectRatio: '8.5 / 11',
                    position: 'relative',
                  }}
                >
                  {leftFile.thumbnailUrl ? (
                    <img
                      src={leftFile.thumbnailUrl}
                      alt={leftFile.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <p className="text-6xl mb-4">📄</p>
                        <p className="text-sm">Page {currentPage}</p>
                        <p className="text-xs mt-2">{leftFile.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Difference Overlay */}
                  {showDifferences && (
                    <div className="absolute inset-0 bg-[rgba(255,0,85,0.1)] pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 w-1/2 h-8 bg-[rgba(255,0,85,0.3)] border-2 border-[#ff0055]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col">
              <div className="glass-strong px-4 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{rightFile.name}</p>
                    <p className="text-xs text-gray-400">Modified Document</p>
                  </div>
                  <button className="p-2 hover:bg-[rgba(168,85,247,0.1)] rounded transition">
                    <Download className="w-5 h-5 text-[#a855f7]" />
                  </button>
                </div>
              </div>

              <div
                ref={rightPanelRef}
                onScroll={() => handleScroll('right')}
                className="flex-1 overflow-auto p-6 bg-[rgba(0,0,0,0.3)]"
              >
                <div
                  className="mx-auto bg-white shadow-2xl"
                  style={{
                    width: `${zoom}%`,
                    aspectRatio: '8.5 / 11',
                    position: 'relative',
                  }}
                >
                  {rightFile.thumbnailUrl ? (
                    <img
                      src={rightFile.thumbnailUrl}
                      alt={rightFile.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <p className="text-6xl mb-4">📄</p>
                        <p className="text-sm">Page {currentPage}</p>
                        <p className="text-xs mt-2">{rightFile.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Difference Overlay */}
                  {showDifferences && (
                    <div className="absolute inset-0 bg-[rgba(0,255,136,0.1)] pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 w-1/2 h-8 bg-[rgba(0,255,136,0.3)] border-2 border-[#00ff88]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Overlay View */
          <div className="flex-1 flex flex-col">
            <div className="glass-strong px-4 py-3 border-b border-gray-700">
              <p className="text-white font-semibold">Overlay Comparison</p>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-[rgba(0,0,0,0.3)]">
              <div
                className="mx-auto bg-white shadow-2xl relative"
                style={{
                  width: `${zoom}%`,
                  aspectRatio: '8.5 / 11',
                }}
              >
                {/* Base image (left file) */}
                <div className="absolute inset-0">
                  {leftFile.thumbnailUrl ? (
                    <img
                      src={leftFile.thumbnailUrl}
                      alt={leftFile.name}
                      className="w-full h-full object-contain opacity-70"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <p>Original Document</p>
                    </div>
                  )}
                </div>

                {/* Overlay image (right file) */}
                <div className="absolute inset-0 mix-blend-difference">
                  {rightFile.thumbnailUrl ? (
                    <img
                      src={rightFile.thumbnailUrl}
                      alt={rightFile.name}
                      className="w-full h-full object-contain opacity-70"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <p>Modified Document</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="glass-card border-t border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#ff0055] rounded"></div>
              <span className="text-gray-300">Removed Content</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#00ff88] rounded"></div>
              <span className="text-gray-300">Added Content</span>
            </div>
          </div>
          <p className="text-gray-400">
            Use arrow keys or buttons to navigate • Scroll is {syncScroll ? 'synced' : 'independent'}
          </p>
        </div>
      </div>
    </div>
  )
}
