// API v2: Files Endpoint
// GET /api/v2/files - List files
// POST /api/v2/files - Upload file

import { NextRequest, NextResponse } from 'next/server'
import { APIv2Response } from '@/lib/api/v2/base'
import { APIv2Middleware } from '@/lib/api/v2/middleware'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate
    const auth = await APIv2Middleware.authenticateAPI(request)
    if (!auth.valid) {
      return NextResponse.json(auth.error!.response, { status: auth.error!.statusCode })
    }

    // Rate limiting
    const rateLimit = await APIv2Middleware.checkRateLimit(`api:${auth.userId}`)
    if (!rateLimit.allowed) {
      return NextResponse.json(rateLimit.error!.response, { status: rateLimit.error!.statusCode })
    }

    // Parse pagination
    const { searchParams } = new URL(request.url)
    const { page, perPage } = APIv2Middleware.parsePaginationParams(searchParams)

    // Get files
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { user_id: auth.userId! },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          filename: true,
          original_filename: true,
          file_size: true,
          mime_type: true,
          status: true,
          download_url: true,
          created_at: true,
          updated_at: true,
        },
      }),
      prisma.file.count({ where: { user_id: auth.userId! } }),
    ])

    // Log request
    await APIv2Middleware.logAPIRequest(
      auth.userId!,
      '/api/v2/files',
      'GET',
      200,
      Date.now() - startTime
    )

    return NextResponse.json(
      APIv2Response.paginated(files, page, perPage, total, {
        rate_limit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
        },
      })
    )
  } catch (error) {
    console.error('API v2 files list error:', error)
    const errorResponse = APIv2Response.error(
      'internal_error',
      'Failed to retrieve files',
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
    return NextResponse.json(errorResponse.response, { status: errorResponse.statusCode })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate
    const auth = await APIv2Middleware.authenticateAPI(request)
    if (!auth.valid) {
      return NextResponse.json(auth.error!.response, { status: auth.error!.statusCode })
    }

    // Rate limiting
    const rateLimit = await APIv2Middleware.checkRateLimit(`api:${auth.userId}`, {
      windowMs: 60000,
      maxRequests: 10, // Stricter limit for uploads
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(rateLimit.error!.response, { status: rateLimit.error!.statusCode })
    }

    // Parse request body
    const body = await request.json()

    // Validate params
    const validation = APIv2Middleware.validateParams(
      body,
      ['filename', 'content'],
      ['mime_type', 'metadata']
    )
    if (!validation.valid) {
      return NextResponse.json(validation.error!.response, { status: validation.error!.statusCode })
    }

    // Create file record
    const file = await prisma.file.create({
      data: {
        user_id: auth.userId!,
        filename: body.filename,
        original_filename: body.filename,
        file_size: Buffer.from(body.content, 'base64').length,
        mime_type: body.mime_type || 'application/octet-stream',
        status: 'READY',
        storage_path: `/uploads/${auth.userId}/${body.filename}`,
        metadata: body.metadata || {},
      },
    })

    // Log request
    await APIv2Middleware.logAPIRequest(
      auth.userId!,
      '/api/v2/files',
      'POST',
      201,
      Date.now() - startTime
    )

    return NextResponse.json(
      APIv2Response.success(
        {
          id: file.id,
          filename: file.filename,
          file_size: file.file_size,
          mime_type: file.mime_type,
          status: file.status,
          created_at: file.created_at,
        },
        {
          rate_limit: {
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            reset: rateLimit.reset,
          },
        }
      ),
      { status: 201 }
    )
  } catch (error) {
    console.error('API v2 file upload error:', error)
    const errorResponse = APIv2Response.error(
      'internal_error',
      'Failed to upload file',
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
    return NextResponse.json(errorResponse.response, { status: errorResponse.statusCode })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: APIv2Middleware.corsHeaders(request.headers.get('origin') || undefined),
  })
}
