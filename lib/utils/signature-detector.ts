/**
 * Smart Signature Detection and Placement
 */

export interface SignatureField {
  id: string
  pageNumber: number
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  type: 'signature' | 'initial' | 'date' | 'text'
  label?: string
  required: boolean
  confidence: number // 0-100
}

export interface SignatureTemplate {
  id: string
  name: string
  width: number
  height: number
  aspectRatio: number
}

/**
 * Common signature templates with standard sizes
 */
export const SIGNATURE_TEMPLATES: SignatureTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Signature',
    width: 200,
    height: 50,
    aspectRatio: 4,
  },
  {
    id: 'initial',
    name: 'Initials',
    width: 80,
    height: 40,
    aspectRatio: 2,
  },
  {
    id: 'date',
    name: 'Date Field',
    width: 120,
    height: 30,
    aspectRatio: 4,
  },
  {
    id: 'name',
    name: 'Name Field',
    width: 180,
    height: 35,
    aspectRatio: 5.14,
  },
]

/**
 * Detect potential signature fields in a document
 */
export function detectSignatureFields(
  documentText: string,
  pageCount: number
): SignatureField[] {
  const fields: SignatureField[] = []

  // Common signature keywords
  const signatureKeywords = [
    'signature',
    'sign here',
    'signed',
    'authorized signature',
    'applicant signature',
    'employee signature',
    'customer signature',
  ]

  const initialKeywords = ['initial', 'initials', 'initial here']

  const dateKeywords = ['date', 'dated', 'date signed', 'signature date']

  // Detect signature fields
  signatureKeywords.forEach((keyword, index) => {
    const regex = new RegExp(keyword, 'gi')
    const matches = documentText.matchAll(regex)

    for (const match of matches) {
      fields.push({
        id: `sig_${Date.now()}_${index}`,
        pageNumber: Math.floor(Math.random() * pageCount) + 1, // Mock page detection
        position: {
          x: 20, // Mock position - in real app, would be detected from PDF
          y: 70 + index * 5,
          width: 200,
          height: 50,
        },
        type: 'signature',
        label: keyword,
        required: true,
        confidence: 85,
      })
    }
  })

  // Detect initial fields
  initialKeywords.forEach((keyword, index) => {
    fields.push({
      id: `init_${Date.now()}_${index}`,
      pageNumber: Math.floor(Math.random() * pageCount) + 1,
      position: {
        x: 20,
        y: 60,
        width: 80,
        height: 40,
      },
      type: 'initial',
      label: keyword,
      required: false,
      confidence: 75,
    })
  })

  // Detect date fields
  dateKeywords.forEach((keyword, index) => {
    fields.push({
      id: `date_${Date.now()}_${index}`,
      pageNumber: pageCount, // Dates usually on last page
      position: {
        x: 60,
        y: 75,
        width: 120,
        height: 30,
      },
      type: 'date',
      label: keyword,
      required: true,
      confidence: 90,
    })
  })

  return fields
}

/**
 * Suggest optimal signature placement
 */
export function suggestSignaturePlacement(
  pageWidth: number,
  pageHeight: number,
  existingFields: SignatureField[]
): SignatureField {
  // Default placement: bottom right of page
  const defaultX = 60 // 60% from left
  const defaultY = 85 // 85% from top

  // Check if position is already occupied
  const isOccupied = existingFields.some(
    (field) =>
      Math.abs(field.position.x - defaultX) < 10 && Math.abs(field.position.y - defaultY) < 10
  )

  if (isOccupied) {
    // Try alternative positions
    const alternatives = [
      { x: 20, y: 85 }, // Bottom left
      { x: 60, y: 75 }, // Middle right
      { x: 20, y: 75 }, // Middle left
    ]

    for (const alt of alternatives) {
      const altOccupied = existingFields.some(
        (field) => Math.abs(field.position.x - alt.x) < 10 && Math.abs(field.position.y - alt.y) < 10
      )

      if (!altOccupied) {
        return {
          id: `suggested_${Date.now()}`,
          pageNumber: 1,
          position: {
            x: alt.x,
            y: alt.y,
            width: 200,
            height: 50,
          },
          type: 'signature',
          required: false,
          confidence: 70,
        }
      }
    }
  }

  return {
    id: `suggested_${Date.now()}`,
    pageNumber: 1,
    position: {
      x: defaultX,
      y: defaultY,
      width: 200,
      height: 50,
    },
    type: 'signature',
    required: false,
    confidence: 95,
  }
}

/**
 * Auto-resize signature to fit field
 */
export function resizeSignature(
  signatureWidth: number,
  signatureHeight: number,
  fieldWidth: number,
  fieldHeight: number
): { width: number; height: number } {
  const signatureAspect = signatureWidth / signatureHeight
  const fieldAspect = fieldWidth / fieldHeight

  let newWidth = fieldWidth
  let newHeight = fieldHeight

  if (signatureAspect > fieldAspect) {
    // Signature is wider - fit to width
    newWidth = fieldWidth
    newHeight = fieldWidth / signatureAspect
  } else {
    // Signature is taller - fit to height
    newHeight = fieldHeight
    newWidth = fieldHeight * signatureAspect
  }

  return {
    width: Math.min(newWidth, fieldWidth),
    height: Math.min(newHeight, fieldHeight),
  }
}

/**
 * Apply signature to multiple pages
 */
export function applySignatureToPages(
  signature: any,
  pages: number[],
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom'
): Array<{ pageNumber: number; position: { x: number; y: number } }> {
  const positions: Record<string, { x: number; y: number }> = {
    'bottom-right': { x: 70, y: 85 },
    'bottom-left': { x: 10, y: 85 },
    'top-right': { x: 70, y: 10 },
    'top-left': { x: 10, y: 10 },
    custom: { x: 50, y: 50 },
  }

  const selectedPosition = positions[position]

  return pages.map((page) => ({
    pageNumber: page,
    position: selectedPosition,
  }))
}

/**
 * Validate signature placement
 */
export function validateSignaturePlacement(
  position: { x: number; y: number; width: number; height: number },
  pageWidth: number,
  pageHeight: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if signature is within page bounds
  if (position.x < 0 || position.x + position.width > 100) {
    errors.push('Signature extends beyond page width')
  }

  if (position.y < 0 || position.y + position.height > 100) {
    errors.push('Signature extends beyond page height')
  }

  // Check minimum size
  if (position.width < 5 || position.height < 2) {
    errors.push('Signature is too small to be legible')
  }

  // Check maximum size
  if (position.width > 50 || position.height > 30) {
    errors.push('Signature is too large')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
