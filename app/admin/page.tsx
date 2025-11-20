'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  FileText,
  Activity,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    totalRevenue: 0,
    storageUsed: 0,
    jobsToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    // Check if user is admin (you'd implement proper admin check)
    if (session?.user?.email !== 'admin@docopscloud.com') {
      router.push('/dashboard')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform overview and management</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            color="purple"
            trend="+12%"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubscriptions.toLocaleString()}
            icon={DollarSign}
            color="green"
            trend="+8%"
          />
          <StatCard
            title="Jobs Today"
            value={stats.jobsToday.toLocaleString()}
            icon={Activity}
            color="blue"
            trend="+23%"
          />
          <StatCard
            title="Total Revenue"
            value={`$${(stats.totalRevenue / 100).toLocaleString()}`}
            icon={TrendingUp}
            color="emerald"
            trend="+15%"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Job Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Job Statistics</CardTitle>
              <CardDescription>Processing job overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <JobStatRow
                  label="Total Jobs"
                  value={stats.totalJobs}
                  icon={FileText}
                  color="gray"
                />
                <JobStatRow
                  label="Completed"
                  value={stats.completedJobs}
                  icon={CheckCircle2}
                  color="green"
                />
                <JobStatRow
                  label="Failed"
                  value={stats.failedJobs}
                  icon={XCircle}
                  color="red"
                />
                <JobStatRow
                  label="Success Rate"
                  value={`${((stats.completedJobs / stats.totalJobs) * 100 || 0).toFixed(1)}%`}
                  icon={Activity}
                  color="blue"
                />
              </div>
            </CardContent>
          </Card>

          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Overview</CardTitle>
              <CardDescription>Platform storage utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Total Storage Used</span>
                    <span className="font-semibold">
                      {(stats.storageUsed / 1024 / 1024 / 1024).toFixed(2)} GB
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                      style={{ width: '45%' }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Avg File Size</p>
                    <p className="text-2xl font-bold text-gray-900">2.3 MB</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Files Today</p>
                    <p className="text-2xl font-bold text-gray-900">847</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                type="subscription"
                message="New Pro subscription"
                user="john@example.com"
                time="5 minutes ago"
              />
              <ActivityItem
                type="job"
                message="PDF merge completed"
                user="sarah@example.com"
                time="12 minutes ago"
              />
              <ActivityItem
                type="user"
                message="New user registration"
                user="mike@example.com"
                time="25 minutes ago"
              />
              <ActivityItem
                type="subscription"
                message="Business plan upgrade"
                user="tech@company.com"
                time="1 hour ago"
              />
              <ActivityItem
                type="job"
                message="Image batch processing"
                user="design@agency.com"
                time="2 hours ago"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string
  value: string
  icon: any
  color: string
  trend: string
}) {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-green-600">{trend}</span>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function JobStatRow({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: any
  color: string
}) {
  const colorClasses: Record<string, string> = {
    gray: 'text-gray-600',
    green: 'text-green-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
        <span className="text-gray-700">{label}</span>
      </div>
      <span className="text-lg font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function ActivityItem({
  type,
  message,
  user,
  time,
}: {
  type: string
  message: string
  user: string
  time: string
}) {
  const typeColors: Record<string, string> = {
    subscription: 'bg-green-100 text-green-600',
    job: 'bg-blue-100 text-blue-600',
    user: 'bg-purple-100 text-purple-600',
  }

  const typeIcons: Record<string, string> = {
    subscription: '💳',
    job: '⚙️',
    user: '👤',
  }

  return (
    <div className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${typeColors[type]}`}>
        {typeIcons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{message}</p>
        <p className="text-sm text-gray-600 truncate">{user}</p>
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">{time}</span>
    </div>
  )
}
