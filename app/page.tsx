'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-extrabold text-[#f8fafc] mb-4 tracking-tight">
            Doc<span className="text-gradient-blue">Ops</span>Cloud
          </h1>
          <p className="text-xl md:text-2xl text-[#cbd5e1]">
            Professional Document Processing Platform
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <Link
            href="/dashboard"
            className="btn-primary px-8 py-4 text-lg"
          >
            Get Started
          </Link>
          <Link
            href="/auth/signin"
            className="btn-secondary px-8 py-4 text-lg"
          >
            Sign In
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-[#94a3b8] text-sm">
          <p>© 2025 DocOpsCloud. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
