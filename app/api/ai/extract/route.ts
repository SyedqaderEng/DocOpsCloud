import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { extractData } from '@/lib/ai/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, documentType, fields } = body

    if (!text || !documentType) {
      return NextResponse.json({ error: 'Text and document type required' }, { status: 400 })
    }

    const result = await extractData(session.user.id, text, documentType, { fields })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Extract error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to extract data' },
      { status: error.message?.includes('Rate limit') ? 429 : 500 }
    )
  }
}
