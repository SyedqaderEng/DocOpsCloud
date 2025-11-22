'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import Link from 'next/link'
import {
  Share2,
  ArrowRight,
  Eye,
  Download,
  Clock,
  FileText,
  ExternalLink,
  Trash2,
  Copy,
  Filter,
  AlertCircle,
} from 'lucide-react'

interface ShareLink {
  id: string
  shareId: string
  shareUrl: string
  file: {
    id: string
    name: string
    type: string
    size: number
    thumbnailUrl?: string
  }
  settings: {
    hasPassword: boolean
    maxViews: number | null
    allowDownload: boolean
  }
  stats: {
    currentViews: number
    viewsRemaining: number | null
    recentViews: Array<{
      viewedAt: string
      ipAddress?: string
      downloaded: boolean
    }>
  }
  status: {
    isActive: boolean
    isExpired: boolean
    isMaxViewsReached: boolean
    isExpiringSoon: boolean
  }
  createdAt: string
  expiresAt: string
}

export default function SharesPage() {
  const { user } = useAuth()
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all')

  useEffect(() => {
    fetchShareLinks()
  }, [])

  const fetchShareLinks = async () => {
    try {
      const idToken = await user?.getIdToken()
      const res = await fetch('/api/share/user', {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      const data = await res.json()

      if (res.ok) {
        setShareLinks(data.data.shareLinks)
      }

      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch share links:', err)
      setLoading(false)
    }
  }

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm('Delete this share link? This cannot be undone.')) {
      return
    }

    try {
      const idToken = await user?.getIdToken()
      await fetch(`/api/share/${shareId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })

      fetchShareLinks()
    } catch (err) {
      alert('Failed to delete share link')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Simple feedback - could be enhanced with a toast notification
    const button = event?.target as HTMLButtonElement
    const originalText = button.innerHTML
    button.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z"/></svg>'
    setTimeout(() => {
      button.innerHTML = originalText
    }, 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredShares = shareLinks.filter((share) => {
    if (filter === 'active') return share.status.isActive
    if (filter === 'expired') return share.status.isExpired
    return true
  })

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/manage"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Management
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-10 h-10 text-[#00d4ff]" />
            <h1 className="text-4xl font-bold text-white">Share Links</h1>
          </div>
          <p className="text-gray-300">Manage all your shareable file links</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
            }`}
          >
            All ({shareLinks.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'active'
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
            }`}
          >
            Active ({shareLinks.filter((s) => s.status.isActive).length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filter === 'expired'
                ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
            }`}
          >
            Expired ({shareLinks.filter((s) => s.status.isExpired).length})
          </button>
        </div>

        {/* Share Links List */}
        {loading ? (
          <div className="glass-card text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Loading share links...</p>
          </div>
        ) : filteredShares.length === 0 ? (
          <div className="glass-card text-center py-12">
            <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {filter === 'all' ? 'No Share Links Yet' : `No ${filter} share links`}
            </h3>
            <p className="text-gray-400 mb-4">
              {filter === 'all'
                ? 'Create shareable links for your processed files'
                : `You don't have any ${filter} share links`}
            </p>
            {filter === 'all' && (
              <Link href="/dashboard" className="btn-neon px-6 py-3 inline-block">
                Get Started
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredShares.map((share) => (
              <div
                key={share.id}
                className={`glass-card border-2 ${
                  share.status.isExpiringSoon
                    ? 'border-yellow-500'
                    : share.status.isActive
                    ? 'border-[#00ff88]'
                    : 'border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {share.file.thumbnailUrl && (
                    <img
                      src={share.file.thumbnailUrl}
                      alt={share.file.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                          {share.file.name}
                          {share.status.isActive && (
                            <span className="px-2 py-0.5 bg-[#00ff88] text-black text-xs rounded-full font-semibold">
                              Active
                            </span>
                          )}
                          {share.status.isExpired && (
                            <span className="px-2 py-0.5 bg-gray-600 text-white text-xs rounded-full font-semibold">
                              Expired
                            </span>
                          )}
                          {share.status.isExpiringSoon && !share.status.isExpired && (
                            <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full font-semibold">
                              Expiring Soon
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {share.file.type} • {formatFileSize(share.file.size)}
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                      <div className="glass-strong p-2 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Views</p>
                        <p className="text-white font-semibold flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {share.stats.currentViews}
                          {share.settings.maxViews && ` / ${share.settings.maxViews}`}
                        </p>
                      </div>

                      <div className="glass-strong p-2 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Created</p>
                        <p className="text-white font-semibold text-sm">
                          {new Date(share.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="glass-strong p-2 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Expires</p>
                        <p className="text-white font-semibold text-sm">
                          {new Date(share.expiresAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="glass-strong p-2 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Security</p>
                        <p className="text-white font-semibold text-sm">
                          {share.settings.hasPassword ? '🔒 Protected' : '🔓 Public'}
                        </p>
                      </div>

                      <div className="glass-strong p-2 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Download</p>
                        <p className="text-white font-semibold text-sm">
                          {share.settings.allowDownload ? '✅ Allowed' : '❌ Disabled'}
                        </p>
                      </div>
                    </div>

                    {/* Share URL */}
                    <div className="glass-strong p-3 rounded-lg mb-3">
                      <p className="text-xs text-gray-400 mb-1">Share URL:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm text-[#00d4ff] truncate">
                          {share.shareUrl}
                        </code>
                        <button
                          onClick={() => copyToClipboard(share.shareUrl)}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg text-sm font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <a
                        href={share.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg text-sm font-semibold transition flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Link
                      </a>
                      <button
                        onClick={() => handleDeleteShare(share.shareId)}
                        className="px-4 py-2 glass-strong hover:bg-[rgba(255,0,85,0.1)] text-[#ff0055] rounded-lg text-sm font-semibold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
