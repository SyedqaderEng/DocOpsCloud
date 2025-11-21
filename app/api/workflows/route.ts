import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'

// List user workflows
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const workflows = await prisma.workflow.findMany({
      where: {
        user_id: session.user.id,
        ...(status && { status: status as any }),
      },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        trigger: true,
        is_template: true,
        version: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: { runs: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: workflows })
  } catch (error) {
    console.error('List workflows error:', error)
    return NextResponse.json({ error: 'Failed to list workflows' }, { status: 500 })
  }
}

// Create workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, trigger, steps, variables } = body

    if (!name || !trigger || !steps) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const workflow = await prisma.workflow.create({
      data: {
        user_id: session.user.id,
        name,
        description,
        trigger,
        steps,
        variables,
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ success: true, data: workflow })
  } catch (error) {
    console.error('Create workflow error:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}
