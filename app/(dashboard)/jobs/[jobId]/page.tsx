'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

interface Job {
  id: string
  type: string
  status: JobStatus
  progress?: number
  error?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  inputFile?: {
    id: string
    name: string
    size: number
  }
  outputFile?: {
    id: string
    name: string
    size: number
    downloadUrl: string
  }
  metadata?: any
}

export default function JobStatusPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch job status
  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch job')
      }

      const data = await response.json()
      setJob(data)
      setLoading(false)

      // Stop polling if job is completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        return true // Signal to stop polling
      }

      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job')
      setLoading(false)
      return true // Stop polling on error
    }
  }

  // Poll for updates
  useEffect(() => {
    fetchJob()

    const interval = setInterval(async () => {
      const shouldStop = await fetchJob()
      if (shouldStop) {
        clearInterval(interval)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [jobId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading job status...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Job Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The requested job could not be found.'}</p>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-[#7c3aed] text-white rounded-lg font-semibold hover:bg-[#6d28d9] transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return '⏳'
      case 'processing':
        return '⚙️'
      case 'completed':
        return '✅'
      case 'failed':
        return '❌'
    }
  }

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return 'text-yellow-400'
      case 'processing':
        return 'text-blue-400'
      case 'completed':
        return 'text-green-400'
      case 'failed':
        return 'text-red-400'
    }
  }

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      pdf_merge: 'PDF Merge',
      pdf_split: 'PDF Split',
      pdf_compress: 'PDF Compress',
      word_to_html: 'Word to HTML',
      word_to_markdown: 'Word to Markdown',
      word_to_pdf: 'Word to PDF',
      excel_to_csv: 'Excel to CSV',
      csv_to_excel: 'CSV to Excel',
      image_resize: 'Image Resize',
      image_compress: 'Image Compress',
      image_convert: 'Image Convert',
      image_optimize: 'Image Optimize',
    }
    return labels[type] || type
  }

  const progress = job.progress || 0

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[rgba(26,19,50,0.95)] backdrop-blur-md border-b border-[#312e81] z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold text-[#8b5cf6]">
              DocOpsCloud
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 border border-[#312e81] rounded-lg text-gray-300 hover:bg-[#1e1b4b] transition font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-28 pb-16 px-6">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/dashboard"
            className="text-[#8b5cf6] hover:text-[#a78bfa] transition font-semibold inline-flex items-center gap-2 mb-6"
          >
            <span>←</span>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black mb-2">Job Status</h1>
          <p className="text-gray-400">Job ID: {job.id}</p>
        </div>

        {/* Status Card */}
        <div className="bg-[#1a1332] border border-[#312e81] rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{getStatusIcon(job.status)}</span>
                <h2 className="text-3xl font-bold">{getJobTypeLabel(job.type)}</h2>
              </div>
              <p className={`text-lg font-semibold ${getStatusColor(job.status)} capitalize`}>
                {job.status}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {(job.status === 'queued' || job.status === 'processing') && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-[#1e1b4b] rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                >
                  {job.status === 'processing' && (
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Input File */}
          {job.inputFile && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Input File</h3>
              <div className="bg-[#1e1b4b] border border-[#312e81] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-semibold text-gray-100">{job.inputFile.name}</p>
                      <p className="text-sm text-gray-400">
                        {(job.inputFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Output File */}
          {job.status === 'completed' && job.outputFile && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Output File</h3>
              <div className="bg-gradient-to-br from-[#1e1b4b] to-[#1a1332] border border-[#7c3aed] rounded-lg p-4 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">📥</span>
                    <div>
                      <p className="font-semibold text-gray-100">{job.outputFile.name}</p>
                      <p className="text-sm text-gray-400">
                        {(job.outputFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <a
                    href={job.outputFile.downloadUrl}
                    download
                    className="px-6 py-3 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-lg font-semibold hover:from-[#6d28d9] hover:to-[#5b21b6] transition shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {job.status === 'failed' && job.error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg mb-6">
              <h3 className="font-semibold mb-2">Error</h3>
              <p className="text-sm">{job.error}</p>
            </div>
          )}

          {/* Metadata */}
          {job.metadata && Object.keys(job.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Details</h3>
              <div className="bg-[#1e1b4b] border border-[#312e81] rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2 text-gray-100">
                      {new Date(job.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {job.startedAt && (
                    <div>
                      <span className="text-gray-400">Started:</span>
                      <span className="ml-2 text-gray-100">
                        {new Date(job.startedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {job.completedAt && (
                    <div>
                      <span className="text-gray-400">Completed:</span>
                      <span className="ml-2 text-gray-100">
                        {new Date(job.completedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {job.status === 'completed' && (
            <Link
              href="/tools"
              className="flex-1 px-6 py-4 border-2 border-[#7c3aed] text-[#8b5cf6] rounded-lg font-bold text-center hover:bg-[#1e1b4b] transition"
            >
              Process Another File
            </Link>
          )}
          {job.status === 'failed' && (
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 bg-[#7c3aed] text-white rounded-lg font-bold hover:bg-[#6d28d9] transition"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
