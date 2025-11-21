import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { translateText } from '@/lib/ai/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, targetLanguage, sourceLanguage, preserveFormatting } = body

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: 'Text and target language are required' }, { status: 400 })
    }

    const result = await translateText(session.user.id, text, {
      targetLanguage,
      sourceLanguage,
      preserveFormatting,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Translate error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to translate' },
      { status: error.message?.includes('Rate limit') ? 429 : 500 }
    )
  }
}
