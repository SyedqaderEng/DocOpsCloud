'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import Link from 'next/link'
import {
  ArrowRight,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  Zap,
  Users,
} from 'lucide-react'

interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  total: number
}

interface AllQueueStats {
  pdf: QueueStats
  word: QueueStats
  excel: QueueStats
  image: QueueStats
  general: QueueStats
}

export default function QueueStatusPage() {
  const { user } = useAuth()
  const [queueStats, setQueueStats] = useState<AllQueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQueueStats()
    const interval = setInterval(fetchQueueStats, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchQueueStats = async () => {
    try {
      if (!user) return

      const idToken = await user.getIdToken()
      const res = await fetch('/api/queue/stats', {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch queue stats')
      }

      setQueueStats(data.data)
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const getQueueConfig = (name: string) => {
    const configs: Record<string, { color: string; icon: string; label: string }> = {
      pdf: { color: '#00d4ff', icon: '📄', label: 'PDF Processing' },
      word: { color: '#a855f7', icon: '📝', label: 'Word Processing' },
      excel: { color: '#00ff88', icon: '📊', label: 'Excel Processing' },
      image: { color: '#ff6b35', icon: '🖼️', label: 'Image Processing' },
      general: { color: '#ffd93d', icon: '⚡', label: 'General Processing' },
    }
    return configs[name] || configs.general
  }

  const calculateHealthScore = (stats: QueueStats): number => {
    const total = stats.completed + stats.failed
    if (total === 0) return 100
    return Math.round((stats.completed / total) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Loading queue statistics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalStats = queueStats
    ? {
        waiting: Object.values(queueStats).reduce((sum, q) => sum + q.waiting, 0),
        active: Object.values(queueStats).reduce((sum, q) => sum + q.active, 0),
        completed: Object.values(queueStats).reduce((sum, q) => sum + q.completed, 0),
        failed: Object.values(queueStats).reduce((sum, q) => sum + q.failed, 0),
      }
    : { waiting: 0, active: 0, completed: 0, failed: 0 }

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-10 h-10 text-[#00d4ff]" />
            <h1 className="text-4xl font-bold text-white">Queue Status</h1>
          </div>
          <p className="text-gray-300">Real-time processing queue monitoring</p>
        </div>

        {error && (
          <div className="glass-card border border-[#ff0055] mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-[#ff0055]" />
              <div>
                <p className="text-white font-semibold">Error Loading Queue Stats</p>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card border-2 border-yellow-500">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-500" />
              <span className="text-sm text-gray-400">Waiting</span>
            </div>
            <p className="text-4xl font-bold text-white">{totalStats.waiting}</p>
            <p className="text-xs text-gray-400 mt-1">Jobs in queue</p>
          </div>

          <div className="glass-card border-2 border-[#00d4ff]">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-[#00d4ff]" />
              <span className="text-sm text-gray-400">Processing</span>
            </div>
            <p className="text-4xl font-bold text-white">{totalStats.active}</p>
            <p className="text-xs text-gray-400 mt-1">Active jobs</p>
          </div>

          <div className="glass-card border-2 border-[#00ff88]">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-[#00ff88]" />
              <span className="text-sm text-gray-400">Completed</span>
            </div>
            <p className="text-4xl font-bold text-white">{totalStats.completed}</p>
            <p className="text-xs text-gray-400 mt-1">Successfully processed</p>
          </div>

          <div className="glass-card border-2 border-[#ff0055]">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-[#ff0055]" />
              <span className="text-sm text-gray-400">Failed</span>
            </div>
            <p className="text-4xl font-bold text-white">{totalStats.failed}</p>
            <p className="text-xs text-gray-400 mt-1">Processing errors</p>
          </div>
        </div>

        {/* Individual Queue Stats */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#00d4ff]" />
            Queue Breakdown
          </h2>

          {queueStats &&
            Object.entries(queueStats).map(([queueName, stats]) => {
              const config = getQueueConfig(queueName)
              const healthScore = calculateHealthScore(stats)
              const isHealthy = healthScore >= 80
              const total = stats.waiting + stats.active

              return (
                <div
                  key={queueName}
                  className="glass-card border-2"
                  style={{ borderColor: config.color }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)`,
                        }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{config.label}</h3>
                        <p className="text-sm text-gray-400">{queueName.toUpperCase()} Queue</p>
                      </div>
                    </div>

                    {/* Health Badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isHealthy ? 'bg-[#00ff88]' : 'bg-[#ff0055]'
                        } ${stats.active > 0 ? 'animate-pulse' : ''}`}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          isHealthy ? 'text-[#00ff88]' : 'text-[#ff0055]'
                        }`}
                      >
                        {healthScore}% Success
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {total > 0 && (
                    <div className="mb-4">
                      <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(stats.active / total) * 100}%`,
                            background: `linear-gradient(90deg, ${config.color}, ${config.color}80)`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {stats.active} processing / {total} total
                      </p>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-3">
                    <div className="glass-strong p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400 mb-1">Waiting</p>
                      <p className="text-lg font-bold text-yellow-500">{stats.waiting}</p>
                    </div>
                    <div className="glass-strong p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400 mb-1">Active</p>
                      <p className="text-lg font-bold text-[#00d4ff]">{stats.active}</p>
                    </div>
                    <div className="glass-strong p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400 mb-1">Completed</p>
                      <p className="text-lg font-bold text-[#00ff88]">{stats.completed}</p>
                    </div>
                    <div className="glass-strong p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400 mb-1">Failed</p>
                      <p className="text-lg font-bold text-[#ff0055]">{stats.failed}</p>
                    </div>
                    <div className="glass-strong p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-400 mb-1">Delayed</p>
                      <p className="text-lg font-bold text-gray-400">{stats.delayed}</p>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* System Status */}
        <div className="mt-8 glass-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-[#00ff88]" />
              <div>
                <h3 className="text-lg font-bold text-white">System Status</h3>
                <p className="text-sm text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00ff88] rounded-full animate-pulse" />
              <span className="text-[#00ff88] font-semibold">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
