'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, CheckCircle2, XCircle, Clock, Zap, Activity } from 'lucide-react'

interface QueuePosition {
  jobId: string
  status: 'waiting' | 'processing'
  position: number
  estimatedWaitTimeMs: number
  queueStats: {
    waiting: number
    active: number
    completed: number
    failed: number
  }
  queue: string
  message: string
}

interface QueueVisualizationProps {
  jobId: string
  onStatusChange?: (status: string) => void
}

export default function QueueVisualization({ jobId, onStatusChange }: QueueVisualizationProps) {
  const [queueData, setQueueData] = useState<QueuePosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQueuePosition()
    const interval = setInterval(fetchQueuePosition, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [jobId])

  const fetchQueuePosition = async () => {
    try {
      setError(null)

      const res = await fetch(`/api/queue/position?jobId=${jobId}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch queue position')
      }

      setQueueData(data.data)

      // Notify parent of status change
      if (onStatusChange) {
        onStatusChange(data.data.status)
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const formatWaitTime = (ms: number): string => {
    if (ms === 0) return 'Processing now'

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `~${hours}h ${minutes % 60}m`
    if (minutes > 0) return `~${minutes}m ${seconds % 60}s`
    return `~${seconds}s`
  }

  const getQueueColor = (queue: string): string => {
    const colors: Record<string, string> = {
      'pdf-processing': '#00d4ff',
      'word-processing': '#a855f7',
      'excel-processing': '#00ff88',
      'image-processing': '#ff6b35',
      'general-processing': '#ffd93d',
    }
    return colors[queue] || '#00d4ff'
  }

  if (loading) {
    return (
      <div className="glass-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-white font-semibold">Checking queue position...</p>
            <p className="text-sm text-gray-400">Please wait</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !queueData) {
    return (
      <div className="glass-card border border-[#ff0055]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#ff0055] to-[#ff6b35] rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">Queue Status Unavailable</p>
            <p className="text-sm text-gray-400">{error || 'Unable to fetch queue data'}</p>
          </div>
        </div>
      </div>
    )
  }

  const queueColor = getQueueColor(queueData.queue)
  const totalJobs = queueData.queueStats.waiting + queueData.queueStats.active

  return (
    <div className="space-y-4">
      {/* Main Queue Status */}
      <div className="glass-card border-2" style={{ borderColor: queueColor }}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${queueColor}40, ${queueColor}20)`,
            }}
          >
            {queueData.status === 'processing' ? (
              <Zap className="w-8 h-8 animate-pulse" style={{ color: queueColor }} />
            ) : (
              <Clock className="w-8 h-8" style={{ color: queueColor }} />
            )}
          </div>

          {/* Status Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-1">
              {queueData.message}
            </h3>

            {queueData.status === 'processing' ? (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                <p className="text-sm text-[#00ff88] font-semibold">
                  Your job is currently being processed
                </p>
              </div>
            ) : queueData.position > 0 ? (
              <div className="space-y-2 mb-3">
                <p className="text-sm text-gray-300">
                  Queue: <span className="font-semibold" style={{ color: queueColor }}>
                    {queueData.queue.replace('-processing', '').toUpperCase()}
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      Position: <span className="font-bold text-white">#{queueData.position}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      ETA: <span className="font-bold text-white">
                        {formatWaitTime(queueData.estimatedWaitTimeMs)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Progress Bar */}
            {queueData.position > 0 && totalJobs > 0 && (
              <div className="space-y-1">
                <div className="h-2 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((totalJobs - queueData.position) / totalJobs) * 100}%`,
                      background: `linear-gradient(90deg, ${queueColor}, ${queueColor}80)`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {totalJobs - queueData.position} of {totalJobs} jobs ahead processed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Waiting */}
        <div className="glass-strong p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-gray-400">Waiting</span>
          </div>
          <p className="text-2xl font-bold text-white">{queueData.queueStats.waiting}</p>
        </div>

        {/* Active */}
        <div className="glass-strong p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[#00d4ff]" />
            <span className="text-xs text-gray-400">Processing</span>
          </div>
          <p className="text-2xl font-bold text-white">{queueData.queueStats.active}</p>
        </div>

        {/* Completed */}
        <div className="glass-strong p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
            <span className="text-xs text-gray-400">Completed</span>
          </div>
          <p className="text-2xl font-bold text-white">{queueData.queueStats.completed}</p>
        </div>

        {/* Failed */}
        <div className="glass-strong p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-[#ff0055]" />
            <span className="text-xs text-gray-400">Failed</span>
          </div>
          <p className="text-2xl font-bold text-white">{queueData.queueStats.failed}</p>
        </div>
      </div>

      {/* Queue Health Indicator */}
      <div className="glass-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00ff88]" />
            <span className="text-sm font-semibold text-white">Queue Health</span>
          </div>
          <div className="flex items-center gap-2">
            {queueData.queueStats.failed > queueData.queueStats.completed ? (
              <>
                <div className="w-2 h-2 bg-[#ff0055] rounded-full animate-pulse" />
                <span className="text-sm text-[#ff0055]">Degraded</span>
              </>
            ) : queueData.queueStats.active > 0 ? (
              <>
                <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
                <span className="text-sm text-[#00ff88]">Healthy</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-sm text-gray-400">Idle</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
