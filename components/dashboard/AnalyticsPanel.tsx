'use client'

import { useState, useEffect } from 'react'
import { RARITY_COLORS } from '@/lib/gamification/achievements'

interface AnalyticsData {
  overview: {
    totalFiles: number
    storageUsedMB: number
    productivityScore: number
    memberSinceDays: number
  }
  level: {
    current: number
    xp: number
    nextLevelXp: number
    totalXp: number
  }
  streak: {
    current: number
    longest: number
  }
  charts: {
    dailyUsage: Array<{ date: string; count: number }>
    toolUsage: Array<{ tool: string; count: number }>
  }
  achievements: {
    unlocked: Array<{
      id: string
      name: string
      icon: string
      rarity: string
    }>
    total: number
  }
  recentActivity: Array<{
    id: string
    tool: string
    status: string
    date: string
  }>
}

export default function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/analytics')
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (!data) return null

  const maxDailyUsage = Math.max(...data.charts.dailyUsage.map(d => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Level & XP Progress */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-80">Your Level</p>
            <p className="text-4xl font-bold">{data.level.current}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Total XP</p>
            <p className="text-2xl font-semibold">{data.level.totalXp.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${(data.level.xp / data.level.nextLevelXp) * 100}%` }}
          />
        </div>
        <p className="text-sm mt-2 opacity-80">
          {data.level.xp} / {data.level.nextLevelXp} XP to Level {data.level.current + 1}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Productivity Score"
          value={data.overview.productivityScore}
          suffix="/100"
          icon="chart-up"
          color="green"
        />
        <StatCard
          title="Current Streak"
          value={data.streak.current}
          suffix=" days"
          icon="fire"
          color="orange"
        />
        <StatCard
          title="Files Processed"
          value={data.overview.totalFiles}
          icon="folder"
          color="blue"
        />
        <StatCard
          title="Storage Used"
          value={data.overview.storageUsedMB}
          suffix=" MB"
          icon="database"
          color="purple"
        />
      </div>

      {/* Activity Chart */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Activity (Last 30 Days)</h3>
        <div className="flex items-end gap-1 h-32">
          {data.charts.dailyUsage.map((day, i) => (
            <div
              key={day.date}
              className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer group relative"
              style={{ height: `${(day.count / maxDailyUsage) * 100}%`, minHeight: day.count > 0 ? '4px' : '0' }}
            >
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                {day.date}: {day.count} files
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Achievements</h3>
          <span className="text-sm text-gray-500">
            {data.achievements.unlocked.length} / {data.achievements.total}
          </span>
        </div>
        {data.achievements.unlocked.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.achievements.unlocked.slice(0, 8).map(achievement => (
              <div
                key={achievement.id}
                className="p-3 rounded-lg border-2 text-center"
                style={{ borderColor: RARITY_COLORS[achievement.rarity as keyof typeof RARITY_COLORS] }}
              >
                <span className="text-2xl">{achievement.icon}</span>
                <p className="text-sm font-medium mt-1">{achievement.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Start processing files to unlock achievements!
          </p>
        )}
      </div>

      {/* Top Tools */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Most Used Tools</h3>
        <div className="space-y-3">
          {data.charts.toolUsage.slice(0, 5).map((tool, i) => (
            <div key={tool.tool} className="flex items-center gap-3">
              <span className="text-gray-500 w-6">{i + 1}.</span>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{tool.tool.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  <span className="text-gray-500">{tool.count} uses</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 rounded-full h-2"
                    style={{ width: `${(tool.count / (data.charts.toolUsage[0]?.count || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, suffix, icon, color }: {
  title: string
  value: number
  suffix?: string
  icon: string
  color: string
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  const icons = {
    'chart-up': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    fire: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>
    ),
    folder: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    database: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    )
  }

  return (
    <div className={`rounded-xl p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icons[icon as keyof typeof icons]}
        <span className="text-xs font-medium opacity-80">{title}</span>
      </div>
      <p className="text-2xl font-bold">
        {value.toLocaleString()}{suffix}
      </p>
    </div>
  )
}
