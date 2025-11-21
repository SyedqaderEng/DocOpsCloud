'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function ToolsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen gradient-animated flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center glass-card">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Tool Error</h1>
        <p className="text-gray-400 mb-6">Something went wrong loading this tool.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="inline-flex items-center justify-center gap-2 px-6 py-3 glass-strong border border-[rgba(255,255,255,0.2)] text-white rounded-lg hover:border-[#00d4ff] transition">
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
          <Link href="/tools" className="btn-neon inline-flex items-center justify-center gap-2 px-6 py-3">
            Browse Tools
          </Link>
        </div>
      </div>
    </div>
  )
}
