'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  X,
  Calendar,
  FileType,
  Folder,
  Tag,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react'

interface SearchFilters {
  query: string
  fileType?: string[]
  dateRange?: {
    from: string
    to: string
  }
  sizeRange?: {
    min: number
    max: number
  }
  status?: string[]
  operation?: string[]
  sortBy?: 'date' | 'name' | 'size'
  sortOrder?: 'asc' | 'desc'
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  placeholder?: string
}

export default function AdvancedSearch({ onSearch, placeholder = 'Search files...' }: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    sortBy: 'date',
    sortOrder: 'desc',
  })

  const handleSearch = () => {
    onSearch({ ...filters, query })
  }

  const handleClearFilters = () => {
    setFilters({
      query: '',
      sortBy: 'date',
      sortOrder: 'desc',
    })
    setQuery('')
    onSearch({
      query: '',
      sortBy: 'date',
      sortOrder: 'desc',
    })
  }

  const toggleFileType = (type: string) => {
    const current = filters.fileType || []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    setFilters({ ...filters, fileType: updated.length > 0 ? updated : undefined })
  }

  const toggleStatus = (status: string) => {
    const current = filters.status || []
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setFilters({ ...filters, status: updated.length > 0 ? updated : undefined })
  }

  const activeFilterCount =
    (filters.fileType?.length || 0) +
    (filters.status?.length || 0) +
    (filters.dateRange ? 1 : 0) +
    (filters.sizeRange ? 1 : 0) +
    (filters.operation?.length || 0)

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-3 glass-strong rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
            showFilters || activeFilterCount > 0
              ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
              : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-white text-[#00d4ff] text-xs rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          onClick={handleSearch}
          className="px-6 py-3 btn-neon rounded-lg font-semibold"
        >
          Search
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="glass-card border-2 border-[#00d4ff] animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#00d4ff]" />
              <h3 className="text-white font-semibold">Advanced Filters</h3>
            </div>
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* File Type Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <FileType className="w-4 h-4" />
                File Type
              </label>
              <div className="flex flex-wrap gap-2">
                {['PDF', 'DOCX', 'XLSX', 'CSV', 'IMAGE'].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFileType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                      filters.fileType?.includes(type)
                        ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                        : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <Tag className="w-4 h-4" />
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['COMPLETE', 'PROCESSING', 'FAILED', 'QUEUED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                      filters.status?.includes(status)
                        ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white'
                        : 'glass-strong text-gray-300 hover:bg-[rgba(0,212,255,0.1)]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateRange?.from || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      dateRange: { from: e.target.value, to: filters.dateRange?.to || '' },
                    })
                  }
                  className="flex-1 px-3 py-2 glass-strong rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
                <span className="text-gray-400 self-center">to</span>
                <input
                  type="date"
                  value={filters.dateRange?.to || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      dateRange: { from: filters.dateRange?.from || '', to: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-2 glass-strong rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <Folder className="w-4 h-4" />
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value as 'date' | 'name' | 'size' })
                  }
                  className="flex-1 px-3 py-2 glass-strong rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc' })
                  }
                  className="px-3 py-2 glass-strong rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.fileType?.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-[#00d4ff] text-white text-xs rounded-full flex items-center gap-1"
                  >
                    {type}
                    <button onClick={() => toggleFileType(type)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {filters.status?.map((status) => (
                  <span
                    key={status}
                    className="px-2 py-1 bg-[#a855f7] text-white text-xs rounded-full flex items-center gap-1"
                  >
                    {status}
                    <button onClick={() => toggleStatus(status)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {filters.dateRange && (
                  <span className="px-2 py-1 bg-[#00ff88] text-black text-xs rounded-full flex items-center gap-1">
                    {filters.dateRange.from} to {filters.dateRange.to}
                    <button
                      onClick={() => setFilters({ ...filters, dateRange: undefined })}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
