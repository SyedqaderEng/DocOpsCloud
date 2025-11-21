import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth'
import { auth, googleProvider, githubProvider } from './config'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
}

// Convert Firebase User to AuthUser
export const formatUser = (user: User): AuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  emailVerified: user.emailVerified,
})

// Sign up with email/password
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> => {
  const result = await createUserWithEmailAndPassword(auth, email, password)

  if (displayName) {
    await updateProfile(result.user, { displayName })
  }

  // Send verification email
  await sendEmailVerification(result.user)

  return formatUser(result.user)
}

// Sign in with email/password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<AuthUser> => {
  const result = await signInWithEmailAndPassword(auth, email, password)
  return formatUser(result.user)
}

// Sign in with Google
export const signInWithGoogle = async (): Promise<AuthUser> => {
  const result = await signInWithPopup(auth, googleProvider)
  return formatUser(result.user)
}

// Sign in with GitHub
export const signInWithGithub = async (): Promise<AuthUser> => {
  const result = await signInWithPopup(auth, githubProvider)
  return formatUser(result.user)
}

// Sign out
export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth)
}

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email)
}

// Resend verification email
export const resendVerificationEmail = async (): Promise<void> => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser)
  }
}

// Update user profile
export const updateUserProfile = async (data: {
  displayName?: string
  photoURL?: string
}): Promise<void> => {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, data)
  }
}

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? formatUser(user) : null)
  })
}

// Get current user
export const getCurrentUser = (): AuthUser | null => {
  return auth.currentUser ? formatUser(auth.currentUser) : null
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser
}
