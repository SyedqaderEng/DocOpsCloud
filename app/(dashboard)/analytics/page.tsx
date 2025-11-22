'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import Link from 'next/link'
import {
  TrendingUp,
  ArrowRight,
  FileText,
  Activity,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  HardDrive,
  GitBranch,
  Calendar,
} from 'lucide-react'

interface AnalyticsData {
  period: string
  overview: {
    totalFiles: number
    totalJobs: number
    totalShares: number
    activeShares: number
    totalViews: number
    totalVersions: number
    successRate: number
    avgProcessingTime: number
  }
  jobsByStatus: Array<{ status: string; count: number }>
  filesByType: Array<{ type: string; count: number }>
  topOperations: Array<{ operation: string; count: number }>
  storage: {
    totalUsed: number
  }
  dailyActivity: Array<{ date: string; jobs: number; completed: number }>
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7days' | '30days' | '90days' | 'all'>('30days')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const idToken = await user?.getIdToken()

      const res = await fetch(`/api/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      const data = await res.json()

      if (res.ok) {
        setAnalytics(data.data)
      }

      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s`
  }

  const getOperationLabel = (op: string): string => {
    return op.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      PDF: '#00d4ff',
      DOCX: '#a855f7',
      XLSX: '#00ff88',
      CSV: '#ffd93d',
      IMAGE: '#ff6b35',
    }
    return colors[type] || '#ffffff'
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center p-6">
        <div className="glass-card border border-[#ff0055] max-w-md text-center">
          <XCircle className="w-16 h-16 text-[#ff0055] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Failed to Load Analytics</h2>
          <p className="text-gray-400 mb-4">Unable to fetch your analytics data</p>
          <button onClick={fetchAnalytics} className="btn-neon px-6 py-3">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-10 h-10 text-[#00d4ff]" />
            <h1 className="text-4xl font-bold text-white">Analytics & Insights</h1>
          </div>
          <p className="text-gray-300">Track your usage and performance metrics</p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-8">
          {(['7days', '30days', '90days', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                period === p
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                  : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
              }`}
            >
              {p === '7days'
                ? 'Last 7 Days'
                : p === '30days'
                ? 'Last 30 Days'
                : p === '90days'
                ? 'Last 90 Days'
                : 'All Time'}
            </button>
          ))}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card border-2 border-[#00d4ff]">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-[#00d4ff]" />
              <span className="text-sm text-gray-400">Total Files</span>
            </div>
            <p className="text-4xl font-bold text-white">{analytics.overview.totalFiles}</p>
            <p className="text-xs text-gray-400 mt-1">Files uploaded</p>
          </div>

          <div className="glass-card border-2 border-[#a855f7]">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-6 h-6 text-[#a855f7]" />
              <span className="text-sm text-gray-400">Total Jobs</span>
            </div>
            <p className="text-4xl font-bold text-white">{analytics.overview.totalJobs}</p>
            <p className="text-xs text-gray-400 mt-1">Processing operations</p>
          </div>

          <div className="glass-card border-2 border-[#00ff88]">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-[#00ff88]" />
              <span className="text-sm text-gray-400">Success Rate</span>
            </div>
            <p className="text-4xl font-bold text-white">{analytics.overview.successRate}%</p>
            <p className="text-xs text-gray-400 mt-1">Jobs completed successfully</p>
          </div>

          <div className="glass-card border-2 border-yellow-500">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-500" />
              <span className="text-sm text-gray-400">Avg Processing</span>
            </div>
            <p className="text-4xl font-bold text-white">
              {formatTime(analytics.overview.avgProcessingTime)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Per job</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#00d4ff]" />
                <span className="text-white font-semibold">Share Links</span>
              </div>
              <Link href="/shares" className="text-[#00d4ff] text-sm hover:underline">
                View →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-white">{analytics.overview.totalShares}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#00ff88]">
                  {analytics.overview.activeShares}
                </p>
                <p className="text-xs text-gray-400">Active</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Total Views: <span className="text-white font-semibold">{analytics.overview.totalViews}</span>
              </p>
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[#a855f7]" />
                <span className="text-white font-semibold">File Versions</span>
              </div>
            </div>
            <p className="text-4xl font-bold text-white mb-2">{analytics.overview.totalVersions}</p>
            <p className="text-sm text-gray-400">Version snapshots created</p>
          </div>

          <div className="glass-card">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="w-5 h-5 text-[#ffd93d]" />
              <span className="text-white font-semibold">Storage Used</span>
            </div>
            <p className="text-4xl font-bold text-white mb-2">
              {formatFileSize(analytics.storage.totalUsed)}
            </p>
            <p className="text-sm text-gray-400">Total file storage</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Jobs by Status */}
          <div className="glass-card">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-[#00d4ff]" />
              Jobs by Status
            </h3>
            <div className="space-y-3">
              {analytics.jobsByStatus.map((item) => {
                const total = analytics.overview.totalJobs
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0

                const colors: Record<string, string> = {
                  COMPLETE: '#00ff88',
                  FAILED: '#ff0055',
                  PROCESSING: '#00d4ff',
                  QUEUED: '#ffd93d',
                  CANCELED: '#gray-500',
                }

                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold">{item.status}</span>
                      <span className="text-gray-400">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-3 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: colors[item.status] || '#ffffff',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Files by Type */}
          <div className="glass-card">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#a855f7]" />
              Files by Type
            </h3>
            <div className="space-y-3">
              {analytics.filesByType.map((item) => {
                const total = analytics.overview.totalFiles
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0

                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-semibold">{item.type}</span>
                      <span className="text-gray-400">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-3 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: getTypeColor(item.type),
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Operations */}
        <div className="glass-card mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#ffd93d]" />
            Most Used Operations
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.topOperations.map((item, index) => (
              <div key={item.operation} className="glass-strong p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">
                    #{index + 1} {getOperationLabel(item.operation)}
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#00d4ff]">{item.count}</p>
                <p className="text-xs text-gray-400">times used</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Activity */}
        {analytics.dailyActivity.length > 0 && (
          <div className="glass-card">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#00ff88]" />
              Daily Activity
            </h3>
            <div className="space-y-2">
              {analytics.dailyActivity.slice(-14).map((day) => {
                const maxJobs = Math.max(...analytics.dailyActivity.map((d) => d.jobs))
                const barWidth = maxJobs > 0 ? (day.jobs / maxJobs) * 100 : 0

                return (
                  <div key={day.date}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">
                        {new Date(day.date).toLocaleDateString()}
                      </span>
                      <span className="text-white">
                        {day.jobs} jobs ({day.completed} completed)
                      </span>
                    </div>
                    <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
