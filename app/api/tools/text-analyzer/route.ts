import { NextRequest, NextResponse } from 'next/server'
import { analyzeText } from '@/lib/algorithms/text-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (text.length > 100000) {
      return NextResponse.json(
        { error: 'Text exceeds maximum length of 100,000 characters' },
        { status: 400 }
      )
    }

    const result = analyzeText(text)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Text analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    )
  }
}
