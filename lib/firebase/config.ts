import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyCYULcYAA-fuugA3QLsGw5_uhDT3-vd9wQ",
  authDomain: "aidemo-5aac9.firebaseapp.com",
  projectId: "aidemo-5aac9",
  storageBucket: "aidemo-5aac9.firebasestorage.app",
  messagingSenderId: "760932009750",
  appId: "1:760932009750:web:be7f27d5a9cd2279627237",
  measurementId: "G-Q50QKP78QK"
}

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Auth
export const auth = getAuth(app)

// OAuth Providers
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const githubProvider = new GithubAuthProvider()

// Initialize Analytics (client-side only)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getAnalytics(app)
  }
  return null
}

export default app
