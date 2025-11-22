'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import {
  History,
  RotateCcw,
  Download,
  Trash2,
  Check,
  GitBranch,
  FileText,
  Calendar,
  HardDrive,
  Tag,
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils/file-validation'

interface FileVersion {
  id: string
  versionNumber: number
  versionLabel?: string
  description?: string
  fileName: string
  fileSize: number
  fileType: string
  s3Url: string
  thumbnailUrl?: string
  operationType?: string
  operationParams?: Record<string, any>
  jobId?: string
  checksum?: string
  isCurrent: boolean
  parentVersionId?: string
  createdAt: string
}

interface VersionHistoryProps {
  fileId: string
  onVersionRestore?: () => void
}

export default function VersionHistory({ fileId, onVersionRestore }: VersionHistoryProps) {
  const { user } = useAuth()
  const [versions, setVersions] = useState<FileVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [fileId])

  const fetchVersions = async () => {
    try {
      setError(null)
      const idToken = await user?.getIdToken()

      const res = await fetch(`/api/files/${fileId}/versions`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch versions')
      }

      setVersions(data.data.versions)
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleRestore = async (versionId: string) => {
    if (!confirm('Restore to this version? This will create a new version based on this state.')) {
      return
    }

    try {
      setRestoring(versionId)
      const idToken = await user?.getIdToken()

      const res = await fetch(`/api/files/${fileId}/versions/${versionId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to restore version')
      }

      // Refresh versions
      await fetchVersions()

      if (onVersionRestore) {
        onVersionRestore()
      }

      alert('Version restored successfully!')
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setRestoring(null)
    }
  }

  const handleDelete = async (versionId: string, versionNumber: number) => {
    if (!confirm(`Delete version ${versionNumber}? This cannot be undone.`)) {
      return
    }

    try {
      const idToken = await user?.getIdToken()

      const res = await fetch(`/api/files/${fileId}/versions/${versionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete version')
      }

      // Refresh versions
      await fetchVersions()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDownload = (s3Url: string) => {
    window.open(s3Url, '_blank')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getOperationLabel = (operationType?: string) => {
    if (!operationType) return 'Original Upload'

    const labels: Record<string, string> = {
      pdf_compress: 'Compressed',
      pdf_merge: 'Merged',
      pdf_split: 'Split',
      pdf_rotate: 'Rotated',
      pdf_watermark: 'Watermarked',
      version_restore: 'Restored',
      // Add more mappings
    }

    return labels[operationType] || operationType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="glass-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-white">Loading version history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card border border-[#ff0055]">
        <p className="text-[#ff0055]">Error: {error}</p>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="glass-card text-center">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">No Version History</p>
        <p className="text-sm text-gray-400">
          Versions will appear here as you process this file
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-[#00d4ff]" />
          <h3 className="text-xl font-bold text-white">Version History</h3>
        </div>
        <div className="glass-strong px-3 py-1 rounded-full">
          <span className="text-sm text-gray-300">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Version Timeline */}
      <div className="space-y-3">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`glass-card border-2 ${
              version.isCurrent ? 'border-[#00d4ff]' : 'border-transparent'
            } transition-all duration-300 hover:border-[#00d4ff]/50`}
          >
            <div className="flex items-start gap-4">
              {/* Version Badge */}
              <div className="flex-shrink-0">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                    version.isCurrent
                      ? 'bg-gradient-to-br from-[#00d4ff] to-[#a855f7] text-white'
                      : 'glass-strong text-gray-400'
                  }`}
                >
                  v{version.versionNumber}
                </div>
              </div>

              {/* Version Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      {version.versionLabel || `Version ${version.versionNumber}`}
                      {version.isCurrent && (
                        <span className="px-2 py-0.5 bg-[#00d4ff] text-white text-xs rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Current
                        </span>
                      )}
                    </h4>
                    {version.description && (
                      <p className="text-sm text-gray-400 mt-1">{version.description}</p>
                    )}
                  </div>
                </div>

                {/* Version Details */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">{getOperationLabel(version.operationType)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">{formatDate(version.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <HardDrive className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300">{formatFileSize(version.fileSize)}</span>
                  </div>
                  {version.parentVersionId && (
                    <div className="flex items-center gap-2 text-xs">
                      <GitBranch className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300">From previous version</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(version.s3Url)}
                    className="px-3 py-1.5 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg text-sm font-semibold transition flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>

                  {!version.isCurrent && (
                    <>
                      <button
                        onClick={() => handleRestore(version.id)}
                        disabled={restoring === version.id}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg text-sm font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition disabled:opacity-50 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {restoring === version.id ? 'Restoring...' : 'Restore'}
                      </button>

                      <button
                        onClick={() => handleDelete(version.id, version.versionNumber)}
                        className="px-3 py-1.5 glass-strong hover:bg-[rgba(255,0,85,0.1)] text-[#ff0055] rounded-lg text-sm font-semibold transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Thumbnail */}
              {version.thumbnailUrl && (
                <div className="flex-shrink-0 hidden lg:block">
                  <img
                    src={version.thumbnailUrl}
                    alt={`Version ${version.versionNumber}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Connection Line */}
            {index < versions.length - 1 && (
              <div className="ml-6 mt-3 mb-0 h-6 border-l-2 border-dashed border-gray-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
