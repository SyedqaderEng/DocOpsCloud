'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getAllToolsFlat, getTotalToolCount } from '@/lib/tools-data'
import { TOOL_CATEGORIES } from '@/lib/config/constants'
import { useState, useMemo } from 'react'
import { Search, ArrowRight, ArrowLeft, Filter } from 'lucide-react'

export default function AllToolsPage() {
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get('category')
  const allTools = getAllToolsFlat()
  const totalTools = getTotalToolCount()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all')

  const filteredTools = useMemo(() => {
    let tools = allTools
    if (selectedCategory !== 'all') {
      tools = tools.filter(t => t.category === selectedCategory)
    }
    if (searchQuery.length > 1) {
      const query = searchQuery.toLowerCase()
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      )
    }
    return tools
  }, [allTools, selectedCategory, searchQuery])

  const categories = [
    { id: 'all', name: 'All Tools', icon: '🛠️', count: totalTools },
    { id: 'pdf', name: 'PDF Tools', icon: '📄', count: TOOL_CATEGORIES.find(c => c.id === 'pdf')?.subcategories.flatMap(s => s.tools).length || 0 },
    { id: 'word', name: 'Word Tools', icon: '📝', count: TOOL_CATEGORIES.find(c => c.id === 'word')?.subcategories.flatMap(s => s.tools).length || 0 },
    { id: 'excel', name: 'Excel Tools', icon: '📊', count: TOOL_CATEGORIES.find(c => c.id === 'excel')?.subcategories.flatMap(s => s.tools).length || 0 },
    { id: 'image', name: 'Image Tools', icon: '🖼️', count: TOOL_CATEGORIES.find(c => c.id === 'image')?.subcategories.flatMap(s => s.tools).length || 0 },
  ]

  return (
    <div className="min-h-screen gradient-animated">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-[rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Doc<span className="text-neon-cyan">Ops</span>Cloud
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">Home</Link>
              <Link href="/tools" className="text-[#00d4ff] font-medium">All Tools</Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">Dashboard</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="hidden sm:block px-5 py-2.5 text-gray-200 hover:text-[#00d4ff] transition font-semibold">Sign In</Link>
              <Link href="/auth/signup" className="btn-neon">Start Free</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] transition mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            All <span className="text-gradient">{totalTools}+</span> Tools
          </h1>
          <p className="text-xl text-gray-300">
            Find the perfect tool for your document processing needs
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-strong border border-[rgba(255,255,255,0.2)] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00d4ff] transition"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 glass-strong border border-[rgba(255,255,255,0.2)] rounded-xl text-white bg-transparent focus:outline-none focus:border-[#00d4ff] transition cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-gray-900">
                  {cat.icon} {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#a855f7] text-white shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                  : 'glass-strong border border-[rgba(255,255,255,0.2)] text-gray-300 hover:border-[#00d4ff] hover:text-[#00d4ff]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="text-xs opacity-75">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing <span className="text-white font-semibold">{filteredTools.length}</span> tools
            {searchQuery && <span> matching "{searchQuery}"</span>}
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.id}`}
              className="glass-card hover:border-[#00d4ff] hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] p-5 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl group-hover:scale-110 transition-transform">
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold mb-1 truncate">{tool.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{tool.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full glass-strong ${
                      tool.category === 'pdf' ? 'text-red-400 border border-red-400/30' :
                      tool.category === 'word' ? 'text-blue-400 border border-blue-400/30' :
                      tool.category === 'excel' ? 'text-green-400 border border-green-400/30' :
                      'text-purple-400 border border-purple-400/30'
                    }`}>
                      {tool.category.toUpperCase()}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-[#00d4ff] transition opacity-0 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No tools found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="glass-strong border-t border-[rgba(255,255,255,0.1)] py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          <p>© 2025 DocOpsCloud. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
