import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token)
    const firebaseUid = decodedToken.uid

    // Get user from database by email (since Firebase UID might not match DB ID)
    const user = await prisma.user.findFirst({
      where: {
        email: decodedToken.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscription_tier: true,
        subscription_status: true,
        subscription_expires_at: true,
        stripe_customer_id: true,
        created_at: true,
      },
    })

    if (!user) {
      // User doesn't exist in database yet, create them with FREE tier
      const newUser = await prisma.user.create({
        data: {
          id: firebaseUid,
          email: decodedToken.email!,
          name: decodedToken.name || null,
          subscription_tier: 'FREE',
          subscription_status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          name: true,
          subscription_tier: true,
          subscription_status: true,
          subscription_expires_at: true,
          stripe_customer_id: true,
          created_at: true,
        },
      })

      return NextResponse.json({ user: newUser })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
