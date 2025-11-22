'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import { Loader2 } from 'lucide-react'

/**
 * Protected Dashboard Layout
 * All routes under (dashboard) require authentication
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Redirect to signin if not authenticated and not loading
    if (!loading && !user) {
      // Store the attempted URL to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00d4ff] animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Verifying authentication...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!user) {
    return null
  }

  // User is authenticated, render the dashboard
  return <>{children}</>
}
