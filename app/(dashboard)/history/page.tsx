'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  Eye,
  Calendar,
  Filter
} from 'lucide-react'

interface HistoryJob {
  id: string
  type: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  inputFile: {
    name: string
    size: number
  }
  outputFile?: {
    id: string
    name: string
    downloadUrl: string
  }
  createdAt: string
  completedAt?: string
}

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [jobs, setJobs] = useState<HistoryJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    fetchHistory()
  }, [user, router])

  const fetchHistory = async () => {
    try {
      const idToken = await user?.getIdToken()
      if (!idToken) return

      const res = await fetch('/api/jobs/user', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      if (res.ok) {
        const data = await res.json()
        setJobs(data.jobs || [])
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Delete this job from history?')) return

    setDeleting(jobId)
    try {
      const idToken = await user?.getIdToken()
      if (!idToken) return

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` }
      })

      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== jobId))
      }
    } catch (err) {
      console.error('Failed to delete job:', err)
    } finally {
      setDeleting(null)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true
    return job.status === filter
  })

  const getJobTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-[#ff0055]" />
      case 'processing':
        return <Loader2 className="w-5 h-5 text-[#00d4ff] animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-[#00d4ff] transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Processing History</h1>
          <p className="text-gray-300">View and manage your recent document processing jobs</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                  : 'glass-strong text-gray-300 hover:text-white'
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'completed'
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                  : 'glass-strong text-gray-300 hover:text-white'
              }`}
            >
              Completed ({jobs.filter(j => j.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'failed'
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                  : 'glass-strong text-gray-300 hover:text-white'
              }`}
            >
              Failed ({jobs.filter(j => j.status === 'failed').length})
            </button>
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="glass-card text-center py-16">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
            <p className="text-gray-400 mb-6">
              {filter === 'all'
                ? "You haven't processed any files yet"
                : `No ${filter} jobs found`}
            </p>
            <Link href="/dashboard/workflow/upload" className="btn-neon inline-block px-6 py-3">
              Start Processing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div key={job.id} className="glass-card hover:border-[#00d4ff] transition">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(job.status)}
                  </div>

                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-white font-semibold mb-1">
                          {getJobTypeLabel(job.type)}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {job.inputFile.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="px-3 py-1.5 glass-strong hover:bg-[rgba(0,212,255,0.1)] rounded text-sm text-white flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </Link>

                      {job.status === 'completed' && job.outputFile && (
                        <a
                          href={job.outputFile.downloadUrl}
                          download
                          className="px-3 py-1.5 glass-strong hover:bg-[rgba(0,212,255,0.1)] rounded text-sm text-white flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      )}

                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={deleting === job.id}
                        className="px-3 py-1.5 glass-strong hover:bg-[rgba(255,0,85,0.1)] hover:border-[#ff0055] rounded text-sm text-gray-400 hover:text-[#ff0055] flex items-center gap-1 disabled:opacity-50"
                      >
                        {deleting === job.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
