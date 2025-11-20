'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ALL_TOOLS } from '@/lib/tools-data'
import { TIER_LIMITS } from '@/lib/config/constants'

interface DashboardStats {
  totalFiles: number
  jobsThisMonth: number
  completedJobs: number
  processingJobs: number
  storageUsed: string
  usageThisMonth: number
}

interface Activity {
  id: string
  type: string
  status: string
  createdAt: string
  completedAt?: string
  metadata?: any
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setActivity(data.recentActivity)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get user tier info
  const userTier = (session?.user as any)?.subscription_tier || 'FREE'
  const tierLimits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <Link href="/" className="text-2xl font-extrabold text-gray-900">
            Doc<span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Ops</span>Cloud
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-5 overflow-y-auto">
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-3">
              Main
            </div>
            <NavItem
              icon="📊"
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <NavItem
              icon="🗂️"
              label="My Files"
              active={activeTab === 'files'}
              onClick={() => setActiveTab('files')}
            />
            <NavItem
              icon="⚙️"
              label="Jobs"
              active={activeTab === 'jobs'}
              onClick={() => setActiveTab('jobs')}
            />
            <NavItem
              icon="🛠️"
              label="All Tools"
              active={activeTab === 'tools'}
              onClick={() => setActiveTab('tools')}
            />
          </div>

          <div className="mb-6">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-3">
              Quick Access
            </div>
            <NavItem icon="📄" label="PDF Tools" href="/tools/pdf/merge" />
            <NavItem icon="📝" label="Word Tools" href="/tools/word/convert" />
            <NavItem icon="📊" label="Excel Tools" href="/tools/excel" />
            <NavItem icon="🖼️" label="Image Tools" href="/tools/image" />
          </div>

          <div>
            <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-3">
              Account
            </div>
            <NavItem icon="⚙️" label="Settings" href="/settings" />
            <NavItem icon="💳" label="Billing" href="/billing" />
            <NavItem icon="📖" label="API Docs" href="/docs" />
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-5 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-lg text-white">
              {session?.user?.name?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900">{session?.user?.name || 'User'}</div>
              <div className={`text-xs font-medium ${
                userTier === 'BUSINESS' ? 'text-indigo-600' :
                userTier === 'PRO' ? 'text-purple-600' :
                'text-gray-600'
              }`}>{userTier === 'FREE' ? 'Free Plan' : userTier === 'PRO' ? 'Pro Plan' : 'Business Plan'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="search"
                placeholder="Search files, jobs..."
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-50 rounded-lg transition">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link href="/tools/pdf-merge" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
              + New Job
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {activeTab === 'overview' && <OverviewTab stats={stats} activity={activity} loading={loading} userTier={userTier} tierLimits={tierLimits} />}
          {activeTab === 'files' && <FilesTab />}
          {activeTab === 'jobs' && <JobsTab />}
          {activeTab === 'tools' && <ToolsTab />}
        </div>
      </main>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  href,
}: {
  icon: string
  label: string
  active?: boolean
  onClick?: () => void
  href?: string
}) {
  const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition ${
    active
      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`

  if (href) {
    return (
      <Link href={href} className={className}>
        <span className="text-lg">{icon}</span>
        {label}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={className + ' w-full text-left'}>
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  )
}

function OverviewTab({ stats, activity, loading, userTier, tierLimits }: {
  stats: DashboardStats | null
  activity: Activity[]
  loading: boolean
  userTier: string
  tierLimits: any
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  const usagePercentage = tierLimits.operations_per_month === -1
    ? 0
    : ((stats?.usageThisMonth || 0) / tierLimits.operations_per_month) * 100

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
      <p className="text-gray-600 mb-8">Here&apos;s what&apos;s happening with your documents</p>

      {/* Tier Usage Banner */}
      {userTier === 'FREE' && (
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Free Plan</h3>
              <p className="text-sm text-gray-600">
                {stats?.usageThisMonth || 0} of {tierLimits.operations_per_month} operations used this month
              </p>
            </div>
            <Link href="/pricing" className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-sm">
              Upgrade to Pro
            </Link>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="📄" label="Total Files" value={String(stats?.totalFiles || 0)} />
        <StatCard icon="⚡" label="Jobs This Month" value={String(stats?.jobsThisMonth || 0)} />
        <StatCard icon="✅" label="Completed" value={String(stats?.completedJobs || 0)} />
        <StatCard icon="⏳" label="Processing" value={String(stats?.processingJobs || 0)} />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <ActionCard icon="📄" title="Merge PDFs" href="/tools/pdf/merge" />
          <ActionCard icon="✂️" title="Split PDF" href="/tools/pdf/split" />
          <ActionCard icon="📝" title="DOCX to PDF" href="/tools/word/convert" />
          <ActionCard icon="🗜️" title="Compress PDF" href="/tools/pdf/compress" />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {activity.length > 0 ? (
            activity.map((item) => (
              <ActivityItem
                key={item.id}
                status={item.status as 'completed' | 'processing' | 'failed'}
                title={formatOperationType(item.type)}
                description={item.metadata?.description || 'Processing...'}
                time={formatTimeAgo(item.createdAt)}
              />
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🚀</div>
              <p>No recent activity. Start processing your first document!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatOperationType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function FilesTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Files</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No files yet</h3>
        <p className="text-gray-600 mb-6">Upload your first file to get started</p>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-sm">
          Upload File
        </button>
      </div>
    </div>
  )
}

function JobsTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Processing Jobs</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No active jobs</h3>
        <p className="text-gray-600">Your processing jobs will appear here</p>
      </div>
    </div>
  )
}

function ToolsTab() {
  const toolCategories = [
    { id: 'pdf', data: ALL_TOOLS.pdf },
    { id: 'word', data: ALL_TOOLS.word },
    { id: 'excel', data: ALL_TOOLS.excel },
    { id: 'image', data: ALL_TOOLS.image },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Tools</h1>
        <p className="text-gray-600">Browse and access all 120+ document processing tools</p>
      </div>

      <div className="space-y-8">
        {toolCategories.map((category) => (
          <div key={category.id}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{category.data.icon}</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{category.data.name}</h3>
                <p className="text-sm text-gray-600">{category.data.count} tools available</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.data.tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="text-3xl mb-3">{tool.icon}</div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition mb-1">
                    {tool.name}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

function ActionCard({ icon, title, href }: { icon: string; title: string; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-md transition text-center group"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition">{title}</div>
    </Link>
  )
}

function ActivityItem({
  status,
  title,
  description,
  time,
}: {
  status: 'completed' | 'processing' | 'failed'
  title: string
  description: string
  time: string
}) {
  const statusColors = {
    completed: 'bg-green-500',
    processing: 'bg-blue-500',
    failed: 'bg-red-500',
  }

  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-0.5">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <div className="text-sm text-gray-500">{time}</div>
    </div>
  )
}
