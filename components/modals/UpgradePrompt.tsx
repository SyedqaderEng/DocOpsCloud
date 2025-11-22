'use client'

import { X, Zap, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  reason?: string
  currentTier?: string
  limitType?: 'operations' | 'fileSize' | 'storage'
}

export default function UpgradePrompt({
  isOpen,
  onClose,
  reason,
  currentTier = 'FREE',
  limitType = 'operations',
}: UpgradePromptProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const getLimitMessage = () => {
    switch (limitType) {
      case 'operations':
        return {
          title: 'Daily Limit Reached',
          subtitle: 'Upgrade to process more documents',
          icon: '📊',
        }
      case 'fileSize':
        return {
          title: 'File Too Large',
          subtitle: 'Upgrade for larger file support',
          icon: '📦',
        }
      case 'storage':
        return {
          title: 'Storage Limit Reached',
          subtitle: 'Upgrade for more storage space',
          icon: '💾',
        }
      default:
        return {
          title: 'Upgrade Required',
          subtitle: 'Unlock more features',
          icon: '🚀',
        }
    }
  }

  const limitInfo = getLimitMessage()

  const proFeatures = [
    '1000 operations per month',
    '500MB max file size',
    'Priority processing',
    'API access',
    'Email support',
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-w-lg w-full bg-[#141420] border-2 border-[rgba(0,212,255,0.3)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] p-1">
          <div className="bg-[#141420] p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">{limitInfo.icon}</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {limitInfo.title}
              </h2>
              <p className="text-gray-300">
                {reason || limitInfo.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Tier Info */}
          <div className="mb-6 p-4 bg-[rgba(255,255,255,0.05)] rounded-lg border border-[rgba(255,255,255,0.1)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Current Plan</div>
                <div className="text-lg font-semibold text-white">{currentTier}</div>
              </div>
              <Zap className="w-8 h-8 text-gray-500" />
            </div>
          </div>

          {/* Pro Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Upgrade to Pro for:
            </h3>
            <div className="space-y-2">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#00d4ff] flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6 p-4 bg-gradient-to-r from-[rgba(0,212,255,0.1)] to-[rgba(168,85,247,0.1)] rounded-lg border border-[rgba(0,212,255,0.2)]">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-white">$79</span>
              <span className="text-gray-400">/year</span>
            </div>
            <div className="text-sm text-gray-300">
              That's just $6.58/month - less than a coffee! ☕
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-[rgba(255,255,255,0.2)] rounded-lg text-white font-semibold hover:bg-[rgba(255,255,255,0.05)] transition"
            >
              Maybe Later
            </button>
            <Link
              href="/pricing"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded-lg text-white font-semibold text-center hover:shadow-lg hover:shadow-[rgba(0,212,255,0.3)] transition"
              onClick={onClose}
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
