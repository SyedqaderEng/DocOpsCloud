'use client'

import { useState, useEffect } from 'react'

interface StreakData {
  current: number
  longest: number
  todayUsed: boolean
}

export default function StreakWidget() {
  const [streak, setStreak] = useState<StreakData>({ current: 0, longest: 0, todayUsed: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const todayStr = new Date().toISOString().split('T')[0]
          const todayUsage = data.data.charts.dailyUsage.find((d: any) => d.date === todayStr)
          setStreak({
            current: data.data.streak.current,
            longest: data.data.streak.longest,
            todayUsed: (todayUsage?.count || 0) > 0
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
  }

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date().getDay()

  return (
    <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm opacity-90">Current Streak</p>
            <p className="text-3xl font-bold">{streak.current} days</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">Best</p>
          <p className="text-lg font-semibold">{streak.longest}</p>
        </div>
      </div>

      <div className="flex justify-between bg-white/20 rounded-lg p-2">
        {daysOfWeek.map((day, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              i === today
                ? streak.todayUsed
                  ? 'bg-white text-orange-500'
                  : 'bg-white/40 border-2 border-white'
                : i < today
                  ? 'bg-white/60 text-orange-600'
                  : 'bg-white/20'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {!streak.todayUsed && (
        <p className="text-xs mt-2 text-center opacity-90">
          Use a tool today to keep your streak!
        </p>
      )}
    </div>
  )
}
