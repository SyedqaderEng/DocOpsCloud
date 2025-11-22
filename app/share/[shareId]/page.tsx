'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Download, Lock, Eye, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react'
import { formatFileSize } from '@/lib/utils/file-validation'

interface ShareLinkData {
  shareId: string
  requiresPassword: boolean
  file: {
    name: string
    type: string
    size: number
    mimeType: string
    thumbnailUrl?: string
    createdAt: string
  }
  allowDownload: boolean
  expiresAt: string
  viewsRemaining: number | null
}

interface FileAccess {
  file: {
    id: string
    name: string
    type: string
    size: number
    mimeType: string
    url: string
    thumbnailUrl?: string
  }
  allowDownload: boolean
}

export default function ShareLinkPage() {
  const params = useParams()
  const shareId = params?.shareId as string

  const [loading, setLoading] = useState(true)
  const [shareData, setShareData] = useState<ShareLinkData | null>(null)
  const [fileAccess, setFileAccess] = useState<FileAccess | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    fetchShareLink()
  }, [shareId])

  const fetchShareLink = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/share/${shareId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load share link')
      }

      setShareData(data.data)

      // If no password required, auto-verify
      if (!data.data.requiresPassword) {
        await verifyAccess('')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyAccess = async (pwd: string = password) => {
    try {
      setVerifying(true)
      setError(null)

      const res = await fetch(`/api/share/${shareId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify access')
      }

      setFileAccess(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  const handleDownload = () => {
    if (fileAccess?.file.url) {
      window.open(fileAccess.file.url, '_blank')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return 'Less than 1 hour'
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading shared file...</p>
        </div>
      </div>
    )
  }

  if (error && !shareData) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#ff0055] to-[#ff6b35] rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <p className="text-sm text-gray-400">
            This link may have expired or been removed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-animated flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded-2xl mb-4">
            <FileText className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Shared File</h1>
          <p className="text-gray-300">Someone shared a file with you</p>
        </div>

        <div className="glass-card">
          {/* File Info */}
          {shareData && (
            <div className="mb-6">
              {shareData.file.thumbnailUrl && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={shareData.file.thumbnailUrl}
                    alt="File preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <h2 className="text-xl font-bold text-white mb-4 break-all">
                {shareData.file.name}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="glass-strong p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">File Size</p>
                  <p className="text-white font-semibold">
                    {formatFileSize(shareData.file.size)}
                  </p>
                </div>

                <div className="glass-strong p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">File Type</p>
                  <p className="text-white font-semibold">
                    {shareData.file.type}
                  </p>
                </div>

                <div className="glass-strong p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Expires In</p>
                  <p className="text-white font-semibold flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getTimeRemaining(shareData.expiresAt)}
                  </p>
                </div>

                {shareData.viewsRemaining !== null && (
                  <div className="glass-strong p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Views Remaining</p>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {shareData.viewsRemaining}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Password Form */}
          {shareData?.requiresPassword && !fileAccess && (
            <div className="mb-6">
              <div className="mb-4 p-4 bg-[rgba(0,212,255,0.1)] border border-[#00d4ff] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-[#00d4ff]" />
                  <p className="text-white font-semibold">Password Protected</p>
                </div>
                <p className="text-sm text-gray-300">
                  This file is password protected. Enter the password to access it.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && verifyAccess()}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 glass-strong rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />

                {error && (
                  <div className="p-3 bg-[rgba(255,0,85,0.1)] border border-[#ff0055] rounded-lg">
                    <p className="text-sm text-[#ff0055]">{error}</p>
                  </div>
                )}

                <button
                  onClick={() => verifyAccess()}
                  disabled={verifying || !password}
                  className="w-full btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'Access File'}
                </button>
              </div>
            </div>
          )}

          {/* File Access */}
          {fileAccess && (
            <div>
              <div className="mb-4 p-4 bg-[rgba(0,255,136,0.1)] border border-[#00ff88] rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
                  <p className="text-white font-semibold">Access Granted</p>
                </div>
              </div>

              {fileAccess.allowDownload ? (
                <button
                  onClick={handleDownload}
                  className="w-full btn-neon py-4 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download File
                </button>
              ) : (
                <div className="p-4 bg-[rgba(255,255,255,0.05)] border border-gray-600 rounded-lg text-center">
                  <p className="text-gray-300">
                    Download is disabled for this file. You can only view it.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Powered by <span className="text-[#00d4ff] font-semibold">DocOpsCloud</span>
          </p>
        </div>
      </div>
    </div>
  )
}
