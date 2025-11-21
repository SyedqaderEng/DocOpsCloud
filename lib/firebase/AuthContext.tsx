'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  AuthUser,
  onAuthStateChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  resetPassword,
} from './auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signInGoogle: () => Promise<void>
  signInGithub: () => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleAuthError = (err: unknown) => {
    const error = err as { code?: string; message?: string }
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/popup-closed-by-user': 'Sign in was cancelled',
      'auth/account-exists-with-different-credential': 'Account exists with different sign-in method',
    }
    setError(errorMessages[error.code || ''] || error.message || 'An error occurred')
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)
      await signInWithEmail(email, password)
    } catch (err) {
      handleAuthError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setError(null)
      setLoading(true)
      await signUpWithEmail(email, password, name)
    } catch (err) {
      handleAuthError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInGoogle = async () => {
    try {
      setError(null)
      setLoading(true)
      await signInWithGoogle()
    } catch (err) {
      handleAuthError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInGithub = async () => {
    try {
      setError(null)
      setLoading(true)
      await signInWithGithub()
    } catch (err) {
      handleAuthError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut()
    } catch (err) {
      handleAuthError(err)
    }
  }

  const forgotPassword = async (email: string) => {
    try {
      setError(null)
      await resetPassword(email)
    } catch (err) {
      handleAuthError(err)
      throw err
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signInGoogle,
        signInGithub,
        logout,
        forgotPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
