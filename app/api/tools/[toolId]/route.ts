import { NextRequest, NextResponse } from 'next/server'

/**
 * Generic tool processing endpoint
 * POST /api/tools/[toolId]
 * Handles file uploads and returns processed results
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const toolId = params.toolId
    const formData = await request.formData()

    // Get all uploaded files
    const files: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    // Process based on tool type
    const result = await processToolRequest(toolId, files)

    return NextResponse.json({
      success: true,
      toolId,
      filesProcessed: files.length,
      downloadUrl: result.downloadUrl,
      message: result.message,
    })
  } catch (error) {
    console.error(`Tool processing error:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    )
  }
}

async function processToolRequest(toolId: string, files: File[]): Promise<{ downloadUrl: string; message: string }> {
  // Demo mode: return mock response
  // In production, implement actual processing with libraries like pdf-lib, sharp, etc.

  const toolCategory = toolId.split('-')[0]

  // Simulate processing time
  await new Promise(r => setTimeout(r, 1500))

  return {
    downloadUrl: `/api/download/demo-${toolId}-${Date.now()}.${getOutputExtension(toolId)}`,
    message: `Successfully processed ${files.length} file(s) with ${toolId}`,
  }
}

function getOutputExtension(toolId: string): string {
  if (toolId.includes('to-pdf')) return 'pdf'
  if (toolId.includes('to-csv')) return 'csv'
  if (toolId.includes('to-json')) return 'json'
  if (toolId.includes('to-xml')) return 'xml'
  if (toolId.includes('to-html')) return 'html'
  if (toolId.includes('to-txt') || toolId.includes('to-markdown')) return 'txt'
  if (toolId.startsWith('pdf')) return 'pdf'
  if (toolId.startsWith('word')) return 'docx'
  if (toolId.startsWith('excel')) return 'xlsx'
  if (toolId.startsWith('csv')) return 'csv'
  if (toolId.startsWith('image')) return 'png'
  return 'zip'
}
