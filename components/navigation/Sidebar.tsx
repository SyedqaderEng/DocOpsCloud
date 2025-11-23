'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  History,
  Activity,
  Search,
  Share2,
  GitBranch,
  FolderKanban,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  FileText,
  BarChart3,
  GitCompare,
} from 'lucide-react'
import { useAuth } from '@/lib/firebase/AuthContext'

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge?: string
  badgeColor?: string
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Upload & Process',
      href: '/dashboard/workflow/upload',
      icon: Upload,
    },
    {
      name: 'Bulk Processing',
      href: '/bulk',
      icon: FolderKanban,
    },
    {
      name: 'History',
      href: '/history',
      icon: History,
    },
    {
      name: 'Queue Status',
      href: '/queue',
      icon: Activity,
      badge: 'Live',
      badgeColor: 'bg-[#00ff88]',
    },
    {
      name: 'Search',
      href: '/search',
      icon: Search,
    },
    {
      name: 'Share Links',
      href: '/shares',
      icon: Share2,
    },
    {
      name: 'File Versions',
      href: '/versions',
      icon: GitBranch,
    },
    {
      name: 'Compare',
      href: '/compare',
      icon: GitCompare,
    },
    {
      name: 'All Tools',
      href: '/dashboard/tools',
      icon: Zap,
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
  ]

  const bottomNavigation: NavigationItem[] = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#080810] via-[#0d0d15] to-[#12121a] backdrop-blur-xl border-r border-[rgba(255,255,255,0.1)] transition-all duration-300 z-50 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-[rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] rounded-lg flex items-center justify-center shadow-lg shadow-[rgba(14,165,233,0.3)]">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-[#f8fafc] font-bold text-lg tracking-tight">DocOps</h1>
                    <p className="text-xs text-[#94a3b8]">Cloud Platform</p>
                  </div>
                </Link>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition"
              >
                {collapsed ? (
                  <ChevronRight className="w-5 h-5 text-[#cbd5e1]" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-[#cbd5e1]" />
                )}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition group ${
                    active
                      ? 'bg-[rgba(14,165,233,0.15)] text-[#38bdf8] border border-[rgba(14,165,233,0.5)] shadow-lg shadow-[rgba(14,165,233,0.2)]'
                      : 'text-[#cbd5e1] hover:bg-[#18181f] hover:text-[#f8fafc] border border-transparent hover:border-[rgba(255,255,255,0.08)]'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`px-2 py-0.5 ${
                            item.badgeColor || 'bg-[#10b981]'
                          } text-white text-xs rounded-full font-semibold shadow-lg`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-[rgba(255,255,255,0.1)] space-y-2">
            {bottomNavigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    active
                      ? 'bg-[rgba(14,165,233,0.15)] text-[#38bdf8] border border-[rgba(14,165,233,0.5)] shadow-lg shadow-[rgba(14,165,233,0.2)]'
                      : 'text-[#cbd5e1] hover:bg-[#18181f] hover:text-[#f8fafc] border border-transparent hover:border-[rgba(255,255,255,0.08)]'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="flex-1 font-medium">{item.name}</span>}
                </Link>
              )
            })}

            {user && (
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#cbd5e1] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#f87171] border border-transparent hover:border-[rgba(239,68,68,0.3)] transition"
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="flex-1 font-medium text-left">Logout</span>}
              </button>
            )}

            {!collapsed && user && (
              <div className="mt-4 p-3 glass-strong rounded-lg border border-[rgba(255,255,255,0.08)]">
                <p className="text-xs text-[#94a3b8] mb-1">Logged in as</p>
                <p className="text-sm text-[#f8fafc] font-semibold truncate">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Spacer to prevent content overlap */}
      <div className={`${collapsed ? 'w-20' : 'w-64'} flex-shrink-0`} />
    </>
  )
}
