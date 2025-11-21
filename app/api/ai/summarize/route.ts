import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { summarizeDocument } from '@/lib/ai/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, length, language, format } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const result = await summarizeDocument(session.user.id, text, { length, language, format })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('Summarize error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to summarize' },
      { status: error.message?.includes('Rate limit') ? 429 : 500 }
    )
  }
}
