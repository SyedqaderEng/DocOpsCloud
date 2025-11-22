'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/firebase/AuthContext'
import Link from 'next/link'
import AdvancedSearch from '@/components/search/AdvancedSearch'
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  ArrowRight,
} from 'lucide-react'

interface SearchFilters {
  query: string
  fileType?: string[]
  dateRange?: { from: string; to: string }
  sizeRange?: { min: number; max: number }
  status?: string[]
  operation?: string[]
  sortBy?: 'date' | 'name' | 'size'
  sortOrder?: 'asc' | 'desc'
}

interface FileResult {
  type: 'file'
  id: string
  name: string
  fileType: string
  size: number
  uploadStatus: string
  processingStatus: string
  thumbnailUrl?: string
  s3Url: string
  createdAt: string
  expiresAt: string
  recentJob: any
}

interface JobResult {
  type: 'job'
  id: string
  operationType: string
  status: string
  progress: number
  errorMessage?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  inputFile: any
  outputFile: any
}

type SearchResult = FileResult | JobResult

export default function SearchPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (filters: SearchFilters) => {
    try {
      setLoading(true)
      setError(null)
      setSearched(true)

      const idToken = await user?.getIdToken()

      // Build query params
      const params = new URLSearchParams()
      if (filters.query) params.append('query', filters.query)
      if (filters.fileType?.length) params.append('fileType', filters.fileType.join(','))
      if (filters.status?.length) params.append('status', filters.status.join(','))
      if (filters.dateRange?.from) params.append('dateFrom', filters.dateRange.from)
      if (filters.dateRange?.to) params.append('dateTo', filters.dateRange.to)
      if (filters.sizeRange?.min) params.append('sizeMin', filters.sizeRange.min.toString())
      if (filters.sizeRange?.max) params.append('sizeMax', filters.sizeRange.max.toString())
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const res = await fetch(`/api/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Search failed')
      }

      // Combine files and jobs into single results array
      const combinedResults: SearchResult[] = [
        ...data.data.files,
        ...data.data.jobs,
      ]

      setResults(combinedResults)
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-[#ff0055]" />
      case 'processing':
        return <Activity className="w-5 h-5 text-[#00d4ff] animate-pulse" />
      case 'queued':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen gradient-animated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Search Files & Jobs</h1>
          <p className="text-gray-300">
            Find files and processing jobs with powerful filters
          </p>
        </div>

        {/* Search Component */}
        <div className="mb-8">
          <AdvancedSearch onSearch={handleSearch} placeholder="Search by filename or operation..." />
        </div>

        {/* Results */}
        {loading ? (
          <div className="glass-card text-center py-12">
            <div className="w-12 h-12 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Searching...</p>
          </div>
        ) : error ? (
          <div className="glass-card border border-[#ff0055] text-center py-12">
            <XCircle className="w-16 h-16 text-[#ff0055] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Search Error</h3>
            <p className="text-gray-400">{error}</p>
          </div>
        ) : !searched ? (
          <div className="glass-card text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Ready to Search</h3>
            <p className="text-gray-400">
              Enter a search query and apply filters to find your files and jobs
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="glass-card text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
            <p className="text-gray-400">
              Try adjusting your search filters or search for something else
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                {results.length} Result{results.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {results.map((result) =>
              result.type === 'file' ? (
                // File Result
                <div key={`file-${result.id}`} className="glass-card border-2 border-transparent hover:border-[#00d4ff] transition">
                  <div className="flex items-start gap-4">
                    {result.thumbnailUrl && (
                      <img
                        src={result.thumbnailUrl}
                        alt={result.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[#00d4ff]" />
                            {result.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {result.fileType} • {formatFileSize(result.size)} • Uploaded{' '}
                            {formatDate(result.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.processingStatus)}
                          <span className="text-sm text-gray-300">
                            {result.processingStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={result.s3Url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg text-sm font-semibold transition flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                        <Link
                          href={`/dashboard/files/${result.id}`}
                          className="px-4 py-2 glass-strong hover:bg-[rgba(0,212,255,0.1)] text-white rounded-lg text-sm font-semibold transition flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Job Result
                <div key={`job-${result.id}`} className="glass-card border-2 border-transparent hover:border-[#a855f7] transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        {result.operationType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Started {formatDate(result.createdAt)}
                        {result.completedAt && ` • Completed ${formatDate(result.completedAt)}`}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        result.status === 'COMPLETE'
                          ? 'bg-[#00ff88] text-black'
                          : result.status === 'FAILED'
                          ? 'bg-[#ff0055] text-white'
                          : result.status === 'PROCESSING'
                          ? 'bg-[#00d4ff] text-black'
                          : 'bg-yellow-500 text-black'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>

                  {result.inputFile && (
                    <div className="glass-strong p-3 rounded-lg mb-3">
                      <p className="text-xs text-gray-400 mb-1">Input File:</p>
                      <p className="text-white text-sm">
                        {result.inputFile.name} ({formatFileSize(result.inputFile.size)})
                      </p>
                    </div>
                  )}

                  {result.errorMessage && (
                    <div className="glass-strong p-3 rounded-lg mb-3 border border-[#ff0055]">
                      <p className="text-xs text-[#ff0055] mb-1">Error:</p>
                      <p className="text-white text-sm">{result.errorMessage}</p>
                    </div>
                  )}

                  <Link
                    href={`/dashboard/jobs/${result.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white rounded-lg text-sm font-semibold hover:from-[#00e5ff] hover:to-[#b966ff] transition"
                  >
                    View Job Details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
