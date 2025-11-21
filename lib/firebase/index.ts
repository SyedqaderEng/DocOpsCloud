// Firebase exports
export { auth, googleProvider, githubProvider, initAnalytics } from './config'
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  resetPassword,
  resendVerificationEmail,
  updateUserProfile,
  onAuthStateChange,
  getCurrentUser,
  isAuthenticated,
  formatUser,
  type AuthUser,
} from './auth'
export { AuthProvider, useAuth } from './AuthContext'
export { verifyFirebaseToken, getUserFromRequest } from './admin'
