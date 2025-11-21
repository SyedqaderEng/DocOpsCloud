'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/firebase/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireEmailVerified?: boolean
}

export default function ProtectedRoute({ children, requireEmailVerified = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
    if (!loading && user && requireEmailVerified && !user.emailVerified) {
      router.push('/auth/verify-email')
    }
  }, [user, loading, router, requireEmailVerified])

  if (loading) {
    return (
      <div className="min-h-screen gradient-animated flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#00d4ff] animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requireEmailVerified && !user.emailVerified) {
    return null
  }

  return <>{children}</>
}
