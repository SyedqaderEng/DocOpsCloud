import { NextRequest } from 'next/server'

/**
 * Verify Firebase ID token from Authorization header
 * For client-side auth, we trust the token passed from client
 * In production, you would verify with Firebase Admin SDK
 */
export async function verifyFirebaseToken(request: NextRequest): Promise<{ uid: string; email: string | null } | null> {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)

  // In development/demo mode, decode the JWT payload without verification
  // For production, use Firebase Admin SDK: admin.auth().verifyIdToken(token)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email || null,
    }
  } catch {
    return null
  }
}

/**
 * Helper to get user ID from request
 */
export async function getUserFromRequest(request: NextRequest): Promise<string | null> {
  const user = await verifyFirebaseToken(request)
  return user?.uid || null
}
