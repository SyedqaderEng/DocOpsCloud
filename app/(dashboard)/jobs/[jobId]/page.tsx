'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/firebase/AuthContext'
import { Loader2, Download, FileText, CheckCircle2, XCircle, Clock, Activity, Mail, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import ShareableLink from '@/components/workflow/ShareableLink'
import QueueVisualization from '@/components/queue/QueueVisualization'

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
  const { user } = useAuth()
  const jobId = params.jobId as string

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

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

  // Email file functionality
  const handleEmailFile = async () => {
    if (!job?.outputFile || !user) return

    setEmailSending(true)
    setEmailError(null)

    try {
      const idToken = await user.getIdToken()

      const res = await fetch('/api/files/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: job.outputFile.id,
          email: user.email,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to send email')
      }

      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 5000) // Reset after 5 seconds
    } catch (err: any) {
      setEmailError(err.message || 'Failed to send email')
    } finally {
      setEmailSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-[#00d4ff] mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading job status...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card border-2 border-[#ff0055]">
          <div className="w-16 h-16 bg-[rgba(255,0,85,0.2)] rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-[#ff0055]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Job Not Found</h1>
          <p className="text-gray-300 mb-6 text-center">{error || 'The requested job could not be found.'}</p>
          <Link
            href="/dashboard"
            className="block btn-neon py-3 text-center"
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
        return <Clock className="w-8 h-8 text-yellow-600" />
      case 'processing':
        return <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
      case 'completed':
        return <CheckCircle2 className="w-8 h-8 text-green-600" />
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-600" />
    }
  }

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200'
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
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const progress = job.progress || 0

  return (
    <div className="min-h-screen gradient-animated">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold">
              <span className="text-gray-900">Doc</span>
              <span className="text-purple-600">Ops</span>
              <span className="text-gray-900">Cloud</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-8 pb-16 px-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-purple-600 hover:text-purple-700 transition font-semibold inline-flex items-center gap-2 mb-4"
          >
            <span>←</span>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Job Status</h1>
          <p className="text-gray-600">Job ID: <span className="font-mono text-sm">{job.id}</span></p>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                {getStatusIcon(job.status)}
                <h2 className="text-3xl font-bold text-gray-900">{getJobTypeLabel(job.type)}</h2>
              </div>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full border font-semibold text-sm ${getStatusColor(job.status)}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {(job.status === 'queued' || job.status === 'processing') && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">Progress</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-500 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  {job.status === 'processing' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {job.status === 'queued' && 'Your job is in the queue and will start processing soon...'}
                {job.status === 'processing' && 'Processing your file. This may take a few moments...'}
              </p>
            </div>
          )}
        </div>

        {/* Queue Visualization */}
        {(job.status === 'queued' || job.status === 'processing') && (
          <div className="mb-6">
            <QueueVisualization jobId={job.id} />
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mb-6">

          {/* Input File */}
          {job.inputFile && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Input File</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{job.inputFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(job.inputFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Output File */}
          {job.status === 'completed' && job.outputFile && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Output File</h3>
              <div className="glass-card border-2 border-[#00ff88]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{job.outputFile.name}</p>
                    <p className="text-sm text-gray-400">
                      {(job.outputFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {/* Download & Email Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={job.outputFile.downloadUrl}
                    download
                    className="px-6 py-3 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  <button
                    onClick={handleEmailFile}
                    disabled={emailSending || emailSent}
                    className="px-6 py-3 glass-strong border-2 border-[#00d4ff] text-white rounded-lg font-semibold hover:bg-[rgba(0,212,255,0.2)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {emailSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : emailSent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Sent!
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Email
                      </>
                    )}
                  </button>
                </div>

                {/* Email Status Messages */}
                {emailSent && (
                  <div className="mt-3 p-3 bg-[rgba(0,255,136,0.1)] border border-[#00ff88] rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                    <p className="text-sm text-[#00ff88]">File sent to {user?.email}</p>
                  </div>
                )}
                {emailError && (
                  <div className="mt-3 p-3 bg-[rgba(255,0,85,0.1)] border border-[#ff0055] rounded-lg flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-[#ff0055]" />
                    <p className="text-sm text-red-300">{emailError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {job.status === 'failed' && job.error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Error</h3>
                  <p className="text-sm">{job.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Details</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </div>
                {job.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(job.startedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {job.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(job.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {job.completedAt && job.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="text-gray-900 font-medium">
                      {((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {job.status === 'completed' && (
            <Link
              href="/dashboard"
              className="flex-1 px-6 py-4 border-2 border-purple-600 text-purple-600 rounded-xl font-bold text-center hover:bg-purple-50 transition"
            >
              Process Another File
            </Link>
          )}
          {job.status === 'failed' && (
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition shadow-sm"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
