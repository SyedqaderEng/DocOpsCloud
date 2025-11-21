import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { triggerManually } from '@/lib/workflows/triggers'

export async function POST(
  request: NextRequest,
  { params }: { params: { workflowId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = body.data || {}

    const runId = await triggerManually(params.workflowId, session.user.id, data)

    return NextResponse.json({
      success: true,
      data: {
        runId,
        message: 'Workflow triggered successfully',
      },
    })
  } catch (error: any) {
    console.error('Trigger workflow error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to trigger workflow' },
      { status: 500 }
    )
  }
}
