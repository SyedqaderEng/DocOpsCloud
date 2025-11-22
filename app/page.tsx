'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getTotalToolCount, getAllToolsFlat } from '@/lib/tools-data'
import { TOOL_CATEGORIES } from '@/lib/config/constants'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronDown, Search, Upload, X, FileText, Image, FileSpreadsheet, File, Zap, ArrowRight, Menu } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const totalTools = getTotalToolCount()
  const allTools = getAllToolsFlat()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showToolSelection, setShowToolSelection] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Filter tools based on search
  const filteredTools = searchQuery.length > 1
    ? allTools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.id.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : []

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // File drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      // Immediately store files and redirect to tool selection
      const { fileTransferManager } = await import('@/lib/utils/file-transfer')
      const transferId = await fileTransferManager.storeFiles(files)
      router.push(`/select-tool?transfer=${transferId}`)
    }
  }, [router])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      // Immediately store files and redirect to tool selection
      const { fileTransferManager } = await import('@/lib/utils/file-transfer')
      const transferId = await fileTransferManager.storeFiles(files)
      router.push(`/select-tool?transfer=${transferId}`)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (uploadedFiles.length <= 1) setShowToolSelection(false)
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-400" />
    if (type.includes('word') || type.includes('document')) return <FileText className="w-6 h-6 text-blue-400" />
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="w-6 h-6 text-green-400" />
    if (type.includes('image')) return <Image className="w-6 h-6 text-purple-400" />
    return <File className="w-6 h-6 text-gray-400" />
  }

  const getRecommendedTools = () => {
    if (uploadedFiles.length === 0) return []
    const fileTypes = uploadedFiles.map(f => {
      if (f.type.includes('pdf')) return 'pdf'
      if (f.type.includes('word') || f.type.includes('document')) return 'word'
      if (f.type.includes('sheet') || f.type.includes('excel') || f.name.endsWith('.csv')) return 'excel'
      if (f.type.includes('image')) return 'image'
      return 'other'
    })
    const primaryType = fileTypes[0]
    return allTools.filter(tool => tool.id.startsWith(primaryType) || tool.category === primaryType).slice(0, 12)
  }

  const navigateToTool = async (toolId: string) => {
    if (uploadedFiles.length > 0) {
      // Store files in IndexedDB for transfer to tool page
      const { fileTransferManager } = await import('@/lib/utils/file-transfer')
      const transferId = await fileTransferManager.storeFiles(uploadedFiles, toolId)
      router.push(`/tools/${toolId}?transfer=${transferId}`)
    } else {
      router.push(`/tools/${toolId}`)
    }
  }

  return (
    <div className="min-h-screen gradient-animated">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 top-nav">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Doc<span className="text-neon-cyan">Ops</span>Cloud
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Search Bar */}
              <div ref={searchRef} className="relative">
                <div className={`flex items-center glass-strong border rounded-full transition-all ${searchOpen ? 'w-80 border-[#00d4ff]' : 'w-48 border-[rgba(255,255,255,0.2)]'}`}>
                  <Search className="w-5 h-5 text-gray-400 ml-4" />
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    className="w-full bg-transparent text-white placeholder-gray-400 px-3 py-2 text-sm focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="mr-3 text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchOpen && filteredTools.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-strong border border-[rgba(255,255,255,0.2)] rounded-xl overflow-hidden shadow-2xl">
                    {filteredTools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/tools/${tool.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(0,212,255,0.1)] transition border-b border-[rgba(255,255,255,0.05)] last:border-0"
                        onClick={() => setSearchOpen(false)}
                      >
                        <span className="text-2xl">{tool.icon}</span>
                        <div>
                          <div className="text-white font-medium text-sm">{tool.name}</div>
                          <div className="text-gray-400 text-xs">{tool.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                  className="flex items-center gap-1 text-gray-300 hover:text-[#00d4ff] transition font-medium px-3 py-2"
                >
                  Tools
                  <ChevronDown className={`w-4 h-4 transition-transform ${toolsMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {toolsMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-[600px] glass-strong border border-[rgba(255,255,255,0.2)] rounded-xl overflow-hidden shadow-2xl p-4">
                    <div className="grid grid-cols-2 gap-4">
                      {TOOL_CATEGORIES.map((category) => (
                        <div key={category.id}>
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[rgba(255,255,255,0.1)]">
                            <span className="text-2xl">{category.icon}</span>
                            <span className="text-white font-semibold">{category.name}</span>
                          </div>
                          <div className="space-y-1">
                            {category.subcategories.slice(0, 2).map((sub) => (
                              sub.tools.slice(0, 3).map((toolId) => (
                                <Link
                                  key={toolId}
                                  href={`/tools/${toolId}`}
                                  onClick={() => setToolsMenuOpen(false)}
                                  className="block text-sm text-gray-400 hover:text-[#00d4ff] transition py-1 truncate"
                                >
                                  {toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </Link>
                              ))
                            ))}
                            <Link
                              href={`/tools?category=${category.id}`}
                              onClick={() => setToolsMenuOpen(false)}
                              className="text-sm text-[#00d4ff] hover:underline inline-block mt-1"
                            >
                              View all {category.name} →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/tools" className="top-nav-link">All Tools</Link>
              <Link href="#features" className="top-nav-link">Features</Link>
              <Link href="#pricing" className="top-nav-link">Pricing</Link>
              <Link href="/dashboard" className="top-nav-link">Dashboard</Link>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-gray-300 hover:text-white p-2">
                <Menu className="w-6 h-6" />
              </button>
              <Link href="/auth/signin" className="hidden sm:block px-5 py-2.5 top-nav-link font-semibold">Sign In</Link>
              <Link href="/auth/signup" className="btn-neon">Start Free</Link>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
              <div className="mb-4">
                <div className="flex items-center glass-strong border border-[rgba(255,255,255,0.2)] rounded-full">
                  <Search className="w-5 h-5 text-gray-400 ml-4" />
                  <input type="text" placeholder="Search tools..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-gray-400 px-3 py-2 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Link href="/tools" className="block text-gray-300 hover:text-[#00d4ff] transition font-medium py-2">All Tools</Link>
                <Link href="#features" className="block text-gray-300 hover:text-[#00d4ff] transition font-medium py-2">Features</Link>
                <Link href="#pricing" className="block text-gray-300 hover:text-[#00d4ff] transition font-medium py-2">Pricing</Link>
                <Link href="/dashboard" className="block text-gray-300 hover:text-[#00d4ff] transition font-medium py-2">Dashboard</Link>
                <Link href="/auth/signin" className="block text-gray-300 hover:text-[#00d4ff] transition font-medium py-2">Sign In</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Upload */}
      <section className="relative overflow-hidden pt-16 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-12 fade-in">
            <div className="inline-block mb-4 px-4 py-1.5 glass-strong border border-[rgba(0,212,255,0.3)] rounded-full text-sm font-semibold text-[#00d4ff]">
              {totalTools}+ Professional Document Tools • Free to Try
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Transform Your Documents
              <br />
              <span className="text-gradient">In Seconds</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Drop your files below and get started instantly. No sign-up required for basic operations.
            </p>
          </div>

          {/* Stunning Upload Drop Zone */}
          <div className="max-w-3xl mx-auto">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer group transition-all duration-300 ${isDragging ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              {/* Animated Border */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00d4ff] via-[#a855f7] to-[#ff00ff] p-[2px] ${isDragging ? 'animate-pulse' : ''}`}>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00d4ff] via-[#a855f7] to-[#ff00ff] blur-xl opacity-50"></div>
              </div>

              <div className={`relative glass-strong rounded-2xl p-12 text-center border-2 border-transparent transition-all ${isDragging ? 'bg-[rgba(0,212,255,0.1)] border-[#00d4ff]' : 'hover:bg-[rgba(255,255,255,0.03)]'}`}>
                {/* Upload Icon */}
                <div className={`mb-6 transition-transform duration-300 ${isDragging ? 'scale-110 -translate-y-2' : 'group-hover:scale-105'}`}>
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] rounded-full blur-2xl opacity-50"></div>
                    <div className="relative w-24 h-24 rounded-full glass-strong border border-[rgba(255,255,255,0.2)] flex items-center justify-center mx-auto">
                      <Upload className={`w-12 h-12 text-[#00d4ff] transition-transform ${isDragging ? 'animate-bounce' : ''}`} />
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">
                  {isDragging ? 'Drop your files here!' : 'Drag & Drop Files Here'}
                </h3>
                <p className="text-gray-400 mb-4">or click to browse • PDF, Word, Excel, Images supported</p>

                {/* File Type Icons */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  {[
                    { icon: '📄', label: 'PDF', color: 'text-red-400' },
                    { icon: '📝', label: 'Word', color: 'text-blue-400' },
                    { icon: '📊', label: 'Excel', color: 'text-green-400' },
                    { icon: '🖼️', label: 'Images', color: 'text-purple-400' },
                  ].map((type, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-2xl mb-1">{type.icon}</span>
                      <span className={`text-xs ${type.color}`}>{type.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-[#00ff88]" />5 free operations</span>
                  <span className="flex items-center gap-1"><span className="text-[#00ff88]">✓</span>10MB max per file</span>
                </div>
              </div>

              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.webp" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 glass-strong rounded-xl p-4 border border-[rgba(255,255,255,0.1)]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold">Uploaded Files ({uploadedFiles.length})</h4>
                  <button onClick={() => { setUploadedFiles([]); setShowToolSelection(false) }} className="text-sm text-gray-400 hover:text-white transition">Clear all</button>
                </div>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between glass rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-white text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeFile(index) }} className="text-gray-400 hover:text-red-400 transition">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tool Selection After Upload */}
            {showToolSelection && uploadedFiles.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4 text-center">What would you like to do?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getRecommendedTools().map((tool) => (
                    <button key={tool.id} onClick={() => navigateToTool(tool.id)}
                      className="glass-card hover:border-[#00d4ff] hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] p-4 text-left transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{tool.name}</p>
                          <p className="text-gray-400 text-xs truncate">{tool.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#00d4ff] transition opacity-0 group-hover:opacity-100" />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <Link href="/tools" className="text-[#00d4ff] hover:underline text-sm">Browse all {totalTools}+ tools →</Link>
                </div>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
            {['No sign-up required', 'Files auto-delete in 1 hour', '256-bit encryption'].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tools Quick Access */}
      <section className="py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,212,255,0.03)] to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Popular Tools</h2>
            <p className="text-gray-400">Most used document processing tools</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { id: 'pdf-merge', name: 'Merge PDF', icon: '🔗', color: 'from-red-500/20 to-red-600/20' },
              { id: 'pdf-compress', name: 'Compress PDF', icon: '🗜️', color: 'from-red-500/20 to-red-600/20' },
              { id: 'pdf-split', name: 'Split PDF', icon: '✂️', color: 'from-red-500/20 to-red-600/20' },
              { id: 'word-to-pdf', name: 'Word to PDF', icon: '📄', color: 'from-blue-500/20 to-blue-600/20' },
              { id: 'excel-to-csv', name: 'Excel to CSV', icon: '📊', color: 'from-green-500/20 to-green-600/20' },
              { id: 'image-compress', name: 'Compress Image', icon: '🖼️', color: 'from-purple-500/20 to-purple-600/20' },
              { id: 'image-resize', name: 'Resize Image', icon: '📐', color: 'from-purple-500/20 to-purple-600/20' },
              { id: 'pdf-to-word', name: 'PDF to Word', icon: '📝', color: 'from-red-500/20 to-blue-600/20' },
              { id: 'image-convert', name: 'Convert Image', icon: '🔄', color: 'from-purple-500/20 to-purple-600/20' },
              { id: 'pdf-watermark', name: 'Add Watermark', icon: '🏷️', color: 'from-red-500/20 to-red-600/20' },
              { id: 'excel-merge', name: 'Merge Excel', icon: '📈', color: 'from-green-500/20 to-green-600/20' },
              { id: 'pdf-rotate', name: 'Rotate PDF', icon: '🔄', color: 'from-red-500/20 to-red-600/20' },
            ].map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.id}`}
                className={`glass-card hover:border-[#00d4ff] hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] p-5 text-center transition-all group bg-gradient-to-br ${tool.color}`}>
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{tool.icon}</div>
                <p className="text-white font-medium text-sm">{tool.name}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/tools" className="inline-flex items-center gap-2 px-6 py-3 glass-strong border border-[rgba(255,255,255,0.2)] text-white rounded-full hover:border-[#00d4ff] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition font-semibold">
              View All {totalTools}+ Tools
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* All Tools Section */}
      <section id="tools" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">All <span className="text-gradient">{totalTools}+</span> Tools</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Click any tool to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {TOOL_CATEGORIES.map((category) => (
              <div key={category.id} className="glass-card hover:border-[#00d4ff]">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[rgba(255,255,255,0.1)]">
                  <div className="text-5xl p-4 rounded-2xl glass-strong border border-[rgba(255,255,255,0.2)]">{category.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                    <p className="text-gray-300">{category.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {category.subcategories.map((subcategory, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.color}`}></span>
                        {subcategory.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {subcategory.tools.map((toolId) => (
                          <Link key={toolId} href={`/tools/${toolId}`}
                            className="group px-4 py-2.5 glass hover:glass-strong hover:border-[#00d4ff] rounded-lg transition-all text-sm font-medium text-gray-300 hover:text-[#00d4ff] flex items-center justify-between">
                            <span className="truncate">{toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,212,255,0.05)] to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Why Choose <span className="text-gradient">DocOpsCloud</span>?</h2>
            <p className="text-xl text-gray-300">Enterprise-grade document processing, simplified</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "⚡", title: "Lightning Fast", description: "Process documents in seconds with our optimized infrastructure" },
              { icon: "🔒", title: "100% Secure", description: "End-to-end encryption with automatic file deletion" },
              { icon: "☁️", title: "Cloud-Based", description: "No installation needed. Works on any device, anywhere" },
              { icon: "🎯", title: "Batch Processing", description: "Handle multiple files simultaneously to save time" },
              { icon: "📱", title: "Mobile Friendly", description: "Full functionality on desktop, tablet, and mobile" },
              { icon: "🔌", title: "API Access", description: "Integrate with your workflow via our RESTful API" }
            ].map((feature, i) => (
              <div key={i} className="glass-card hover:border-[#00d4ff]">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Simple, <span className="text-gradient">Transparent</span> Pricing</h2>
            <p className="text-xl text-gray-300">Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="glass-card">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="mb-6"><span className="text-5xl font-extrabold text-gradient">$0</span><span className="text-gray-400">/forever</span></div>
              <ul className="space-y-3 mb-8 text-gray-300">
                {['5 operations/day', 'All tools included', '10MB max file size', 'Basic support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 glass-strong border border-[rgba(255,255,255,0.2)] text-white rounded-lg hover:border-[#00d4ff] transition font-semibold text-center">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="glass-strong border-2 border-[#00d4ff] rounded-2xl p-8 text-white relative transform scale-105 shadow-[0_0_50px_rgba(0,212,255,0.3)] pulse-glow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-4 py-1 rounded-full text-sm font-bold">MOST POPULAR</div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6"><span className="text-5xl font-extrabold text-gradient">$79</span><span className="opacity-90">/year</span></div>
              <ul className="space-y-3 mb-8">
                {['1000 operations/month', '500MB max file size', 'Priority processing', 'API access', 'Email support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="btn-neon block w-full text-center py-3">Start Free Trial</Link>
            </div>

            {/* Business */}
            <div className="glass-card">
              <h3 className="text-2xl font-bold text-white mb-2">Business</h3>
              <div className="mb-6"><span className="text-5xl font-extrabold text-gradient">$299</span><span className="text-gray-400">/year</span></div>
              <ul className="space-y-3 mb-8 text-gray-300">
                {['Unlimited operations', '2GB max file size', '20 concurrent jobs', 'Custom branding', 'Priority support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="btn-neon block w-full text-center py-3">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,212,255,0.1)] via-[rgba(168,85,247,0.1)] to-[rgba(255,0,255,0.1)]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">Ready to <span className="text-gradient">Transform</span> Your Documents?</h2>
          <p className="text-xl mb-10 text-gray-300">Join thousands of users processing millions of documents with DocOpsCloud</p>
          <Link href="/auth/signup" className="btn-neon inline-block px-10 py-4 text-lg">Start Free Today - No Credit Card Required</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-strong border-t border-[rgba(255,255,255,0.1)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">Doc<span className="text-gradient">Ops</span>Cloud</div>
              <p className="text-sm text-gray-400">Professional document processing platform with {totalTools}+ tools.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Tools</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/tools?category=pdf" className="text-gray-400 hover:text-[#00d4ff] transition">PDF Tools</Link></li>
                <li><Link href="/tools?category=word" className="text-gray-400 hover:text-[#00d4ff] transition">Word Tools</Link></li>
                <li><Link href="/tools?category=excel" className="text-gray-400 hover:text-[#00d4ff] transition">Excel Tools</Link></li>
                <li><Link href="/tools?category=image" className="text-gray-400 hover:text-[#00d4ff] transition">Image Tools</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-gray-400 hover:text-[#00d4ff] transition">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-[#00d4ff] transition">Pricing</Link></li>
                <li><Link href="/dashboard" className="text-gray-400 hover:text-[#00d4ff] transition">Dashboard</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[rgba(255,255,255,0.1)] pt-8 text-center text-sm text-gray-400">
            <p>© 2025 DocOpsCloud. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
