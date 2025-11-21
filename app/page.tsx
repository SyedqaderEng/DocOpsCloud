'use client'

import Link from 'next/link'
import { getTotalToolCount } from '@/lib/tools-data'
import { TOOL_CATEGORIES } from '@/lib/config/constants'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function HomePage() {
  const totalTools = getTotalToolCount()
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  return (
    <div className="min-h-screen gradient-animated">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-[rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Doc<span className="text-neon-cyan">Ops</span>Cloud
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#tools" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">
                All Tools
              </Link>
              <Link href="#features" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-[#00d4ff] transition font-medium">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="px-5 py-2.5 text-gray-200 hover:text-[#00d4ff] transition font-semibold"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="btn-neon"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16 fade-in">
            <div className="inline-block mb-4 px-4 py-1.5 glass-strong border border-[rgba(0,212,255,0.3)] rounded-full text-sm font-semibold text-[#00d4ff]">
              {totalTools}+ Professional Document Tools
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Complete Document
              <br />
              <span className="text-gradient">Processing Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed">
              Transform, merge, compress, and optimize PDFs, Word documents, Excel spreadsheets, and images.
              All in one powerful, secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="btn-neon text-lg px-8 py-4"
              >
                Get Started Free →
              </Link>
              <Link
                href="#tools"
                className="px-8 py-4 glass-strong border border-[rgba(255,255,255,0.2)] text-white rounded-lg hover:border-[#00d4ff] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition font-semibold text-lg"
              >
                Browse All Tools
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">10 free operations</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Files auto-delete in 24h</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] blur-3xl opacity-20"></div>
            <div className="relative glass-strong rounded-2xl shadow-2xl border border-[rgba(0,212,255,0.3)] overflow-hidden glow-cyan">
              <div className="glass-strong px-6 py-4 border-b border-[rgba(255,255,255,0.1)] flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-[#00ff88]"></div>
                </div>
                <div className="ml-4 text-sm text-gray-300 font-medium">dashboard.docopscloud.com</div>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {['Total Files', 'Processing', 'Operations', 'Storage'].map((stat, i) => (
                    <div key={i} className="glass rounded-lg p-4 border border-[rgba(255,255,255,0.1)] hover:border-[#00d4ff] transition">
                      <div className="text-2xl font-bold text-gradient">{['47', '3', '234', '2.3GB'][i]}</div>
                      <div className="text-xs text-gray-400 mt-1">{stat}</div>
                    </div>
                  ))}
                </div>
                <div className="glass rounded-lg border border-[rgba(255,255,255,0.1)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Recent Activity</h3>
                    <span className="text-sm text-gradient font-semibold">View all →</span>
                  </div>
                  <div className="space-y-3">
                    {['document.pdf', 'spreadsheet.xlsx', 'photo.jpg'].map((file, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg glass-strong border border-[rgba(0,212,255,0.3)] flex items-center justify-center text-lg">
                            {['📄', '📊', '🖼️'][i]}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{file}</div>
                            <div className="text-xs text-gray-400">{['Compressed', 'Converted', 'Optimized'][i]}</div>
                          </div>
                        </div>
                        <span className="px-2 py-1 glass-strong border border-[rgba(0,255,136,0.5)] text-[#00ff88] rounded text-xs font-medium">
                          ✓ Complete
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Tools Section - Category Based Navigation */}
      <section id="tools" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              All <span className="text-gradient">{totalTools}+</span> Tools at Your Fingertips
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional document processing tools organized by category. Click any category to explore available tools.
            </p>
          </div>

          {/* Category Grid with Subcategories */}
          <div className="grid md:grid-cols-2 gap-8">
            {TOOL_CATEGORIES.map((category) => (
              <div
                key={category.id}
                className="glass-card hover:border-[#00d4ff]"
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[rgba(255,255,255,0.1)]">
                  <div className={`text-5xl p-4 rounded-2xl glass-strong border border-[rgba(255,255,255,0.2)]`}>
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                    <p className="text-gray-300">{category.description}</p>
                  </div>
                </div>

                {/* Subcategories */}
                <div className="space-y-6">
                  {category.subcategories.map((subcategory, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.color}`}></span>
                        {subcategory.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {subcategory.tools.map((toolId) => (
                          <Link
                            key={toolId}
                            href={`/tools/${toolId}`}
                            className="group px-4 py-2.5 glass hover:glass-strong hover:border-[#00d4ff] rounded-lg transition-all text-sm font-medium text-gray-300 hover:text-[#00d4ff] flex items-center justify-between"
                          >
                            <span className="truncate">{toolId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                            <ChevronDown className="w-4 h-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Why Choose <span className="text-gradient">DocOpsCloud</span>?
            </h2>
            <p className="text-xl text-gray-300">
              Enterprise-grade document processing, simplified
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                description: "Process documents in seconds with our optimized infrastructure"
              },
              {
                icon: "🔒",
                title: "100% Secure",
                description: "End-to-end encryption with automatic 24h file deletion"
              },
              {
                icon: "☁️",
                title: "Cloud-Based",
                description: "No installation needed. Works on any device, anywhere"
              },
              {
                icon: "🎯",
                title: "Batch Processing",
                description: "Handle multiple files simultaneously to save time"
              },
              {
                icon: "📱",
                title: "Mobile Friendly",
                description: "Full functionality on desktop, tablet, and mobile"
              },
              {
                icon: "🔌",
                title: "API Access",
                description: "Integrate with your workflow via our RESTful API"
              }
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
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Simple, <span className="text-gradient">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-gray-300">
              Choose the perfect plan for your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="glass-card">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gradient">$0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  10 operations/month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All {totalTools}+ tools
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  10MB max file size
                </li>
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 glass-strong border border-[rgba(255,255,255,0.2)] text-white rounded-lg hover:border-[#00d4ff] transition font-semibold text-center">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="glass-strong border-2 border-[#00d4ff] rounded-2xl p-8 text-white relative transform scale-105 shadow-[0_0_50px_rgba(0,212,255,0.3)] pulse-glow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-4 py-1 rounded-full text-sm font-bold text-white">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gradient">$79</span>
                <span className="opacity-90">/year</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  1000 operations/month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All {totalTools}+ tools
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  500MB max file size
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Priority processing
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  API access
                </li>
              </ul>
              <Link href="/auth/signup" className="btn-neon block w-full text-center py-3">
                Start Free Trial
              </Link>
            </div>

            {/* Business */}
            <div className="glass-card">
              <h3 className="text-2xl font-bold text-white mb-2">Business</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gradient">$299</span>
                <span className="text-gray-400">/year</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited operations
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  2GB max file size
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  20 concurrent jobs
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Priority processing
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#00ff88]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Custom branding
                </li>
              </ul>
              <Link href="/auth/signup" className="btn-neon block w-full text-center py-3">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(0,212,255,0.1)] via-[rgba(168,85,247,0.1)] to-[rgba(255,0,255,0.1)]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">
            Ready to <span className="text-gradient">Transform</span> Your Documents?
          </h2>
          <p className="text-xl mb-10 text-gray-300">
            Join thousands of users processing millions of documents with DocOpsCloud
          </p>
          <Link
            href="/auth/signup"
            className="btn-neon inline-block px-10 py-4 text-lg"
          >
            Start Free Today - No Credit Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-strong border-t border-[rgba(255,255,255,0.1)] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">
                Doc<span className="text-gradient">Ops</span>Cloud
              </div>
              <p className="text-sm text-gray-400">
                Professional document processing platform with {totalTools}+ tools.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#tools" className="text-gray-400 hover:text-[#00d4ff] transition">All Tools</Link></li>
                <li><Link href="#features" className="text-gray-400 hover:text-[#00d4ff] transition">Features</Link></li>
                <li><Link href="#pricing" className="text-gray-400 hover:text-[#00d4ff] transition">Pricing</Link></li>
                <li><Link href="/dashboard" className="text-gray-400 hover:text-[#00d4ff] transition">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-[#00d4ff] transition">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[rgba(255,255,255,0.1)] pt-8 text-center text-sm text-gray-400">
            <p>© 2025 DocOpsCloud. All rights reserved. Built with Next.js 14 & TypeScript.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
