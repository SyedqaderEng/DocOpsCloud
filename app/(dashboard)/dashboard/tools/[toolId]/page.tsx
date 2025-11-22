'use client'

import { useState, useEffect, use } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import { getAllToolsFlat } from '@/lib/tools-data'
import { ArrowLeft, Upload, X, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import UpgradePrompt from '@/components/modals/UpgradePrompt'
import { validateFileSize, formatFileSize } from '@/lib/utils/file-validation'
import { SubscriptionTier } from '@prisma/client'

interface PageProps {
  params: Promise<{ toolId: string }>
}

export default function DashboardToolPage({ params }: PageProps) {
  const { toolId } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [tool, setTool] = useState<any>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState('')
  const [usageInfo, setUsageInfo] = useState<any>(null)

  useEffect(() => {
    const allTools = getAllToolsFlat()
    const foundTool = allTools.find(t => t.id === toolId)
    setTool(foundTool)

    if (!foundTool) {
      router.push('/dashboard')
    }
  }, [toolId, router])

  // Fetch user profile and usage
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const idToken = await user.getIdToken()

        // Fetch user profile
        const profileRes = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${idToken}` },
        })
        if (profileRes.ok) {
          const { user: profile } = await profileRes.json()
          setUserTier(profile.subscription_tier)
        }

        // Fetch usage stats
        const usageRes = await fetch('/api/user/usage', {
          headers: { 'Authorization': `Bearer ${idToken}` },
        })
        if (usageRes.ok) {
          const { usage } = await usageRes.json()
          setUsageInfo(usage)
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }

    fetchUserData()
  }, [user])

  // Check for transferred files from landing page
  useEffect(() => {
    const checkForTransferredFiles = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const transferId = urlParams.get('transfer')

      if (transferId) {
        try {
          const { fileTransferManager } = await import('@/lib/utils/file-transfer')
          const data = await fileTransferManager.retrieveFiles(transferId)

          if (data && data.files && data.files.length > 0) {
            // Validate transferred files against user tier
            const validFiles: File[] = []
            for (const file of data.files) {
              const validation = validateFileSize(file, userTier)
              if (validation.valid) {
                validFiles.push(file)
              } else {
                console.warn(`File ${file.name} exceeds size limit for ${userTier} tier`)
              }
            }

            if (validFiles.length > 0) {
              setUploadedFiles(validFiles)
            }

            // Clean up the transfer
            await fileTransferManager.deleteFiles(transferId)
            // Remove transfer param from URL
            router.replace(`/dashboard/tools/${toolId}`, { scroll: false })
          }
        } catch (err) {
          console.error('Failed to retrieve transferred files:', err)
        }
      }
    }

    // Only run after we have the user tier loaded
    if (userTier) {
      checkForTransferredFiles()
    }
  }, [toolId, router, userTier])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    // Validate file sizes
    for (const file of files) {
      const validation = validateFileSize(file, userTier)
      if (!validation.valid) {
        setError(validation.error || 'File validation failed')
        if (validation.shouldUpgrade) {
          setUpgradeReason(validation.error || 'File too large for your plan')
          setShowUpgradeModal(true)
        }
        return
      }
    }

    setUploadedFiles(prev => [...prev, ...files])
    setError(null)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleProcess = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const idToken = await user?.getIdToken()
      if (!idToken) {
        throw new Error('Not authenticated')
      }

      // Check usage limits before processing
      const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0)

      // Here you would call your processing API
      // This is a placeholder - integrate with your actual tool processing logic
      const formData = new FormData()
      uploadedFiles.forEach(file => formData.append('files', file))
      formData.append('toolId', toolId)

      const response = await fetch('/api/process/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'PLAN_LIMIT_EXCEEDED') {
          setUpgradeReason(data.error)
          setShowUpgradeModal(true)
          throw new Error(data.error)
        }
        throw new Error(data.error || 'Processing failed')
      }

      // Success - handle download or next steps
      if (data.downloadUrl) {
        window.location.href = data.downloadUrl
      }

      // Refresh usage info
      const usageRes = await fetch('/api/user/usage', {
        headers: { 'Authorization': `Bearer ${idToken}` },
      })
      if (usageRes.ok) {
        const { usage } = await usageRes.json()
        setUsageInfo(usage)
      }

      setUploadedFiles([])
    } catch (err: any) {
      setError(err.message || 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-animated p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl">{tool.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-white">{tool.name}</h1>
            <p className="text-gray-300">{tool.description}</p>
          </div>
        </div>

        {/* Usage Info */}
        {usageInfo && userTier === 'FREE' && (
          <div className="mt-4 p-4 glass-card border-[#00d4ff]">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-300">Today: </span>
                <span className="text-white font-semibold">{usageInfo.dailyUsage} / {usageInfo.dailyLimit}</span>
                <span className="text-gray-300 mx-2">|</span>
                <span className="text-gray-300">This month: </span>
                <span className="text-white font-semibold">{usageInfo.monthlyUsage} / {usageInfo.monthlyLimit}</span>
              </div>
              <Link href="/pricing" className="btn-neon px-4 py-2 text-sm">
                Upgrade
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="glass-card">
          <h2 className="text-xl font-bold text-white mb-4">Upload Files</h2>

          <label className="block mb-4">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.csv"
            />
            <div className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-xl p-8 text-center hover:border-[#00d4ff] transition cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Drop files here or click to browse</p>
              <p className="text-sm text-gray-400">
                Max size: {formatFileSize(userTier === 'FREE' ? 10 * 1024 * 1024 : userTier === 'PRO' ? 500 * 1024 * 1024 : 2 * 1024 * 1024 * 1024)}
              </p>
            </div>
          </label>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.05)] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{file.name}</div>
                    <div className="text-xs text-gray-400">{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-[rgba(255,0,85,0.1)] border border-[#ff0055] rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-[#ff0055] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcess}
            disabled={processing || uploadedFiles.length === 0}
            className="w-full mt-4 btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Process ${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>

        {/* Instructions Section */}
        <div className="glass-card">
          <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded-full flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <div className="text-white font-semibold">Upload Your Files</div>
                <div className="text-sm text-gray-400">Select one or more files to process</div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded-full flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <div className="text-white font-semibold">Process</div>
                <div className="text-sm text-gray-400">Click the process button and wait for completion</div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded-full flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <div className="text-white font-semibold">Download</div>
                <div className="text-sm text-gray-400">Your processed files will download automatically</div>
              </div>
            </li>
          </ol>

          {/* Tier-specific features */}
          {userTier === 'FREE' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-[rgba(0,212,255,0.1)] to-[rgba(168,85,247,0.1)] rounded-lg border border-[rgba(0,212,255,0.2)]">
              <div className="text-sm font-semibold text-white mb-2">💎 Upgrade to Pro</div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Process 1000 files per month</li>
                <li>• Upload files up to 500MB</li>
                <li>• Priority processing speed</li>
              </ul>
              <Link href="/pricing" className="inline-block mt-3 text-sm text-[#00d4ff] hover:underline">
                View pricing →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradePrompt
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
        currentTier={userTier}
      />
    </div>
  )
}
