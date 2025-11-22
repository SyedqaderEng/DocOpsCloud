'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Loader2, Download, Mail, Trash2, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { validateFileSize } from '@/lib/utils/file-validation'
import { SubscriptionTier } from '@prisma/client'

interface PDFPagePreview {
  fileIndex: number
  fileName: string
  pageNumber: number
  preview: string // base64 or URL
  selected: boolean
}

interface UploadedPDF {
  file: File
  pageCount: number
  pages: PDFPagePreview[]
}

export default function PDFMergeTool() {
  const router = useRouter()
  const { user } = useAuth()
  const [uploadedPDFs, setUploadedPDFs] = useState<UploadedPDF[]>([])
  const [allPages, setAllPages] = useState<PDFPagePreview[]>([])
  const [processing, setProcessing] = useState(false)
  const [loadingPreviews, setLoadingPreviews] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('FREE')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')

  // Fetch user profile
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const idToken = await user.getIdToken()
        const profileRes = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${idToken}` },
        })
        if (profileRes.ok) {
          const { user: profile } = await profileRes.json()
          setUserTier(profile.subscription_tier)
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err)
      }
    }

    fetchUserData()
  }, [user])

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
            // Filter only PDF files
            const pdfFiles = data.files.filter(f => f.type === 'application/pdf')
            if (pdfFiles.length > 0) {
              await handleFiles(pdfFiles)
            }
            await fileTransferManager.deleteFiles(transferId)
            router.replace('/dashboard/tools/pdf-merge', { scroll: false })
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
    const files = Array.from(e.target.files || [])
    await handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    setError(null)

    // Validate files
    const pdfFiles = files.filter(f => f.type === 'application/pdf')
    if (pdfFiles.length === 0) {
      setError('Please upload PDF files only')
      return
    }

    // Validate file sizes
    for (const file of pdfFiles) {
      const validation = validateFileSize(file, userTier)
      if (!validation.valid) {
        setError(validation.error || 'File too large')
        return
      }
    }

    setLoadingPreviews(true)

    try {
      // Load PDF.js
      const pdfjsLib = await import('pdfjs-dist')
      // Use unpkg CDN for worker with correct .mjs extension for v5.x
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      const newPDFs: UploadedPDF[] = []
      let globalPageIndex = allPages.length

      for (let fileIndex = 0; fileIndex < pdfFiles.length; fileIndex++) {
        const file = pdfFiles[fileIndex]
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const pageCount = pdf.numPages

        const pages: PDFPagePreview[] = []

        // Generate previews for each page
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

            pages.push({
              fileIndex: uploadedPDFs.length + fileIndex,
              fileName: file.name,
              pageNumber: pageNum,
              preview,
              selected: true, // All pages selected by default
            })
          }
        }

        newPDFs.push({
          file,
          pageCount,
          pages,
        })
      }

      setUploadedPDFs(prev => [...prev, ...newPDFs])
      setAllPages(prev => [...prev, ...newPDFs.flatMap(pdf => pdf.pages)])
    } catch (err) {
      console.error('Error loading PDFs:', err)
      setError('Failed to load PDF previews. Please try again.')
    } finally {
      setLoadingPreviews(false)
    }
  }

  const togglePageSelection = (fileIndex: number, pageNumber: number) => {
    setAllPages(prev =>
      prev.map(page =>
        page.fileIndex === fileIndex && page.pageNumber === pageNumber
          ? { ...page, selected: !page.selected }
          : page
      )
    )
  }

  const removeFile = (fileIndex: number) => {
    setUploadedPDFs(prev => prev.filter((_, i) => i !== fileIndex))
    setAllPages(prev => prev.filter(page => page.fileIndex !== fileIndex))
  }

  const handleMerge = async () => {
    const selectedPages = allPages.filter(p => p.selected)

    if (selectedPages.length === 0) {
      setError('Please select at least one page to merge')
      return
    }

    setProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const idToken = await user?.getIdToken()
      if (!idToken) {
        throw new Error('Not authenticated')
      }

      const formData = new FormData()

      // Add all PDF files
      uploadedPDFs.forEach((pdf, index) => {
        formData.append('files', pdf.file)
      })

      // Add page selection info
      formData.append('selectedPages', JSON.stringify(
        selectedPages.map(p => ({
          fileIndex: p.fileIndex,
          pageNumber: p.pageNumber
        }))
      ))

      const response = await fetch('/api/tools/pdf-merge', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Merge failed')
      }

      setDownloadUrl(data.downloadUrl)
      setSuccess(`Successfully merged ${selectedPages.length} pages!`)
    } catch (err: any) {
      setError(err.message || 'Failed to merge PDFs')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank')
    }
  }

  const handleEmail = async () => {
    if (!emailAddress || !downloadUrl) return

    setProcessing(true)
    try {
      const idToken = await user?.getIdToken()
      const response = await fetch('/api/tools/email-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailAddress,
          fileUrl: downloadUrl,
          fileName: 'merged.pdf',
        }),
      })

      if (!response.ok) throw new Error('Failed to send email')

      setSuccess('Email sent successfully!')
      setShowEmailModal(false)
      setEmailAddress('')
    } catch (err) {
      setError('Failed to send email')
    } finally {
      setProcessing(false)
    }
  }

  const selectedCount = allPages.filter(p => p.selected).length
  const totalPages = allPages.length

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
            <span className="text-5xl">🔗</span>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Merge PDFs</h1>
              <p className="text-slate-600">Combine multiple PDF files into one document</p>
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload */}
          <div className="lg:col-span-1">
            <div className="glass-card">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Upload PDFs</h2>

              <label className="block mb-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={processing || loadingPreviews}
                />
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition cursor-pointer bg-slate-50">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-900 font-semibold mb-1">Upload PDF Files</p>
                  <p className="text-sm text-slate-500">Multiple files allowed</p>
                </div>
              </label>

              {/* Uploaded Files List */}
              {uploadedPDFs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Uploaded Files ({uploadedPDFs.length})
                  </h3>
                  {uploadedPDFs.map((pdf, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-900 font-medium truncate">{pdf.file.name}</div>
                          <div className="text-xs text-slate-500">{pdf.pageCount} pages</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="ml-2 p-1 hover:bg-slate-200 rounded transition"
                        disabled={processing}
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              {totalPages > 0 && (
                <div className="mt-4 p-4 glass rounded-lg">
                  <div className="text-sm text-slate-600">
                    <div className="flex justify-between mb-1">
                      <span>Total Pages:</span>
                      <span className="text-slate-900 font-semibold">{totalPages}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Selected:</span>
                      <span className="text-blue-600 font-semibold">{selectedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Will Merge:</span>
                      <span className="text-green-600 font-semibold">{selectedCount} pages</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Merge Button */}
              {totalPages > 0 && (
                <button
                  onClick={handleMerge}
                  disabled={processing || selectedCount === 0 || loadingPreviews}
                  className="w-full mt-4 btn-neon py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    `Merge ${selectedCount} Pages`
                  )}
                </button>
              )}

              {/* Download & Email */}
              {downloadUrl && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleDownload}
                    className="w-full btn-neon py-3 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Merged PDF
                  </button>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="w-full glass-card hover:border-blue-500 py-3 flex items-center justify-center gap-2 text-slate-900"
                  >
                    <Mail className="w-5 h-5" />
                    Email to Me
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Page Previews */}
          <div className="lg:col-span-2">
            <div className="glass-card">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Page Preview {totalPages > 0 && `(${selectedCount}/${totalPages} selected)`}
              </h2>

              {loadingPreviews && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <span className="ml-3 text-slate-600">Loading previews...</span>
                </div>
              )}

              {!loadingPreviews && totalPages === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Upload PDF files to see page previews</p>
                </div>
              )}

              {!loadingPreviews && totalPages > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                  {allPages.map((page, index) => (
                    <div
                      key={`${page.fileIndex}-${page.pageNumber}`}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                        page.selected
                          ? 'border-blue-500 shadow-blue'
                          : 'border-slate-200 opacity-50'
                      }`}
                      onClick={() => togglePageSelection(page.fileIndex, page.pageNumber)}
                    >
                      <img
                        src={page.preview}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-auto"
                      />
                      <div className="absolute inset-0 bg-slate-900 bg-opacity-0 group-hover:bg-opacity-10 transition flex items-center justify-center">
                        {page.selected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-2">
                        <p className="text-xs text-white truncate">{page.fileName}</p>
                        <p className="text-xs text-slate-200">Page {page.pageNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Email Merged PDF</h3>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="Enter email address"
              className="input-glass w-full"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2 glass hover:border-slate-300 rounded-lg text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEmail}
                disabled={!emailAddress || processing}
                className="flex-1 btn-neon py-2 disabled:opacity-50"
              >
                {processing ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
