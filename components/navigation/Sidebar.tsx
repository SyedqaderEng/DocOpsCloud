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
      name: 'All Tools',
      href: '/dashboard/tools',
      icon: Zap,
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
        className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[rgba(0,0,0,0.95)] to-[rgba(20,20,40,0.95)] backdrop-blur-xl border-r border-gray-800 transition-all duration-300 z-50 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              {!collapsed && (
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#a855f7] rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-lg">DocOps</h1>
                    <p className="text-xs text-gray-400">Cloud Platform</p>
                  </div>
                </Link>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition"
              >
                {collapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
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
                      ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                      : 'text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
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
                            item.badgeColor || 'bg-[#00d4ff]'
                          } text-white text-xs rounded-full font-semibold`}
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
          <div className="p-4 border-t border-gray-800 space-y-2">
            {bottomNavigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                    active
                      ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                      : 'text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:text-white'
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-[rgba(255,0,85,0.1)] hover:text-[#ff0055] transition"
                title={collapsed ? 'Logout' : undefined}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="flex-1 font-medium text-left">Logout</span>}
              </button>
            )}

            {!collapsed && user && (
              <div className="mt-4 p-3 glass-strong rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Logged in as</p>
                <p className="text-sm text-white font-semibold truncate">{user.email}</p>
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
