'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { ALL_TOOLS } from '@/lib/tools-data'
import { TIER_LIMITS } from '@/lib/config/constants'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import dynamic from 'next/dynamic'

const AnalyticsPanel = dynamic(() => import('@/components/dashboard/AnalyticsPanel'), { ssr: false })
const ActivityMonitor = dynamic(() => import('@/components/dashboard/ActivityMonitor'), { ssr: false })
const QuickTools = dynamic(() => import('@/components/dashboard/QuickTools'), { ssr: false })
const StreakWidget = dynamic(() => import('@/components/dashboard/StreakWidget'), { ssr: false })

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
  metadata?: Record<string, unknown>
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setActivity(data.recentActivity || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00d4ff] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    return null
  }

  // Get user tier info (default to FREE)
  const userTier = 'FREE'
  const tierLimits = TIER_LIMITS[userTier as keyof typeof TIER_LIMITS]

  return (
    <div className="flex h-screen gradient-animated overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 glass-strong border-r border-[rgba(255,255,255,0.1)] flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.1)]">
          <Link href="/" className="text-2xl font-extrabold text-white">
            Doc<span className="text-gradient">Ops</span>Cloud
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-5 overflow-y-auto">
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-3">Main</div>
            <NavItem icon="📊" label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <NavItem icon="📈" label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            <NavItem icon="🗂️" label="My Files" active={activeTab === 'files'} onClick={() => setActiveTab('files')} />
            <NavItem icon="⚙️" label="Jobs" active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} />
            <NavItem icon="🛠️" label="All Tools" active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} />
          </div>

          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-3">Quick Access</div>
            <NavItem icon="📄" label="PDF Tools" href="/tools/pdf-merge" />
            <NavItem icon="📝" label="Word Tools" href="/tools/word-to-pdf" />
            <NavItem icon="📊" label="Excel Tools" href="/tools/excel-to-csv" />
            <NavItem icon="🔧" label="Utility Tools" href="/tools/text-analyzer" />
            <NavItem icon="🖼️" label="Image Tools" href="/tools/image-resize" />
          </div>

          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-3">Account</div>
            <NavItem icon="⚙️" label="Settings" href="/settings" />
            <NavItem icon="💳" label="Pricing" href="/pricing" />
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-5 border-t border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3 p-3 glass-strong border border-[rgba(0,212,255,0.3)] rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded-full flex items-center justify-center text-lg text-white font-bold">
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-white truncate">{user.displayName || 'User'}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition" title="Sign out">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="glass-strong border-b border-[rgba(255,255,255,0.1)] px-8 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input type="search" placeholder="Search files, jobs..." className="w-full pl-10 pr-4 py-2 glass-strong border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]" />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 glass hover:glass-strong rounded-lg transition">
              <span className="text-xl">🔔</span>
            </button>
            <Link href="/tools/pdf-merge" className="btn-neon px-4 py-2">+ New Job</Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && <OverviewTab stats={stats} activity={activity} loading={loading} userTier={userTier} tierLimits={tierLimits} />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'files' && <FilesTab />}
          {activeTab === 'jobs' && <JobsTab />}
          {activeTab === 'tools' && <ToolsTab />}
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, onClick, href }: { icon: string; label: string; active?: boolean; onClick?: () => void; href?: string }) {
  const className = `sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition ${
    active ? 'active glass-strong border border-[#00d4ff]' : 'hover:glass'
  }`

  if (href) {
    return <Link href={href} className={className}><span className="text-lg">{icon}</span>{label}</Link>
  }

  return <button onClick={onClick} className={className + ' w-full text-left'}><span className="text-lg">{icon}</span>{label}</button>
}

function OverviewTab({ stats, activity, loading, userTier, tierLimits }: { stats: DashboardStats | null; activity: Activity[]; loading: boolean; userTier: string; tierLimits: typeof TIER_LIMITS.FREE }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
      </div>
    )
  }

  const usagePercentage = tierLimits.operations_per_month === -1 ? 0 : ((stats?.usageThisMonth || 0) / tierLimits.operations_per_month) * 100

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Welcome back! 👋</h1>
      <p className="text-gray-300 mb-8">Here&apos;s what&apos;s happening with your documents</p>

      {userTier === 'FREE' && (
        <div className="mb-6 glass-strong border-2 border-[#00d4ff] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white mb-1">Free Plan</h3>
              <p className="text-sm text-gray-300">{stats?.usageThisMonth || 0} of {tierLimits.operations_per_month} operations used</p>
            </div>
            <Link href="/pricing" className="btn-neon px-6 py-2">Upgrade to Pro</Link>
          </div>
          <div className="w-full glass rounded-full h-2">
            <div className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] h-2 rounded-full transition-all" style={{ width: `${Math.min(usagePercentage, 100)}%` }} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="📄" label="Total Files" value={String(stats?.totalFiles || 0)} />
        <StatCard icon="⚡" label="Jobs This Month" value={String(stats?.jobsThisMonth || 0)} />
        <StatCard icon="✅" label="Completed" value={String(stats?.completedJobs || 0)} />
        <StatCard icon="⏳" label="Processing" value={String(stats?.processingJobs || 0)} />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <ActionCard icon="📄" title="Merge PDFs" href="/tools/pdf-merge" />
          <ActionCard icon="✂️" title="Split PDF" href="/tools/pdf-split" />
          <ActionCard icon="📝" title="DOCX to PDF" href="/tools/word-to-pdf" />
          <ActionCard icon="🗜️" title="Compress PDF" href="/tools/pdf-compress" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="glass-card">
          {activity.length > 0 ? (
            activity.map((item) => (
              <ActivityItem key={item.id} status={item.status as 'completed' | 'processing' | 'failed'} title={item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} description="Processing complete" time={new Date(item.createdAt).toLocaleDateString()} />
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🚀</div>
              <p>No recent activity. Start processing your first document!</p>
              <Link href="/tools" className="btn-neon inline-block mt-4 px-6 py-2">Browse Tools</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilesTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">My Files</h1>
      <div className="glass-card text-center py-12">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-bold text-white mb-2">No files yet</h3>
        <p className="text-gray-300 mb-6">Upload your first file to get started</p>
        <Link href="/tools" className="btn-neon px-6 py-3">Browse Tools</Link>
      </div>
    </div>
  )
}

function JobsTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Processing Jobs</h1>
      <div className="glass-card text-center py-12">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-xl font-bold text-white mb-2">No active jobs</h3>
        <p className="text-gray-300 mb-6">Your processing jobs will appear here</p>
        <Link href="/tools" className="btn-neon px-6 py-3">Start a Job</Link>
      </div>
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Analytics & Progress</h1>
      <p className="text-gray-300 mb-8">Track your productivity, achievements, and usage patterns</p>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <StreakWidget />
        </div>
        <QuickTools />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsPanel />
        </div>
        <div className="space-y-6">
          <ActivityMonitor />
        </div>
      </div>
    </div>
  )
}

function ToolsTab() {
  const toolCategories = [
    { id: 'pdf', data: ALL_TOOLS.pdf },
    { id: 'word', data: ALL_TOOLS.word },
    { id: 'excel', data: ALL_TOOLS.excel },
    { id: 'utility', data: ALL_TOOLS.utility },
    { id: 'image', data: ALL_TOOLS.image },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">All Tools</h1>
        <p className="text-gray-300">Browse and access all 145+ document processing tools</p>
      </div>
      <div className="space-y-8">
        {toolCategories.map((category) => (
          <div key={category.id}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{category.data.icon}</span>
              <div>
                <h3 className="text-2xl font-bold text-white">{category.data.name}</h3>
                <p className="text-sm text-gray-300">{category.data.count} tools available</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.data.tools.slice(0, 8).map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.id}`} className="group glass-card hover:border-[#00d4ff]">
                  <div className="text-3xl mb-3">{tool.icon}</div>
                  <h4 className="font-semibold text-white group-hover:text-[#00d4ff] transition mb-1">{tool.name}</h4>
                  <p className="text-sm text-gray-400 line-clamp-2">{tool.description}</p>
                </Link>
              ))}
            </div>
            <Link href="/tools" className="inline-block mt-4 text-[#00d4ff] hover:underline text-sm">View all {category.data.name} →</Link>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="glass-card hover:border-[#00d4ff]">
      <div className="flex items-start justify-between mb-4"><span className="text-3xl">{icon}</span></div>
      <div className="text-3xl font-bold text-gradient mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

function ActionCard({ icon, title, href }: { icon: string; title: string; href: string }) {
  return (
    <Link href={href} className="glass-card text-center group hover:border-[#00d4ff]">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-white group-hover:text-[#00d4ff] transition">{title}</div>
    </Link>
  )
}

function ActivityItem({ status, title, description, time }: { status: 'completed' | 'processing' | 'failed'; title: string; description: string; time: string }) {
  const statusColors = { completed: 'bg-[#00ff88]', processing: 'bg-[#00d4ff]', failed: 'bg-[#ff0055]' }
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[rgba(255,255,255,0.05)] last:border-0">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <div className="flex-1">
        <div className="font-semibold text-white mb-0.5">{title}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
      <div className="text-sm text-gray-500">{time}</div>
    </div>
  )
}
