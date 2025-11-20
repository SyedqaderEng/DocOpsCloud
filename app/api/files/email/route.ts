import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const emailSchema = z.object({
  fileId: z.string(),
  recipientEmail: z.string().email(),
  message: z.string().optional(),
})

/**
 * POST /api/files/email
 * Email a file to a recipient
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileId, recipientEmail, message } = emailSchema.parse(body)

    // Verify file belongs to user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        user_id: session.user.id,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // TODO: Implement actual email sending (using SendGrid, AWS SES, etc.)
    // For now, we'll just log it and return success
    console.log('Email file request:', {
      fileId,
      fileName: file.name,
      recipientEmail,
      senderEmail: session.user.email,
      message,
    })

    // Log email operation
    await prisma.usage_log.create({
      data: {
        user_id: session.user.id,
        operation_type: 'file_email',
        file_size_processed: file.size,
        credits_used: 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'File will be emailed shortly',
      recipient: recipientEmail,
    })
  } catch (error) {
    console.error('File email error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
