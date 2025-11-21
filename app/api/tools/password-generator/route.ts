import { NextRequest, NextResponse } from 'next/server'
import { generatePassword } from '@/lib/algorithms/text-analysis'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeAmbiguous = false,
      count = 1
    } = body

    if (length < 4 || length > 128) {
      return NextResponse.json(
        { error: 'Password length must be between 4 and 128' },
        { status: 400 }
      )
    }

    const passwords = []
    for (let i = 0; i < Math.min(count, 10); i++) {
      passwords.push(generatePassword({
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeAmbiguous
      }))
    }

    return NextResponse.json({
      success: true,
      data: { passwords }
    })
  } catch (error) {
    console.error('Password generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate password' },
      { status: 500 }
    )
  }
}
