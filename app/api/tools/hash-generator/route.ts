import { NextRequest, NextResponse } from 'next/server'
import { generateHashes } from '@/lib/algorithms/text-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, file } = body

    if (!text && !file) {
      return NextResponse.json(
        { error: 'Text or file data is required' },
        { status: 400 }
      )
    }

    const input = text || Buffer.from(file, 'base64')
    const result = generateHashes(input)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Hash generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate hashes' },
      { status: 500 }
    )
  }
}
