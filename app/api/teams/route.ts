import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'

// List user teams
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            user_id: session.user.id,
          },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            user_id: true,
            role: true,
            joined_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ success: true, data: teams })
  } catch (error) {
    console.error('List teams error:', error)
    return NextResponse.json({ error: 'Failed to list teams' }, { status: 500 })
  }
}

// Create team
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Check if slug is available
    const existing = await prisma.team.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })
    }

    // Create team with owner as first member
    const team = await prisma.team.create({
      data: {
        name,
        slug,
        owner_id: session.user.id,
        members: {
          create: {
            user_id: session.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json({ success: true, data: team })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
