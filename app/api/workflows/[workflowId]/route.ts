import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import prisma from '@/lib/db/prisma'

// Get workflow by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: params.workflowId,
        user_id: session.user.id,
      },
      include: {
        runs: {
          orderBy: { started_at: 'desc' },
          take: 10,
        },
      },
    })

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: workflow })
  } catch (error) {
    console.error('Get workflow error:', error)
    return NextResponse.json({ error: 'Failed to get workflow' }, { status: 500 })
  }
}

// Update workflow
export async function PATCH(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, trigger, steps, variables, status } = body

    const workflow = await prisma.workflow.updateMany({
      where: {
        id: params.workflowId,
        user_id: session.user.id,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(trigger && { trigger }),
        ...(steps && { steps }),
        ...(variables !== undefined && { variables }),
        ...(status && { status }),
        version: { increment: 1 },
      },
    })

    if (workflow.count === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const updated = await prisma.workflow.findFirst({
      where: { id: params.workflowId },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update workflow error:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

// Delete workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.workflow.deleteMany({
      where: {
        id: params.workflowId,
        user_id: session.user.id,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete workflow error:', error)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
