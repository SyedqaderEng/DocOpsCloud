'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  Link as LinkIcon,
  Copy,
  CheckCircle2,
  Lock,
  Clock,
  Eye,
  Settings,
  X
} from 'lucide-react'

interface ShareableLinkProps {
  fileId: string
  fileName: string
}

interface ShareSettings {
  expiresIn: '1hour' | '24hours' | '7days' | '30days' | 'never'
  password?: string
  maxViews?: number
  allowDownload: boolean
}

export default function ShareableLink({ fileId, fileName }: ShareableLinkProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<ShareSettings>({
    expiresIn: '7days',
    password: '',
    maxViews: undefined,
    allowDownload: true
  })

  const generateShareLink = async () => {
    setLoading(true)
    try {
      const idToken = await user?.getIdToken()
      if (!idToken) throw new Error('Not authenticated')

      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId,
          ...settings,
          expiresAt: getExpirationDate(settings.expiresIn)
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to generate link')
      }

      const { shareId } = await res.json()
      const link = `${window.location.origin}/share/${shareId}`
      setShareLink(link)
    } catch (err: any) {
      alert(err.message || 'Failed to generate shareable link')
    } finally {
      setLoading(false)
    }
  }

  const getExpirationDate = (expiresIn: string): Date | null => {
    if (expiresIn === 'never') return null
    const now = new Date()
    switch (expiresIn) {
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000)
      case '24hours':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case '7days':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case '30days':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      default:
        return null
    }
  }

  const copyToClipboard = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getExpirationLabel = (expiresIn: string): string => {
    const labels = {
      '1hour': '1 Hour',
      '24hours': '24 Hours',
      '7days': '7 Days',
      '30days': '30 Days',
      'never': 'Never'
    }
    return labels[expiresIn as keyof typeof labels]
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 glass-strong border-2 border-[#00d4ff] text-white rounded-lg font-semibold hover:bg-[rgba(0,212,255,0.2)] transition flex items-center justify-center gap-2"
      >
        <LinkIcon className="w-4 h-4" />
        Generate Share Link
      </button>
    )
  }

  return (
    <div className="glass-card border-2 border-[#00d4ff]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-[#00d4ff]" />
          <h3 className="text-lg font-bold text-white">Share File</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Settings Toggle */}
      {!shareLink && (
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full mb-4 p-3 glass-strong hover:bg-[rgba(0,212,255,0.1)] rounded-lg transition flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-white">Share Settings</span>
          </div>
          <span className="text-xs text-gray-400">{showSettings ? 'Hide' : 'Show'}</span>
        </button>
      )}

      {/* Settings Panel */}
      {showSettings && !shareLink && (
        <div className="space-y-4 mb-4 p-4 bg-[rgba(0,0,0,0.3)] rounded-lg">
          {/* Expiration */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <Clock className="w-4 h-4 text-[#00d4ff]" />
              Expires In
            </label>
            <select
              value={settings.expiresIn}
              onChange={(e) => setSettings({ ...settings, expiresIn: e.target.value as any })}
              className="w-full p-2 glass-strong rounded text-white text-sm"
            >
              <option value="1hour">1 Hour</option>
              <option value="24hours">24 Hours</option>
              <option value="7days">7 Days</option>
              <option value="30days">30 Days</option>
              <option value="never">Never</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <Lock className="w-4 h-4 text-[#00d4ff]" />
              Password (Optional)
            </label>
            <input
              type="password"
              value={settings.password}
              onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              placeholder="Leave empty for no password"
              className="w-full p-2 glass-strong rounded text-white text-sm placeholder-gray-500"
            />
          </div>

          {/* Max Views */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <Eye className="w-4 h-4 text-[#00d4ff]" />
              Max Views (Optional)
            </label>
            <input
              type="number"
              value={settings.maxViews || ''}
              onChange={(e) => setSettings({ ...settings, maxViews: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="Unlimited"
              min="1"
              className="w-full p-2 glass-strong rounded text-white text-sm placeholder-gray-500"
            />
          </div>

          {/* Allow Download */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.allowDownload}
              onChange={(e) => setSettings({ ...settings, allowDownload: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 text-[#00d4ff] focus:ring-[#00d4ff]"
            />
            <span className="text-sm text-white">Allow Download</span>
          </label>
        </div>
      )}

      {/* Generate Button */}
      {!shareLink && (
        <button
          onClick={generateShareLink}
          disabled={loading}
          className="w-full btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4" />
              Generate Shareable Link
            </>
          )}
        </button>
      )}

      {/* Generated Link */}
      {shareLink && (
        <div className="space-y-4">
          {/* Link Display */}
          <div className="p-4 bg-[rgba(0,212,255,0.1)] border border-[#00d4ff] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
              <span className="text-sm font-semibold text-[#00ff88]">Link Generated!</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 p-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.2)] rounded text-white text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Share Info */}
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Expires: {getExpirationLabel(settings.expiresIn)}</span>
            </div>
            {settings.password && (
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3" />
                <span>Password Protected</span>
              </div>
            )}
            {settings.maxViews && (
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3" />
                <span>Max Views: {settings.maxViews}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
