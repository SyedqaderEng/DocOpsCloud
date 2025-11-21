import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'
import { nanoid } from 'nanoid'

// List team members
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is team member
    const membership = await prisma.teamMember.findFirst({
      where: {
        team_id: params.teamId,
        user_id: session.user.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 })
    }

    const members = await prisma.teamMember.findMany({
      where: { team_id: params.teamId },
      select: {
        id: true,
        user_id: true,
        role: true,
        joined_at: true,
      },
    })

    // Get user details
    const userIds = members.map(m => m.user_id)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, avatar_url: true },
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    const membersWithDetails = members.map(m => ({
      ...m,
      user: userMap.get(m.user_id),
    }))

    return NextResponse.json({ success: true, data: membersWithDetails })
  } catch (error) {
    console.error('List members error:', error)
    return NextResponse.json({ error: 'Failed to list members' }, { status: 500 })
  }
}

// Invite member
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or owner
    const membership = await prisma.teamMember.findFirst({
      where: {
        team_id: params.teamId,
        user_id: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role = 'MEMBER' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user already a member
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const existing = await prisma.teamMember.findFirst({
        where: {
          team_id: params.teamId,
          user_id: user.id,
        },
      })
      if (existing) {
        return NextResponse.json({ error: 'User already a member' }, { status: 400 })
      }
    }

    // Create invite
    const token = nanoid(32)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const invite = await prisma.teamInvite.create({
      data: {
        team_id: params.teamId,
        email,
        role,
        token,
        expires_at: expiresAt,
      },
    })

    // In production, send email with invite link
    const inviteLink = `${process.env.NEXTAUTH_URL}/teams/accept-invite?token=${token}`

    return NextResponse.json({
      success: true,
      data: {
        invite,
        inviteLink,
      },
    })
  } catch (error) {
    console.error('Invite member error:', error)
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}
