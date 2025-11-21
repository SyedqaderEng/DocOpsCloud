'use client'

import { useState, useEffect } from 'react'

interface Activity {
  id: string
  type: 'job_started' | 'job_completed' | 'job_failed' | 'file_uploaded' | 'achievement'
  message: string
  tool?: string
  timestamp: Date
  status?: string
}

export default function ActivityMonitor() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        const data = await res.json()
        if (data.success && data.recentActivity) {
          setActivities(data.recentActivity.map((job: any) => ({
            id: job.id,
            type: job.status === 'COMPLETED' ? 'job_completed' :
                  job.status === 'FAILED' ? 'job_failed' : 'job_started',
            message: `${job.operationType.replace(/-/g, ' ')}`,
            tool: job.operationType,
            timestamp: new Date(job.createdAt),
            status: job.status
          })))
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error)
      }
    }

    fetchActivity()

    if (isLive) {
      const interval = setInterval(fetchActivity, 5000)
      return () => clearInterval(interval)
    }
  }, [isLive])

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500'
      case 'FAILED': return 'bg-red-500'
      case 'PROCESSING': return 'bg-yellow-500 animate-pulse'
      default: return 'bg-blue-500'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return '✓'
      case 'FAILED': return '✕'
      case 'PROCESSING': return '⟳'
      default: return '•'
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h3 className="font-semibold text-sm">Activity Monitor</h3>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`text-xs px-2 py-1 rounded ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
        >
          {isLive ? 'LIVE' : 'PAUSED'}
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Start processing files to see activity here</p>
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((activity, i) => (
              <div
                key={activity.id}
                className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
              >
                <div className={`w-6 h-6 rounded-full ${getStatusColor(activity.status)} flex items-center justify-center text-white text-xs`}>
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate capitalize">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.status?.toLowerCase()}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t">
        <a href="/dashboard?tab=jobs" className="text-xs text-indigo-600 hover:text-indigo-800">
          View all activity →
        </a>
      </div>
    </div>
  )
}
