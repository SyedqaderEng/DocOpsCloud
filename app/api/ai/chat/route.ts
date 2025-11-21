import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { chatWithDocument } from '@/lib/ai/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { documentText, question, history } = body

    if (!documentText || !question) {
      return NextResponse.json({ error: 'Document and question required' }, { status: 400 })
    }

    const result = await chatWithDocument(session.user.id, documentText, question, history || [])

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process question' },
      { status: error.message?.includes('Rate limit') ? 429 : 500 }
    )
  }
}
