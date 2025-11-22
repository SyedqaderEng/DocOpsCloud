'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Download, FileText, AlertCircle, CheckCircle, Scissors } from 'lucide-react'
import Link from 'next/link'
import { validateFileSize } from '@/lib/utils/file-validation'
import { SubscriptionTier } from '@prisma/client'

interface PDFPage {
  pageNumber: number
  preview: string
  splitAfter: boolean
}

type SplitMode = 'ranges' | 'every' | 'manual'

export default function PDFSplitTool() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null)
  const [pages, setPages] = useState<PDFPage[]>([])
  const [splitMode, setSplitMode] = useState<SplitMode>('manual')
  const [everyNPages, setEveryNPages] = useState(1)
  const [rangeInput, setRangeInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [loadingPreviews, setLoadingPreviews] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE')
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string | null>(null)
  const [downloadUrls, setDownloadUrls] = useState<Array<{ id: string; name: string; downloadUrl: string }>>([])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch user profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) return

      try {
        const profileRes = await fetch('/api/user/profile')
        if (profileRes.ok) {
          const { user: profile } = await profileRes.json()
          setUserTier(profile.subscription_tier)
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }

    fetchUserData()
  }, [session])

  // Check for transferred files
  useEffect(() => {
    const checkForTransferredFiles = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const transferId = urlParams.get('transfer')

      if (transferId) {
        try {
          const { fileTransferManager } = await import('@/lib/utils/file-transfer')
          const data = await fileTransferManager.retrieveFiles(transferId)

          if (data && data.files && data.files.length > 0) {
            const pdfFile = data.files.find(f => f.type === 'application/pdf')
            if (pdfFile) {
              await handleFile(pdfFile)
            }
            await fileTransferManager.deleteFiles(transferId)
            router.replace('/dashboard/tools/pdf-split', { scroll: false })
          }
        } catch (err) {
          console.error('Failed to retrieve transferred files:', err)
        }
      }
    }

    if (userTier) {
      checkForTransferredFiles()
    }
  }, [router, userTier])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleFile(file)
    }
  }

  const handleFile = async (file: File) => {
    setError(null)

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }

    const validation = validateFileSize(file, userTier)
    if (!validation.valid) {
      setError(validation.error || 'File too large')
      return
    }

    setUploadedFile(file)
    setLoadingPreviews(true)

    try {
      const pdfjsLib = await import('pdfjs-dist')
      // Use unpkg CDN for worker with correct .mjs extension for v5.x
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const pageCount = pdf.numPages

      const loadedPages: PDFPage[] = []

      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 0.5 })

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.height = viewport.height
        canvas.width = viewport.width

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise
          const preview = canvas.toDataURL()

          loadedPages.push({
            pageNumber: pageNum,
            preview,
            splitAfter: false,
          })
        }
      }

      setPages(loadedPages)
    } catch (err) {
      console.error('Error loading PDF:', err)
      setError('Failed to load PDF. Please try again.')
    } finally {
      setLoadingPreviews(false)
    }
  }

  const toggleSplitAfter = (pageNumber: number) => {
    setPages(prev =>
      prev.map(page =>
        page.pageNumber === pageNumber
          ? { ...page, splitAfter: !page.splitAfter }
          : page
      )
    )
  }

  const applySplitMode = () => {
    if (splitMode === 'every') {
      // Split every N pages
      const n = parseInt(everyNPages.toString())
      if (n > 0 && n < pages.length) {
        setPages(prev =>
          prev.map((page, index) => ({
            ...page,
            splitAfter: (index + 1) % n === 0 && index < pages.length - 1,
          }))
        )
      }
    } else if (splitMode === 'ranges') {
      // Parse range input like "1-3, 4-7, 8-10"
      setPages(prev => prev.map(p => ({ ...p, splitAfter: false })))
      const ranges = rangeInput.split(',').map(r => r.trim())
      const splitPoints: number[] = []

      ranges.forEach(range => {
        const [start, end] = range.split('-').map(n => parseInt(n.trim()))
        if (end && end < pages.length) {
          splitPoints.push(end)
        }
      })

      setPages(prev =>
        prev.map(page => ({
          ...page,
          splitAfter: splitPoints.includes(page.pageNumber),
        }))
      )
    }
  }

  const handleSplit = async () => {
    const splitPoints = pages.filter(p => p.splitAfter).map(p => p.pageNumber)

    if (splitPoints.length === 0) {
      setError('Please select at least one split point')
      return
    }

    if (!uploadedFile) {
      setError('No file uploaded')
      return
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)
    setJobStatus('Uploading file...')

    try {
      // Step 1: Upload file if not already uploaded
      let fileId = uploadedFileId
      if (!fileId) {
        const formData = new FormData()
        formData.append('file', uploadedFile)

        const uploadResponse = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json()
          throw new Error(data.error || 'Failed to upload file')
        }

        const uploadData = await uploadResponse.json()
        fileId = uploadData.file.id
        setUploadedFileId(fileId)
      }

      // Step 2: Queue split job
      setJobStatus('Queuing split job...')
      const splitResponse = await fetch('/api/tools/pdf-split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          splitPoints,
        }),
      })

      if (!splitResponse.ok) {
        const data = await splitResponse.json()
        throw new Error(data.error || 'Failed to queue split job')
      }

      const splitData = await splitResponse.json()
      const jobId = splitData.jobId
      setJobId(jobId)

      // Step 3: Poll job status
      await pollJobStatus(jobId)
    } catch (err: any) {
      setError(err.message || 'Failed to split PDF')
      setJobStatus(null)
      setProcessing(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60 // 60 attempts * 2 seconds = 2 minutes max
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)

        if (!response.ok) {
          throw new Error('Failed to get job status')
        }

        const data = await response.json()
        const job = data.job

        setJobStatus(job.status === 'processing' ? 'Processing PDF...' : job.status)

        if (job.status === 'completed') {
          // Job completed successfully
          if (job.metadata?.files && Array.isArray(job.metadata.files)) {
            setDownloadUrls(job.metadata.files.map((file: any) => ({
              id: file.id,
              name: file.name,
              downloadUrl: `/api/files/download/${file.id}`,
            })))
            setSuccess(`Successfully split PDF into ${job.metadata.files.length} files!`)
          } else {
            setSuccess('PDF split completed!')
          }
          setProcessing(false)
          setJobStatus(null)
          return
        } else if (job.status === 'failed') {
          throw new Error(job.error || 'Split job failed')
        } else if (job.status === 'queued' || job.status === 'processing') {
          // Continue polling
          attempts++
          if (attempts >= maxAttempts) {
            throw new Error('Job timeout - please check back later')
          }
          setTimeout(poll, 2000) // Poll every 2 seconds
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check job status')
        setProcessing(false)
        setJobStatus(null)
      }
    }

    poll()
  }

  const clearFile = () => {
    setUploadedFile(null)
    setUploadedFileId(null)
    setPages([])
    setDownloadUrls([])
    setJobId(null)
    setJobStatus(null)
    setError(null)
    setSuccess(null)
  }

  const splitCount = pages.filter(p => p.splitAfter).length + 1

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">✂️</span>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Split PDF</h1>
              <p className="text-slate-600">Divide a PDF into multiple files</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {jobStatus && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <Loader2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
            <p className="text-sm text-blue-700">{jobStatus}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upload */}
            <div className="glass-card">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Upload PDF</h2>

              {!uploadedFile ? (
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={processing || loadingPreviews}
                  />
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition cursor-pointer bg-slate-50">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-900 font-semibold mb-1">Upload PDF File</p>
                    <p className="text-sm text-slate-500">Single file only</p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-900 font-medium truncate">{uploadedFile.name}</div>
                      <div className="text-xs text-slate-500">{pages.length} pages</div>
                    </div>
                  </div>
                  <button
                    onClick={clearFile}
                    className="ml-2 p-1 hover:bg-slate-200 rounded transition"
                    disabled={processing}
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              )}
            </div>

            {/* Split Mode */}
            {pages.length > 0 && (
              <>
                <div className="glass-card">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Split Mode</h2>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 glass hover:border-blue-500 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="splitMode"
                        value="manual"
                        checked={splitMode === 'manual'}
                        onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="text-slate-900 font-medium">Manual Selection</div>
                        <div className="text-xs text-slate-500">Click pages to split</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 glass hover:border-blue-500 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="splitMode"
                        value="every"
                        checked={splitMode === 'every'}
                        onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="text-slate-900 font-medium">Split Every N Pages</div>
                        <input
                          type="number"
                          min="1"
                          max={pages.length - 1}
                          value={everyNPages}
                          onChange={(e) => setEveryNPages(parseInt(e.target.value) || 1)}
                          className="mt-2 w-full px-3 py-1 bg-white border border-slate-200 rounded text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                          disabled={splitMode !== 'every'}
                        />
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 glass hover:border-blue-500 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="splitMode"
                        value="ranges"
                        checked={splitMode === 'ranges'}
                        onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="text-slate-900 font-medium">Page Ranges</div>
                        <input
                          type="text"
                          placeholder="e.g., 1-3, 4-6, 7-10"
                          value={rangeInput}
                          onChange={(e) => setRangeInput(e.target.value)}
                          className="mt-2 w-full px-3 py-1 bg-white border border-slate-200 rounded text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          disabled={splitMode !== 'ranges'}
                        />
                      </div>
                    </label>

                    {splitMode !== 'manual' && (
                      <button
                        onClick={applySplitMode}
                        className="w-full btn-neon py-2 text-sm"
                      >
                        Apply Split Mode
                      </button>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="glass-card">
                  <div className="text-sm text-slate-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Total Pages:</span>
                      <span className="text-slate-900 font-semibold">{pages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Split Points:</span>
                      <span className="text-blue-600 font-semibold">
                        {pages.filter(p => p.splitAfter).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Result Files:</span>
                      <span className="text-green-600 font-semibold">{splitCount}</span>
                    </div>
                  </div>
                </div>

                {/* Split Button */}
                <button
                  onClick={handleSplit}
                  disabled={processing || pages.filter(p => p.splitAfter).length === 0}
                  className="w-full btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Splitting...
                    </>
                  ) : (
                    <>
                      <Scissors className="w-5 h-5" />
                      Split into {splitCount} Files
                    </>
                  )}
                </button>

                {/* Download Links */}
                {downloadUrls.length > 0 && (
                  <div className="glass-card">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">Download Files</h3>
                    <div className="space-y-2">
                      {downloadUrls.map((file, index) => (
                        <a
                          key={file.id}
                          href={file.downloadUrl}
                          download
                          className="flex items-center justify-between p-3 glass hover:border-blue-500 rounded-lg transition"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-slate-900">{file.name || `Part ${index + 1}.pdf`}</span>
                          </div>
                          <Download className="w-4 h-4 text-blue-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Panel - Page Previews */}
          <div className="lg:col-span-2">
            <div className="glass-card">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Page Preview {pages.length > 0 && `(Click to split after page)`}
              </h2>

              {loadingPreviews && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="ml-3 text-slate-600">Loading previews...</span>
                </div>
              )}

              {!loadingPreviews && pages.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Upload a PDF file to see page previews</p>
                </div>
              )}

              {!loadingPreviews && pages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                  {pages.map((page, index) => (
                    <div key={page.pageNumber} className="space-y-2">
                      <div
                        className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition"
                        onClick={() => splitMode === 'manual' && toggleSplitAfter(page.pageNumber)}
                      >
                        <img
                          src={page.preview}
                          alt={`Page ${page.pageNumber}`}
                          className="w-full h-auto"
                        />
                        <div className="absolute inset-0 bg-slate-900 bg-opacity-0 group-hover:bg-opacity-10 transition" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-2">
                          <p className="text-xs text-white">Page {page.pageNumber}</p>
                        </div>
                      </div>

                      {page.splitAfter && index < pages.length - 1 && (
                        <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold">
                          <Scissors className="w-4 h-4" />
                          <span>Split here</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
