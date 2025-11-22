'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import Link from 'next/link'
import {
  Share2,
  GitBranch,
  Activity,
  TrendingUp,
  Eye,
  Download,
  Clock,
  FileText,
  ArrowRight,
  ExternalLink,
  Trash2,
  BarChart3,
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
  }
  settings: {
    hasPassword: boolean
    maxViews: number | null
    allowDownload: boolean
  }
  stats: {
    currentViews: number
    viewsRemaining: number | null
  }
  status: {
    isActive: boolean
    isExpired: boolean
    isExpiringSoon: boolean
  }
  createdAt: string
  expiresAt: string
}

export default function ManagementDashboard() {
  const { user } = useAuth()
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalShares: 0,
    activeShares: 0,
    totalViews: 0,
    expiringShares: 0,
  })

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
        setStats({
          totalShares: data.data.summary.totalShares,
          activeShares: data.data.summary.activeShares,
          totalViews: data.data.summary.totalViews,
          expiringShares: data.data.shareLinks.filter((s: ShareLink) => s.status.isExpiringSoon)
            .length,
        })
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
    alert('Link copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Management Dashboard</h1>
          <p className="text-gray-300">Manage your shares, versions, and monitor activity</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card border-2 border-[#00d4ff]">
            <div className="flex items-center gap-3 mb-2">
              <Share2 className="w-6 h-6 text-[#00d4ff]" />
              <span className="text-sm text-gray-400">Total Shares</span>
            </div>
            <p className="text-4xl font-bold text-white">{stats.totalShares}</p>
          </div>

          <div className="glass-card border-2 border-[#00ff88]">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-[#00ff88]" />
              <span className="text-sm text-gray-400">Active Shares</span>
            </div>
            <p className="text-4xl font-bold text-white">{stats.activeShares}</p>
          </div>

          <div className="glass-card border-2 border-[#a855f7]">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-6 h-6 text-[#a855f7]" />
              <span className="text-sm text-gray-400">Total Views</span>
            </div>
            <p className="text-4xl font-bold text-white">{stats.totalViews}</p>
          </div>

          <div className="glass-card border-2 border-yellow-500">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-500" />
              <span className="text-sm text-gray-400">Expiring Soon</span>
            </div>
            <p className="text-4xl font-bold text-white">{stats.expiringShares}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/queue"
            className="glass-card border-2 border-transparent hover:border-[#00d4ff] transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Queue Status</h3>
                  <p className="text-sm text-gray-400">Monitor processing</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#00d4ff] transition" />
            </div>
          </Link>

          <Link
            href="/history"
            className="glass-card border-2 border-transparent hover:border-[#00d4ff] transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#a855f7] to-[#ff6b35] rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">History</h3>
                  <p className="text-sm text-gray-400">View past jobs</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#00d4ff] transition" />
            </div>
          </Link>

          <Link
            href="/search"
            className="glass-card border-2 border-transparent hover:border-[#00d4ff] transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Search Files</h3>
                  <p className="text-sm text-gray-400">Advanced search</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#00d4ff] transition" />
            </div>
          </Link>
        </div>

        {/* Share Links Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Share2 className="w-6 h-6 text-[#00d4ff]" />
              Active Share Links
            </h2>
            <Link href="/shares" className="text-[#00d4ff] hover:text-[#00e5ff] transition text-sm font-semibold">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="glass-card text-center py-12">
              <div className="w-12 h-12 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300">Loading share links...</p>
            </div>
          ) : shareLinks.length === 0 ? (
            <div className="glass-card text-center py-12">
              <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Share Links Yet</h3>
              <p className="text-gray-400 mb-4">Create shareable links for your processed files</p>
              <Link href="/dashboard" className="btn-neon px-6 py-3 inline-block">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {shareLinks.slice(0, 5).map((share) => (
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <h3 className="text-white font-semibold truncate">{share.file.name}</h3>
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
                        {share.status.isExpiringSoon && (
                          <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full font-semibold">
                            Expiring Soon
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Eye className="w-3 h-3" />
                          <span>
                            {share.stats.currentViews}
                            {share.settings.maxViews ? ` / ${share.settings.maxViews}` : ''} views
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>Expires {formatDate(share.expiresAt)}</span>
                        </div>
                        {share.settings.hasPassword && (
                          <div className="flex items-center gap-1 text-[#00d4ff]">
                            🔒 Password Protected
                          </div>
                        )}
                        {!share.settings.allowDownload && (
                          <div className="flex items-center gap-1 text-yellow-500">
                            Download Disabled
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(share.shareUrl)}
                        className="px-3 py-2 glass-strong hover:bg-[rgba(0,212,255,0.1)] rounded-lg text-sm font-semibold text-white transition"
                        title="Copy Link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteShare(share.shareId)}
                        className="px-3 py-2 glass-strong hover:bg-[rgba(255,0,85,0.1)] rounded-lg text-sm font-semibold text-[#ff0055] transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {shareLinks.length > 5 && (
                <Link
                  href="/shares"
                  className="block text-center glass-strong p-4 rounded-lg text-[#00d4ff] hover:bg-[rgba(0,212,255,0.1)] transition font-semibold"
                >
                  View All {shareLinks.length} Share Links →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
