'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
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
  RefreshCw,
  Upload,
  Layers,
  History,
  Sparkles,
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
  const { data: session, status } = useSession()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [activity, setActivity] = useState<Activity[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [contentRefreshing, setContentRefreshing] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
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
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchUserData()
      fetchActivity()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      // Fetch user profile
      const profileRes = await fetch('/api/user/profile')
      if (profileRes.ok) {
        const { user: profile } = await profileRes.json()
        setUserProfile(profile)
      }

      // Fetch usage stats
      const usageRes = await fetch('/api/user/usage')
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
      const response = await fetch('/api/dashboard/stats')
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

  const handleCategorySelect = (categoryId: string) => {
    // Trigger refresh animation
    setContentRefreshing(true)

    // Update selected category
    setSelectedCategory(categoryId)

    // Expand the selected category automatically
    if (categoryId !== 'all') {
      setCollapsedCategories(prev => prev.filter(id => id !== categoryId))
    }

    // Scroll main content to top for better UX
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Remove refresh animation after a short delay
    setTimeout(() => setContentRefreshing(false), 300)
  }

  // Get tools based on selected category
  const getDisplayTools = () => {
    if (selectedCategory === 'all') {
      return allTools
    }
    const categoryData = ALL_TOOLS[selectedCategory as keyof typeof ALL_TOOLS]
    return categoryData?.tools || []
  }

  const displayTools = getDisplayTools()
  const selectedCategoryData = selectedCategory === 'all'
    ? { name: 'All Tools', icon: '📚', id: 'all' }
    : TOOL_CATEGORIES.find(cat => cat.id === selectedCategory)

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0ea5e9] animate-spin mx-auto mb-4" />
          <p className="text-[#f8fafc] text-lg font-semibold">Loading dashboard...</p>
          <p className="text-[#cbd5e1] text-sm mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const userTier = userProfile?.subscription_tier || 'FREE'
  const dailyUsage = usageStats?.dailyUsage || 0
  const monthlyUsage = usageStats?.monthlyUsage || 0
  const dailyLimit = usageStats?.dailyLimit || 5
  const monthlyLimit = usageStats?.monthlyLimit || 150
  const usagePercentage = monthlyLimit === -1 ? 0 : (monthlyUsage / monthlyLimit) * 100

  return (
    <div className="flex h-screen bg-[#080810] overflow-hidden">
      {/* LEFT SIDEBAR - Tool Categories */}
      <aside className="w-72 bg-[#0d0d15] border-r border-[rgba(255,255,255,0.1)] flex flex-col overflow-hidden shadow-2xl">
        {/* Logo */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.1)]">
          <Link href="/" className="text-2xl font-extrabold text-[#f8fafc]">
            Doc<span className="text-gradient-blue">Ops</span>Cloud
          </Link>
        </div>

        {/* Tool Categories */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-xs font-bold text-[#94a3b8] uppercase mb-3 px-2 tracking-wider">Tool Categories</div>

          {/* All Tools Option */}
          <div className="mb-3">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition text-left group ${
                selectedCategory === 'all'
                  ? 'bg-[rgba(14,165,233,0.15)] border-2 border-[rgba(14,165,233,0.5)] shadow-lg shadow-[rgba(14,165,233,0.2)]'
                  : 'hover:bg-[#18181f] border-2 border-transparent hover:border-[rgba(255,255,255,0.08)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <div>
                  <div className={`font-semibold text-sm ${selectedCategory === 'all' ? 'text-[#38bdf8]' : 'text-[#f8fafc]'}`}>
                    All Tools
                  </div>
                  <div className="text-xs text-[#94a3b8]">{allTools.length} tools</div>
                </div>
              </div>
              {selectedCategory === 'all' && (
                <div className="w-2 h-2 bg-[#0ea5e9] rounded-full animate-pulse shadow-lg shadow-[rgba(14,165,233,0.5)]" />
              )}
            </button>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.1)] pt-3 mb-3" />

          {TOOL_CATEGORIES.map((category) => {
            const isCollapsed = collapsedCategories.includes(category.id)
            const isSelected = selectedCategory === category.id
            const categoryTools = ALL_TOOLS[category.id as keyof typeof ALL_TOOLS]?.tools || []

            return (
              <div key={category.id} className="mb-2">
                <div className={`rounded-lg overflow-hidden border-2 transition ${
                  isSelected
                    ? 'border-[rgba(14,165,233,0.5)] bg-[rgba(14,165,233,0.1)] shadow-lg shadow-[rgba(14,165,233,0.15)]'
                    : 'border-transparent hover:border-[rgba(255,255,255,0.05)]'
                }`}>
                  <button
                    onClick={() => handleCategorySelect(category.id)}
                    className={`w-full flex items-center justify-between p-3 transition text-left group ${
                      !isSelected && 'hover:bg-[#18181f]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{category.icon}</span>
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${isSelected ? 'text-[#38bdf8]' : 'text-[#f8fafc]'}`}>
                          {category.name}
                        </div>
                        <div className="text-xs text-[#94a3b8]">{categoryTools.length} tools</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className="w-2 h-2 bg-[#0ea5e9] rounded-full animate-pulse shadow-lg shadow-[rgba(14,165,233,0.5)]" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleCategory(category.id)
                        }}
                        className="p-1 hover:bg-[rgba(255,255,255,0.08)] rounded transition"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-[#cbd5e1]" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-[#cbd5e1]" />
                        )}
                      </button>
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="px-4 pb-3 space-y-1 bg-[rgba(0,0,0,0.3)]">
                      {categoryTools.slice(0, 5).map((tool) => (
                        <Link
                          key={tool.id}
                          href={`/dashboard/tools/${tool.id}`}
                          className="block p-2 pl-10 rounded text-sm text-[#cbd5e1] hover:text-[#38bdf8] hover:bg-[rgba(14,165,233,0.1)] transition"
                        >
                          <span className="mr-2">{tool.icon}</span>
                          {tool.name}
                        </Link>
                      ))}
                      {categoryTools.length > 5 && (
                        <button
                          onClick={() => handleCategorySelect(category.id)}
                          className="block w-full p-2 pl-10 rounded text-xs text-[#0ea5e9] hover:underline text-left hover:bg-[rgba(14,165,233,0.08)] transition"
                        >
                          View all {categoryTools.length} →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center gap-3 p-3 glass-card border border-[rgba(14,165,233,0.3)]">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-[rgba(14,165,233,0.3)]">
              {session.user?.name?.charAt(0).toUpperCase() || session.user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#f8fafc] truncate">{session.user?.name || 'User'}</div>
              <div className="text-xs text-[#94a3b8]">{userTier}</div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-[rgba(239,68,68,0.1)] hover:text-[#f87171] rounded transition" title="Logout">
              <LogOut className="w-4 h-4 text-[#cbd5e1]" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#080810]">
        {/* Top Header */}
        <header className="bg-[#0d0d15] border-b border-[rgba(255,255,255,0.1)] px-6 py-4 shadow-lg">
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
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#12121a] border-2 border-[rgba(14,165,233,0.5)] rounded-xl overflow-hidden shadow-2xl z-50">
                    {filteredTools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/dashboard/tools/${tool.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(14,165,233,0.1)] transition border-b border-[rgba(255,255,255,0.08)] last:border-0"
                        onClick={() => setSearchOpen(false)}
                      >
                        <span className="text-2xl">{tool.icon}</span>
                        <div className="flex-1">
                          <div className="text-[#f8fafc] font-semibold text-sm">{tool.name}</div>
                          <div className="text-[#94a3b8] text-xs">{tool.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#0ea5e9]" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 ml-6">
              <Link href="/pricing" className="flex items-center gap-2 px-4 py-2 bg-[#18181f] hover:bg-[#1d1d25] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(14,165,233,0.5)] rounded-lg transition text-sm text-[#cbd5e1] hover:text-[#38bdf8]">
                <CreditCard className="w-4 h-4" />
                Pricing
              </Link>
              <Link href="/settings" className="flex items-center gap-2 px-4 py-2 bg-[#18181f] hover:bg-[#1d1d25] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(14,165,233,0.5)] rounded-lg transition text-sm text-[#cbd5e1] hover:text-[#38bdf8]">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div ref={mainContentRef} className="flex-1 overflow-y-auto p-6 bg-[#080810]">
          {/* Welcome & Usage Banner */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Welcome back, {session.user?.name || 'User'}! 👋</h1>
            <p className="text-[#cbd5e1]">Ready to process your documents?</p>
          </div>

          {/* Usage Stats for FREE tier */}
          {userTier === 'FREE' && (
            <div className="mb-6 glass-card border-2 border-[rgba(14,165,233,0.5)] shadow-lg shadow-[rgba(14,165,233,0.2)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#f8fafc] text-lg mb-1">Free Plan - Daily Limit</h3>
                  <p className="text-sm text-[#cbd5e1]">
                    Today: <span className="text-[#f8fafc] font-semibold">{dailyUsage} / {dailyLimit}</span> operations
                    <span className="mx-2">•</span>
                    This month: <span className="text-[#f8fafc] font-semibold">{monthlyUsage} / {monthlyLimit}</span> operations
                  </p>
                </div>
                <Link href="/pricing" className="btn-primary px-6 py-2">
                  Upgrade to Pro
                </Link>
              </div>
              <div className="w-full bg-[#0d0d15] rounded-full h-3 overflow-hidden border border-[rgba(255,255,255,0.1)]">
                <div
                  className="bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] h-3 transition-all duration-500 shadow-lg shadow-[rgba(14,165,233,0.5)]"
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              {usagePercentage > 80 && (
                <div className="mt-3 text-sm text-[#fbbf24] flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  You're running low on operations! Upgrade for unlimited access.
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Link
              href="/dashboard/workflow/upload"
              className="glass-card hover:border-[rgba(14,165,233,0.5)] group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] rounded-lg flex items-center justify-center shadow-lg shadow-[rgba(14,165,233,0.3)]">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-[#f8fafc] font-semibold mb-1 group-hover:text-[#38bdf8] transition">
                    Upload & Process
                  </div>
                  <div className="text-sm text-[#94a3b8]">
                    Upload first, then choose tool
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94a3b8] group-hover:text-[#0ea5e9] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              href="/dashboard/bulk"
              className="glass-card hover:border-[rgba(16,185,129,0.5)] group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#10b981] to-[#06b6d4] rounded-lg flex items-center justify-center shadow-lg shadow-[rgba(16,185,129,0.3)]">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-[#f8fafc] font-semibold mb-1 group-hover:text-[#34d399] transition">
                    Bulk Processing
                  </div>
                  <div className="text-sm text-[#94a3b8]">
                    Process multiple files at once
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94a3b8] group-hover:text-[#10b981] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>

            <Link
              href="/dashboard/history"
              className="glass-card hover:border-[rgba(139,92,246,0.5)] group transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] rounded-lg flex items-center justify-center shadow-lg shadow-[rgba(139,92,246,0.3)]">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-[#f8fafc] font-semibold mb-1 group-hover:text-[#a78bfa] transition">
                    Processing History
                  </div>
                  <div className="text-sm text-[#94a3b8]">
                    View past jobs and downloads
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#94a3b8] group-hover:text-[#8b5cf6] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </div>

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

          {/* Category Showcase */}
          <div className={`transition-opacity duration-300 ${contentRefreshing ? 'opacity-50' : 'opacity-100'}`}>
            {/* Category Header */}
            <div className="mb-6 glass-card border-2 border-[#00d4ff] transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded-xl flex items-center justify-center text-4xl shadow-lg shadow-[#00d4ff]/50">
                    {selectedCategoryData?.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">{selectedCategoryData?.name}</h2>
                      {contentRefreshing && (
                        <RefreshCw className="w-5 h-5 text-[#00d4ff] animate-spin" />
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      {displayTools.length} {displayTools.length === 1 ? 'tool' : 'tools'} available
                      {selectedCategory !== 'all' && ' in this category'}
                    </p>
                  </div>
                </div>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className="px-4 py-2 glass hover:glass-strong rounded-lg transition text-sm text-white flex items-center gap-2"
                  >
                    View All Categories
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Subcategories Pills - Show if specific category is selected */}
              {selectedCategory !== 'all' && selectedCategoryData && 'subcategories' in selectedCategoryData && (
                <div className="border-t border-[rgba(255,255,255,0.1)] pt-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Quick Filters</div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCategoryData as any).subcategories?.map((subcat: any, index: number) => (
                      <div
                        key={index}
                        className="px-3 py-1 glass-strong border border-[rgba(0,212,255,0.3)] rounded-full text-xs text-gray-300 hover:text-[#00d4ff] hover:border-[#00d4ff] transition cursor-pointer"
                      >
                        {subcat.name} ({subcat.tools?.length || 0})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tools Grid */}
            {displayTools.length > 0 ? (
              <div
                key={selectedCategory}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300"
              >
                {displayTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={`/dashboard/tools/${tool.id}`}
                    className="glass-card hover:border-[#00d4ff] group transition-all hover:scale-105"
                  >
                    <span className="text-4xl mb-3 block">{tool.icon}</span>
                    <h3 className="text-white font-semibold mb-1 group-hover:text-[#00d4ff] transition">{tool.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{tool.description}</p>
                    <div className="mt-3 flex items-center text-xs text-[#00d4ff]">
                      <span>Try now</span>
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 glass-card">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-300">No tools found in this category</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT MINI PANEL - Notifications & Activity */}
      <aside className="w-80 bg-[#0d0d15] border-l border-[rgba(255,255,255,0.1)] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[rgba(255,255,255,0.1)]">
          <h3 className="text-lg font-bold text-[#f8fafc] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0ea5e9]" />
            Recent Activity
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="glass p-3 rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-[rgba(14,165,233,0.3)] transition">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 shadow-lg ${
                      item.status === 'completed' ? 'bg-[#10b981] shadow-[rgba(16,185,129,0.5)]' :
                      item.status === 'processing' ? 'bg-[#0ea5e9] shadow-[rgba(14,165,233,0.5)]' :
                      'bg-[#ef4444] shadow-[rgba(239,68,68,0.5)]'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm text-[#f8fafc] font-medium mb-1">
                        {item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-[#94a3b8] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#94a3b8]">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Your processed documents will appear here</p>
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {userTier === 'FREE' && (
          <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
            <div className="glass-card bg-gradient-to-br from-[rgba(14,165,233,0.1)] to-[rgba(139,92,246,0.1)] border-[rgba(14,165,233,0.3)] shadow-lg shadow-[rgba(14,165,233,0.2)]">
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-bold text-[#f8fafc] mb-2">Upgrade to Pro</h4>
                <p className="text-xs text-[#cbd5e1] mb-3">
                  Get 1000 operations/month and priority processing
                </p>
                <Link href="/pricing" className="btn-primary w-full block text-center py-2">
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
