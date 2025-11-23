/**
 * Universal Tool Execution Endpoint
 * POST /api/v2/tools/run
 * Executes ANY tool operation via the workflow service
 */

import { NextRequest, NextResponse } from 'next/server'
import { workflowService } from '@/lib/services/workflow.service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate request body
    if (!body.toolName) {
      return NextResponse.json(
        { error: 'toolName is required' },
        { status: 400 }
      )
    }

    if (!body.fileId) {
      return NextResponse.json(
        { error: 'fileId is required' },
        { status: 400 }
      )
    }

    // Get user ID from auth (if available)
    const userId = req.headers.get('x-user-id') || undefined

    // Execute tool request
    const result = await workflowService.executeToolRequest({
      toolName: body.toolName,
      fileId: body.fileId,
      params: body.params || {},
      userId,
    })

    return NextResponse.json({
      jobId: result.jobId,
      status: result.status,
      estimatedTime: result.estimatedTime,
      message: 'Job queued successfully',
    })
  } catch (error: any) {
    console.error('[Tools/Run] Error:', error)

    // Handle validation errors
    if (error.message.includes('not found') || error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Tool execution failed' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to list available tools
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let tools

    if (category) {
      tools = await workflowService.getToolsByCategory(category)
    } else {
      tools = await workflowService.getAllTools()
    }

    // Format tools for response
    const toolsList = Object.entries(tools).map(([toolName, config]) => ({
      name: toolName,
      category: config.category,
      description: config.description,
      params: config.params,
    }))

    return NextResponse.json({
      tools: toolsList,
      count: toolsList.length,
    })
  } catch (error: any) {
    console.error('[Tools/List] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list tools' },
      { status: 500 }
    )
  }
}
