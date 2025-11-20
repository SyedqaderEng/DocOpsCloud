import Link from 'next/link'
import { TOOL_CATEGORIES, getTotalToolCount } from '@/lib/tools-data'

export default function HomePage() {
  const totalTools = getTotalToolCount()

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              Doc<span className="text-purple-600">Ops</span>Cloud
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#tools" className="text-gray-600 hover:text-purple-600 transition font-medium">
                All Tools
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-purple-600 transition font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-purple-600 transition font-medium">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-purple-600 transition font-medium">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="px-5 py-2.5 text-gray-700 hover:text-purple-600 transition font-semibold"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold shadow-sm"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-block mb-4 px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
              {totalTools}+ Professional Document Tools
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Complete Document
              <br />
              <span className="text-purple-600">Processing Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
              Transform, merge, compress, and optimize PDFs, Word documents, Excel spreadsheets, and images.
              All in one powerful, secure platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Get Started Free →
              </Link>
              <Link
                href="#tools"
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-purple-600 hover:text-purple-600 transition font-semibold text-lg"
              >
                Browse All Tools
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">10 free operations</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Files auto-delete in 24h</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-4 border-b border-gray-300 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="ml-4 text-sm text-gray-600 font-medium">dashboard.docopscloud.com</div>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {['Total Files', 'Processing', 'Operations', 'Storage'].map((stat, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">{['47', '3', '234', '2.3GB'][i]}</div>
                      <div className="text-xs text-gray-500 mt-1">{stat}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <span className="text-sm text-purple-600">View all →</span>
                  </div>
                  <div className="space-y-3">
                    {['document.pdf', 'spreadsheet.xlsx', 'photo.jpg'].map((file, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-lg">
                            {['📄', '📊', '🖼️'][i]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{file}</div>
                            <div className="text-xs text-gray-500">{['Compressed', 'Converted', 'Optimized'][i]}</div>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
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

      {/* All Tools Section */}
      <section id="tools" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              All {totalTools}+ Tools at Your Fingertips
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional document processing tools for every need. No installation required.
            </p>
          </div>

          {/* Tool Categories */}
          <div className="space-y-16">
            {TOOL_CATEGORIES.map((category) => (
              <div key={category.id}>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-5xl">{category.icon}</span>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{category.name}</h3>
                    <p className="text-gray-600">{category.count} professional tools</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.id}`}
                      className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all"
                    >
                      <div className="text-3xl mb-3">{tool.icon}</div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition mb-1">
                        {tool.name}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Why Choose DocOpsCloud?
            </h2>
            <p className="text-xl text-gray-600">
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
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the perfect plan for your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  10 operations/month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All {totalTools}+ tools
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  10MB max file size
                </li>
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition font-semibold text-center">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 border-2 border-purple-600 rounded-2xl p-8 text-white relative transform scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold">$79</span>
                <span className="opacity-90">/year</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  500 operations/month
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All {totalTools}+ tools
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  100MB max file size
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Priority processing
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  API access
                </li>
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-semibold text-center">
                Start Free Trial
              </Link>
            </div>

            {/* Business */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">$149</span>
                <span className="text-gray-500">/year</span>
              </div>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited operations
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  500MB max file size
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Team collaboration
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24/7 priority support
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Advanced API
                </li>
              </ul>
              <Link href="/auth/signup" className="block w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-semibold text-center">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Ready to Transform Your Documents?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Join thousands of users processing millions of documents with DocOpsCloud
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-10 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-xl"
          >
            Start Free Today - No Credit Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">
                Doc<span className="text-purple-400">Ops</span>Cloud
              </div>
              <p className="text-sm">
                Professional document processing platform with {totalTools}+ tools.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#tools" className="hover:text-purple-400 transition">All Tools</Link></li>
                <li><Link href="#features" className="hover:text-purple-400 transition">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-purple-400 transition">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-purple-400 transition">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">About Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 DocOpsCloud. All rights reserved. Built with Next.js 14 & TypeScript.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
