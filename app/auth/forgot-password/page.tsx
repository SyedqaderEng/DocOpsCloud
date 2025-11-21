'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/firebase/AuthContext'
import { Mail, Loader2, ArrowLeft, Check } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { forgotPassword, error, loading, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    if (!email) {
      setLocalError('Please enter your email')
      return
    }

    try {
      await forgotPassword(email)
      setSuccess(true)
    } catch {
      // Error handled by context
    }
  }

  if (success) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="glass-card text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#00ff88]/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-[#00ff88]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-gray-400 mb-6">
              We've sent a password reset link to <span className="text-white">{email}</span>.
              Click the link in the email to reset your password.
            </p>
            <Link href="/auth/signin" className="btn-neon inline-block px-8 py-3">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-animated flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link href="/auth/signin" className="inline-flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] transition mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        {/* Card */}
        <div className="glass-card">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-white inline-block mb-4">
              Doc<span className="text-neon-cyan">Ops</span>Cloud
            </Link>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-gray-400">Enter your email and we'll send you a reset link</p>
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error || localError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 glass-strong border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-neon py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-gray-400">
            Remember your password?{' '}
            <Link href="/auth/signin" className="text-[#00d4ff] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
