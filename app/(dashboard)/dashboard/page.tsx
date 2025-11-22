'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { ALL_TOOLS, getAllToolsFlat } from '@/lib/tools-data'
import { TOOL_CATEGORIES, TIER_LIMITS } from '@/lib/config/constants'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  LogOut,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Bell,
  Clock,
  FileText,
  Zap,
  TrendingUp,
  Award,
  Settings,
  CreditCard,
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string | null
  subscription_tier: 'FREE' | 'PRO' | 'BUSINESS'
  subscription_status: string
  subscription_expires_at: string | null
}

interface UsageStats {
  dailyUsage: number
  monthlyUsage: number
  dailyLimit: number
  monthlyLimit: number
  tier: string
}

interface Activity {
  id: string
  type: string
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const searchRef = useRef<HTMLDivElement>(null)
  const allTools = getAllToolsFlat()

  // Filter tools based on search
  const filteredTools = searchQuery.length > 1
    ? allTools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : []

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchUserData()
      fetchActivity()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const idToken = await user?.getIdToken()
      if (!idToken) return

      // Fetch user profile
      const profileRes = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      })
      if (profileRes.ok) {
        const { user: profile } = await profileRes.json()
        setUserProfile(profile)
      }

      // Fetch usage stats
      const usageRes = await fetch('/api/user/usage', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      })
      if (usageRes.ok) {
        const { usage } = await usageRes.json()
        setUsageStats(usage)
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivity = async () => {
    try {
      const idToken = await user?.getIdToken()
      const headers: HeadersInit = {}
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`
      }

      const response = await fetch('/api/dashboard/stats', { headers })
      if (response.ok) {
        const data = await response.json()
        setActivity(data.recentActivity || [])
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const userTier = userProfile?.subscription_tier || 'FREE'
  const dailyUsage = usageStats?.dailyUsage || 0
  const monthlyUsage = usageStats?.monthlyUsage || 0
  const dailyLimit = usageStats?.dailyLimit || 5
  const monthlyLimit = usageStats?.monthlyLimit || 150
  const usagePercentage = monthlyLimit === -1 ? 0 : (monthlyUsage / monthlyLimit) * 100

  return (
    <div className="flex h-screen gradient-animated overflow-hidden">
      {/* LEFT SIDEBAR - Tool Categories */}
      <aside className="w-72 glass-strong border-r border-slate-200 flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="p-5 border-b border-slate-200">
          <Link href="/" className="text-2xl font-extrabold text-slate-900">
            Doc<span className="text-gradient">Ops</span>Cloud
          </Link>
        </div>

        {/* Tool Categories */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-bold text-slate-500 uppercase mb-3 px-2">Tool Categories</div>

          {TOOL_CATEGORIES.map((category) => {
            const isCollapsed = collapsedCategories.includes(category.id)
            const categoryTools = ALL_TOOLS[category.id as keyof typeof ALL_TOOLS]?.tools || []

            return (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <div className="text-slate-900 font-semibold text-sm">{category.name}</div>
                      <div className="text-xs text-slate-500">{categoryTools.length} tools</div>
                    </div>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="ml-4 mt-1 space-y-1">
                    {categoryTools.slice(0, 5).map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/dashboard/tools/${tool.id}`}
                        className="block p-2 pl-10 rounded text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition"
                      >
                        {tool.name}
                      </Link>
                    ))}
                    {categoryTools.length > 5 && (
                      <Link
                        href="#"
                        className="block p-2 pl-10 rounded text-xs text-blue-600 hover:underline"
                      >
                        View all {categoryTools.length} →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 glass-card border-blue-200">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{user.displayName || 'User'}</div>
              <div className="text-xs text-slate-500">{userTier}</div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-slate-100 rounded transition" title="Logout">
              <LogOut className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="glass-strong border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-xl" ref={searchRef}>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  className="input-glass w-full pl-10"
                />
                <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>

                {searchOpen && filteredTools.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-blue-200 rounded-xl overflow-hidden shadow-2xl z-50">
                    {filteredTools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/dashboard/tools/${tool.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition border-b border-slate-100 last:border-0"
                        onClick={() => setSearchOpen(false)}
                      >
                        <span className="text-2xl">{tool.icon}</span>
                        <div className="flex-1">
                          <div className="text-slate-900 font-semibold text-sm">{tool.name}</div>
                          <div className="text-slate-600 text-xs">{tool.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 ml-6">
              <Link href="/pricing" className="flex items-center gap-2 px-4 py-2 glass hover:glass-strong rounded-lg transition text-sm text-slate-900">
                <CreditCard className="w-4 h-4" />
                Pricing
              </Link>
              <Link href="/settings" className="flex items-center gap-2 px-4 py-2 glass hover:glass-strong rounded-lg transition text-sm text-slate-900">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Welcome & Usage Banner */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, {user.displayName || 'User'}! 👋</h1>
            <p className="text-slate-600">Ready to process your documents?</p>
          </div>

          {/* Usage Stats for FREE tier */}
          {userTier === 'FREE' && (
            <div className="mb-6 glass-card border-2 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Free Plan - Daily Limit</h3>
                  <p className="text-sm text-slate-600">
                    Today: <span className="text-slate-900 font-semibold">{dailyUsage} / {dailyLimit}</span> operations
                    <span className="mx-2">•</span>
                    This month: <span className="text-slate-900 font-semibold">{monthlyUsage} / {monthlyLimit}</span> operations
                  </p>
                </div>
                <Link href="/pricing" className="btn-neon px-6 py-2">
                  Upgrade to Pro
                </Link>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 transition-all duration-500"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              {usagePercentage > 80 && (
                <div className="mt-3 text-sm text-yellow-600 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  You're running low on operations! Upgrade for unlimited access.
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card hover:border-blue-500 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{monthlyUsage}</div>
                  <div className="text-sm text-slate-500">Operations This Month</div>
                </div>
              </div>
            </div>

            <div className="glass-card hover:border-blue-500 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{dailyLimit - dailyUsage}</div>
                  <div className="text-sm text-slate-500">Remaining Today</div>
                </div>
              </div>
            </div>

            <div className="glass-card hover:border-blue-500 group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gradient">{userTier}</div>
                  <div className="text-sm text-slate-500">Current Plan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Tools */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Popular Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTools.slice(0, 6).map((tool) => (
                <Link
                  key={tool.id}
                  href={`/dashboard/tools/${tool.id}`}
                  className="glass-card hover:border-blue-500 group"
                >
                  <span className="text-4xl mb-3 block">{tool.icon}</span>
                  <h3 className="text-slate-900 font-semibold mb-1 group-hover:text-blue-600 transition">{tool.name}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT MINI PANEL - Notifications & Activity */}
      <aside className="w-80 glass-strong border-l border-[rgba(255,255,255,0.2)] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.2)]">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recent Activity
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="glass p-3 rounded-lg border border-[rgba(255,255,255,0.1)]">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.status === 'completed' ? 'bg-[#00ff88]' :
                      item.status === 'processing' ? 'bg-[#00d4ff]' :
                      'bg-[#ff0055]'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium mb-1">
                        {item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Your processed documents will appear here</p>
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {userTier === 'FREE' && (
          <div className="p-4 border-t border-[rgba(255,255,255,0.2)]">
            <div className="glass-card bg-gradient-to-br from-[rgba(0,212,255,0.1)] to-[rgba(168,85,247,0.1)] border-[rgba(0,212,255,0.3)]">
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-bold text-white mb-2">Upgrade to Pro</h4>
                <p className="text-xs text-gray-300 mb-3">
                  Get 1000 operations/month and priority processing
                </p>
                <Link href="/pricing" className="btn-neon w-full block text-center py-2">
                  See Plans
                </Link>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
