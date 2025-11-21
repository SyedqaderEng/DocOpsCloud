import Link from 'next/link'
import { Search, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen gradient-animated flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="glass-card">
          {/* 404 Animation */}
          <div className="relative mb-8">
            <div className="text-[150px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#a855f7] leading-none">
              404
            </div>
            <div className="absolute inset-0 text-[150px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#a855f7] leading-none blur-2xl opacity-50">
              404
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
          <p className="text-gray-400 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="btn-neon inline-flex items-center justify-center gap-2 px-6 py-3"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 glass-strong border border-[rgba(255,255,255,0.2)] text-white rounded-lg hover:border-[#00d4ff] transition font-medium"
            >
              <Search className="w-5 h-5" />
              Browse Tools
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
