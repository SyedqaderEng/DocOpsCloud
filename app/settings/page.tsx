'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/firebase/AuthContext'
import { Loader2, User, Bell, Shield, ArrowLeft, Save, Camera } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
    if (user) {
      setDisplayName(user.displayName || '')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00d4ff] animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement profile update
    await new Promise(r => setTimeout(r, 1000))
    setSaving(false)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="min-h-screen gradient-animated">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-[rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Doc<span className="text-neon-cyan">Ops</span>Cloud
            </Link>
            <Link href="/dashboard" className="btn-neon">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] transition mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                    activeTab === tab.id
                      ? 'glass-strong border border-[#00d4ff] text-[#00d4ff]'
                      : 'text-gray-400 hover:text-white hover:glass'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>

                {/* Avatar */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-4xl text-white font-bold">
                      {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full glass-strong border border-[rgba(255,255,255,0.2)] flex items-center justify-center hover:border-[#00d4ff] transition">
                      <Camera className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{user.displayName || 'User'}</h3>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 glass-strong border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-3 glass-strong border border-[rgba(255,255,255,0.2)] rounded-lg text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-neon px-6 py-3 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Email notifications for completed jobs', checked: true },
                    { label: 'Email notifications for failed jobs', checked: true },
                    { label: 'Weekly usage summary', checked: false },
                    { label: 'Product updates and news', checked: false },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between p-4 glass rounded-lg cursor-pointer hover:glass-strong transition">
                      <span className="text-gray-300">{item.label}</span>
                      <input type="checkbox" defaultChecked={item.checked} className="w-5 h-5 rounded" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="glass-card">
                <h2 className="text-xl font-bold text-white mb-6">Security Settings</h2>

                <div className="space-y-6">
                  <div className="p-4 glass rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">Password</h3>
                      <Link href="/auth/forgot-password" className="text-[#00d4ff] text-sm hover:underline">
                        Reset Password
                      </Link>
                    </div>
                    <p className="text-gray-400 text-sm">Last changed: Never</p>
                  </div>

                  <div className="p-4 glass rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">Email Verified</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.emailVerified ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>

                  <div className="pt-6 border-t border-[rgba(255,255,255,0.1)]">
                    <h3 className="text-red-400 font-medium mb-4">Danger Zone</h3>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to sign out?')) {
                          await logout()
                          router.push('/')
                        }
                      }}
                      className="px-6 py-3 glass-strong border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition"
                    >
                      Sign Out of All Devices
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
