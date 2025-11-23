'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 top-nav">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Doc<span className="text-gradient">Ops</span>Cloud
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Search Bar */}
              <div ref={searchRef} className="relative">
                <div className={`flex items-center glass-strong rounded-full transition-all ${searchOpen ? 'w-80' : 'w-48'}`}>
                  <Search className="w-5 h-5 ml-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    className="w-full bg-transparent placeholder-slate-400 px-3 py-2 text-sm focus:outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="mr-3 text-slate-400 hover:text-slate-900">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchOpen && filteredTools.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 glass-strong rounded-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {filteredTools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={user ? `/dashboard/tools/${tool.id}` : `/tools/${tool.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition border-b last:border-0 cursor-pointer"
                        style={{ borderColor: 'var(--shadow-dark)' }}
                        onClick={() => setSearchOpen(false)}
                      >
                        <span className="text-2xl">{tool.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{tool.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tool.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4" style={{ color: 'var(--accent-sage)' }} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* PDF Dropdown */}
              <div className="relative" onMouseEnter={() => setActiveDropdown('pdf')} onMouseLeave={() => setActiveDropdown(null)}>
                <button className="top-nav-link flex items-center gap-1">
                  📄 PDF <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'pdf' && (
                  <div className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-xl z-50 p-3 max-h-96 overflow-y-auto">
                    <div className="grid gap-1">
                      {allTools.filter(t => t.id.startsWith('pdf-')).slice(0, 10).map((tool) => (
                        <Link
                          key={tool.id}
                          href={user ? `/dashboard/tools/${tool.id}` : `/tools/${tool.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                        >
                          <span className="text-lg">{tool.icon}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
                        </Link>
                      ))}
                      <Link href="/tools" className="text-xs hover:underline px-3 py-2 mt-1" style={{ color: 'var(--accent-sage)' }}>View all PDF tools →</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Images Dropdown */}
              <div className="relative" onMouseEnter={() => setActiveDropdown('image')} onMouseLeave={() => setActiveDropdown(null)}>
                <button className="top-nav-link flex items-center gap-1">
                  🖼️ Images <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'image' && (
                  <div className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-xl z-50 p-3 max-h-96 overflow-y-auto">
                    <div className="grid gap-1">
                      {allTools.filter(t => t.id.startsWith('image-')).slice(0, 10).map((tool) => (
                        <Link
                          key={tool.id}
                          href={user ? `/dashboard/tools/${tool.id}` : `/tools/${tool.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                        >
                          <span className="text-lg">{tool.icon}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
                        </Link>
                      ))}
                      <Link href="/tools" className="text-xs hover:underline px-3 py-2 mt-1" style={{ color: 'var(--accent-sage)' }}>View all image tools →</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Dropdown */}
              <div className="relative" onMouseEnter={() => setActiveDropdown('video')} onMouseLeave={() => setActiveDropdown(null)}>
                <button className="top-nav-link flex items-center gap-1">
                  🎥 Video <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'video' && (
                  <div className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-xl z-50 p-3 max-h-96 overflow-y-auto">
                    <div className="grid gap-1">
                      {allTools.filter(t => t.id.startsWith('video-')).slice(0, 10).map((tool) => (
                        <Link
                          key={tool.id}
                          href={user ? `/dashboard/tools/${tool.id}` : `/tools/${tool.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                        >
                          <span className="text-lg">{tool.icon}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
                        </Link>
                      ))}
                      <Link href="/tools" className="text-xs hover:underline px-3 py-2 mt-1" style={{ color: 'var(--accent-sage)' }}>View all video tools →</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Dropdown */}
              <div className="relative" onMouseEnter={() => setActiveDropdown('audio')} onMouseLeave={() => setActiveDropdown(null)}>
                <button className="top-nav-link flex items-center gap-1">
                  🎵 Audio <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'audio' && (
                  <div className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-xl z-50 p-3 max-h-96 overflow-y-auto">
                    <div className="grid gap-1">
                      {allTools.filter(t => t.id.startsWith('audio-')).slice(0, 10).map((tool) => (
                        <Link
                          key={tool.id}
                          href={user ? `/dashboard/tools/${tool.id}` : `/tools/${tool.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                        >
                          <span className="text-lg">{tool.icon}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
                        </Link>
                      ))}
                      <Link href="/tools" className="text-xs hover:underline px-3 py-2 mt-1" style={{ color: 'var(--accent-sage)' }}>View all audio tools →</Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Utilities Dropdown */}
              <div className="relative" onMouseEnter={() => setActiveDropdown('utility')} onMouseLeave={() => setActiveDropdown(null)}>
                <button className="top-nav-link flex items-center gap-1">
                  🔧 Utilities <ChevronDown className="w-4 h-4" />
                </button>
                {activeDropdown === 'utility' && (
                  <div className="absolute top-full left-0 mt-2 w-64 glass-strong rounded-xl z-50 p-3 max-h-96 overflow-y-auto">
                    <div className="grid gap-1">
                      {allTools.filter(t => ['text-analyzer', 'hash-generator', 'qr-generator', 'json-formatter', 'password-generator', 'uuid-generator', 'base64-encode', 'url-encoder'].includes(t.id)).map((tool) => (
                        <Link
                          key={tool.id}
                          href={user ? `/dashboard/tools/${tool.id}` : `/tools/${tool.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition"
                        >
                          <span className="text-lg">{tool.icon}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tool.name}</span>
                        </Link>
                      ))}
                      <Link href="/tools" className="text-xs hover:underline px-3 py-2 mt-1" style={{ color: 'var(--accent-sage)' }}>View all utilities →</Link>
                    </div>
                  </div>
                )}
              </div>

              <Link href="#pricing" className="top-nav-link">Pricing</Link>
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
                <a href="#tools" className="block text-gray-300 hover:text-[#00d4ff] transition font-medium py-2">Browse Tools</a>
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
            <div className="inline-block mb-4 px-4 py-1.5 neu-badge-accent rounded-full text-sm font-semibold">
              {totalTools}+ Professional Document Tools • Free to Try
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
              Transform Your Documents
              <br />
              <span className="text-gradient">In Seconds</span>
            </h1>
            <p className="text-xl mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Browse {totalTools}+ tools below or drop files here. No sign-up required for 5 free operations.
            </p>
          </div>

          {/* Stunning Upload Drop Zone */}
          <div className="max-w-3xl mx-auto">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer group transition-all duration-300 ${isDragging ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              <div className={`neu-card-lg text-center transition-all ${isDragging ? 'neu-pulse' : ''}`}>
                {/* Upload Icon */}
                <div className={`mb-6 transition-transform duration-300 ${isDragging ? 'scale-110 -translate-y-2' : 'group-hover:scale-105'}`}>
                  <div className="relative inline-block">
                    <div className="relative w-24 h-24 rounded-full neu-card flex items-center justify-center mx-auto">
                      <Upload className={`w-12 h-12 transition-transform ${isDragging ? 'animate-bounce' : ''}`} style={{ color: 'var(--accent-sage)' }} />
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {isDragging ? 'Drop your files here!' : 'Drag & Drop Files Here'}
                </h3>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>or click to browse • PDF, Word, Excel, Images supported</p>

                {/* File Type Icons */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  {[
                    { icon: '📄', label: 'PDF' },
                    { icon: '📝', label: 'Word' },
                    { icon: '📊', label: 'Excel' },
                    { icon: '🖼️', label: 'Images' },
                  ].map((type, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className="text-2xl mb-1">{type.icon}</span>
                      <span className="text-xs" style={{ color: 'var(--accent-sage)' }}>{type.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1"><Zap className="w-4 h-4" style={{ color: 'var(--accent-sage)' }} />5 free operations</span>
                  <span className="flex items-center gap-1"><span style={{ color: 'var(--accent-sage)' }}>✓</span>10MB max per file</span>
                </div>
              </div>

              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.webp" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6 neu-card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Uploaded Files ({uploadedFiles.length})</h4>
                  <button onClick={() => { setUploadedFiles([]); setShowToolSelection(false) }} className="text-sm transition hover:underline" style={{ color: 'var(--text-muted)' }}>Clear all</button>
                </div>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between neu-card-sm">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeFile(index) }} className="transition" style={{ color: 'var(--text-muted)' }}>
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
                <h3 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--text-primary)' }}>What would you like to do?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getRecommendedTools().map((tool) => (
                    <button key={tool.id} onClick={() => navigateToTool(tool.id)}
                      className="neu-card-sm hover:neu-pulse p-4 text-left transition-all group">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{tool.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{tool.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{tool.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 transition opacity-0 group-hover:opacity-100" style={{ color: 'var(--accent-sage)' }} />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <Link href="/tools" className="hover:underline text-sm" style={{ color: 'var(--accent-sage)' }}>Browse all {totalTools}+ tools →</Link>
                </div>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            {['No sign-up required', 'Files auto-delete in 1 hour', '256-bit encryption'].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: 'var(--accent-sage)' }} fill="currentColor" viewBox="0 0 20 20">
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
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: 'var(--text-primary)' }}>Popular Tools</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Most used document processing tools</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { id: 'pdf-merge', name: 'Merge PDF', icon: '🔗' },
              { id: 'pdf-compress', name: 'Compress PDF', icon: '🗜️' },
              { id: 'pdf-split', name: 'Split PDF', icon: '✂️' },
              { id: 'word-to-pdf', name: 'Word to PDF', icon: '📄' },
              { id: 'excel-to-csv', name: 'Excel to CSV', icon: '📊' },
              { id: 'image-compress', name: 'Compress Image', icon: '🖼️' },
              { id: 'image-resize', name: 'Resize Image', icon: '📐' },
              { id: 'pdf-to-word', name: 'PDF to Word', icon: '📝' },
              { id: 'image-convert', name: 'Convert Image', icon: '🔄' },
              { id: 'pdf-watermark', name: 'Add Watermark', icon: '🏷️' },
              { id: 'excel-merge', name: 'Merge Excel', icon: '📈' },
              { id: 'pdf-rotate', name: 'Rotate PDF', icon: '🔄' },
            ].map((tool) => (
              <Link key={tool.id} href={user ? `/dashboard/tools/${tool.id}` : `/tools/${tool.id}`}
                className="neu-card-sm hover:neu-pulse p-5 text-center transition-all group">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{tool.icon}</div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{tool.name}</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/tools" className="inline-flex items-center gap-2 neu-btn-accent px-6 py-3 rounded-full font-semibold">
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
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>All <span className="text-gradient">{totalTools}+</span> Tools</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>Click any tool to get started</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {TOOL_CATEGORIES.map((category) => (
              <div key={category.id} className="neu-card">
                <div className="flex items-center gap-4 mb-6 pb-6 neu-separator">
                  <div className="text-5xl p-4 rounded-2xl neu-card-sm">{category.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{category.name}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>{category.description}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {category.subcategories.map((subcategory, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-sage)' }}></span>
                        {subcategory.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {subcategory.tools.map((toolId) => (
                          <Link key={toolId} href={user ? `/dashboard/tools/${toolId}` : `/tools/${toolId}`}
                            className="group px-4 py-2.5 neu-card-sm hover:neu-pulse rounded-lg transition-all text-sm font-medium flex items-center justify-between"
                            style={{ color: 'var(--text-secondary)' }}>
                            <span className="truncate">{toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--accent-sage)' }} />
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
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>Why Choose <span className="text-gradient">DocOpsCloud</span>?</h2>
            <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>Enterprise-grade document processing, simplified</p>
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
              <div key={i} className="neu-card hover:neu-pulse">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: 'var(--text-primary)' }}>Simple, <span className="text-gradient">Transparent</span> Pricing</h2>
            <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>Start free, upgrade when you need more</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="neu-card">
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Free</h3>
              <div className="mb-6"><span className="text-5xl font-extrabold text-gradient">$0</span><span style={{ color: 'var(--text-muted)' }}>/forever</span></div>
              <ul className="space-y-3 mb-8" style={{ color: 'var(--text-secondary)' }}>
                {['5 operations/day', 'All tools included', '10MB max file size', 'Basic support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: 'var(--accent-sage)' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 neu-btn rounded-lg font-semibold text-center">Get Started</Link>
            </div>

            {/* Pro */}
            <div className="neu-card-lg relative transform scale-105 neu-pulse" style={{ border: '2px solid var(--accent-sage)' }}>
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 neu-badge-accent px-4 py-1 rounded-full text-sm font-bold">MOST POPULAR</div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Pro</h3>
              <div className="mb-6"><span className="text-5xl font-extrabold text-gradient">$79</span><span style={{ color: 'var(--text-secondary)' }}>/year</span></div>
              <ul className="space-y-3 mb-8" style={{ color: 'var(--text-secondary)' }}>
                {['1000 operations/month', '500MB max file size', 'Priority processing', 'API access', 'Email support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: 'var(--accent-sage)' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="btn-neon block w-full text-center py-3">Start Free Trial</Link>
            </div>

            {/* Business */}
            <div className="neu-card">
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Business</h3>
              <div className="mb-6"><span className="text-5xl font-extrabold text-gradient">$299</span><span style={{ color: 'var(--text-muted)' }}>/year</span></div>
              <ul className="space-y-3 mb-8" style={{ color: 'var(--text-secondary)' }}>
                {['Unlimited operations', '2GB max file size', '20 concurrent jobs', 'Custom branding', 'Priority support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: 'var(--accent-sage)' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
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
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6" style={{ color: 'var(--text-primary)' }}>Ready to <span className="text-gradient">Transform</span> Your Documents?</h2>
          <p className="text-xl mb-10" style={{ color: 'var(--text-secondary)' }}>Join thousands of users processing millions of documents with DocOpsCloud</p>
          <Link href="/auth/signup" className="btn-neon inline-block px-10 py-4 text-lg">Start Free Today - No Credit Card Required</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-strong py-12 px-6" style={{ borderTop: '1px solid var(--shadow-dark)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Doc<span className="text-gradient">Ops</span>Cloud</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Professional document processing platform with {totalTools}+ tools.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Tools</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/tools?category=pdf" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>PDF Tools</Link></li>
                <li><Link href="/tools?category=word" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Word Tools</Link></li>
                <li><Link href="/tools?category=excel" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Excel Tools</Link></li>
                <li><Link href="/tools?category=image" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Image Tools</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Features</Link></li>
                <li><Link href="#pricing" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Pricing</Link></li>
                <li><Link href="/dashboard" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Dashboard</Link></li>
                <li><a href="#" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</a></li>
                <li><a href="#" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Terms of Service</a></li>
                <li><a href="#" className="transition hover:underline" style={{ color: 'var(--text-secondary)' }}>Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 text-center text-sm" style={{ borderTop: '1px solid var(--shadow-dark)', color: 'var(--text-muted)' }}>
            <p>© 2025 DocOpsCloud. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
