/**
 * Tool Presets & Templates System
 * Provides common presets for various PDF operations
 */

export interface ToolPreset {
  id: string
  name: string
  description: string
  tool: string
  settings: Record<string, any>
  icon: string
  popular?: boolean
}

export const PDF_COMPRESS_PRESETS: ToolPreset[] = [
  {
    id: 'compress-web',
    name: 'Compress for Web',
    description: 'Optimized for web viewing, smaller file size',
    tool: 'pdf-compress',
    icon: '🌐',
    settings: {
      quality: 'medium',
      dpi: 72,
      colorMode: 'rgb',
      removeMetadata: true
    },
    popular: true
  },
  {
    id: 'compress-email',
    name: 'Compress for Email',
    description: 'Small file size for email attachments',
    tool: 'pdf-compress',
    icon: '📧',
    settings: {
      quality: 'low',
      dpi: 150,
      colorMode: 'rgb',
      removeMetadata: true,
      maxFileSize: 10 * 1024 * 1024 // 10MB
    },
    popular: true
  },
  {
    id: 'compress-print',
    name: 'Compress for Print',
    description: 'High quality, optimized for printing',
    tool: 'pdf-compress',
    icon: '🖨️',
    settings: {
      quality: 'high',
      dpi: 300,
      colorMode: 'cmyk',
      removeMetadata: false
    }
  },
  {
    id: 'compress-archive',
    name: 'Compress for Archive',
    description: 'Balanced quality and size for long-term storage',
    tool: 'pdf-compress',
    icon: '📦',
    settings: {
      quality: 'medium',
      dpi: 200,
      colorMode: 'rgb',
      removeMetadata: false
    }
  }
]

export const PDF_CONVERT_PRESETS: ToolPreset[] = [
  {
    id: 'convert-a4',
    name: 'Convert to A4',
    description: 'Standard A4 page size (210×297mm)',
    tool: 'pdf-convert',
    icon: '📄',
    settings: {
      pageSize: 'A4',
      orientation: 'portrait',
      margin: 20
    },
    popular: true
  },
  {
    id: 'convert-letter',
    name: 'Convert to Letter',
    description: 'US Letter size (8.5×11")',
    tool: 'pdf-convert',
    icon: '📝',
    settings: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margin: 20
    }
  },
  {
    id: 'convert-a4-landscape',
    name: 'Convert to A4 Landscape',
    description: 'A4 in landscape orientation',
    tool: 'pdf-convert',
    icon: '🖼️',
    settings: {
      pageSize: 'A4',
      orientation: 'landscape',
      margin: 20
    }
  }
]

export const PDF_WATERMARK_PRESETS: ToolPreset[] = [
  {
    id: 'watermark-draft',
    name: 'Draft Watermark',
    description: 'Large "DRAFT" diagonal watermark',
    tool: 'pdf-watermark',
    icon: '📋',
    settings: {
      text: 'DRAFT',
      position: 'diagonal',
      opacity: 0.3,
      fontSize: 72,
      color: '#ff0000'
    },
    popular: true
  },
  {
    id: 'watermark-confidential',
    name: 'Confidential Watermark',
    description: 'Red "CONFIDENTIAL" watermark',
    tool: 'pdf-watermark',
    icon: '🔒',
    settings: {
      text: 'CONFIDENTIAL',
      position: 'diagonal',
      opacity: 0.4,
      fontSize: 60,
      color: '#ff0000'
    },
    popular: true
  },
  {
    id: 'watermark-sample',
    name: 'Sample Watermark',
    description: 'Gray "SAMPLE" watermark',
    tool: 'pdf-watermark',
    icon: '📑',
    settings: {
      text: 'SAMPLE',
      position: 'center',
      opacity: 0.2,
      fontSize: 80,
      color: '#808080'
    }
  },
  {
    id: 'watermark-footer',
    name: 'Footer Text',
    description: 'Small text at bottom of each page',
    tool: 'pdf-watermark',
    icon: '📄',
    settings: {
      text: 'Company Name - Confidential',
      position: 'bottom',
      opacity: 0.5,
      fontSize: 12,
      color: '#000000'
    }
  }
]

export const PDF_SIGNATURE_PRESETS: ToolPreset[] = [
  {
    id: 'sign-bottom-right',
    name: 'Sign Bottom Right',
    description: 'Standard signature placement',
    tool: 'pdf-sign',
    icon: '✍️',
    settings: {
      position: 'bottom-right',
      width: 200,
      height: 80,
      page: 'last'
    },
    popular: true
  },
  {
    id: 'sign-bottom-left',
    name: 'Sign Bottom Left',
    description: 'Left-aligned signature',
    tool: 'pdf-sign',
    icon: '✍️',
    settings: {
      position: 'bottom-left',
      width: 200,
      height: 80,
      page: 'last'
    }
  },
  {
    id: 'sign-all-pages',
    name: 'Sign All Pages',
    description: 'Signature on every page',
    tool: 'pdf-sign',
    icon: '✍️',
    settings: {
      position: 'bottom-right',
      width: 150,
      height: 60,
      page: 'all'
    }
  }
]

export const IMAGE_RESIZE_PRESETS: ToolPreset[] = [
  {
    id: 'resize-social-square',
    name: 'Social Media Square',
    description: '1080×1080px for Instagram, Facebook',
    tool: 'image-resize',
    icon: '📱',
    settings: {
      width: 1080,
      height: 1080,
      maintainAspectRatio: false
    },
    popular: true
  },
  {
    id: 'resize-social-landscape',
    name: 'Social Media Landscape',
    description: '1200×630px for Facebook, Twitter',
    tool: 'image-resize',
    icon: '🖼️',
    settings: {
      width: 1200,
      height: 630,
      maintainAspectRatio: false
    },
    popular: true
  },
  {
    id: 'resize-hd',
    name: 'HD Resolution',
    description: '1920×1080px Full HD',
    tool: 'image-resize',
    icon: '📺',
    settings: {
      width: 1920,
      height: 1080,
      maintainAspectRatio: false
    }
  },
  {
    id: 'resize-thumbnail',
    name: 'Thumbnail',
    description: '300×300px square thumbnail',
    tool: 'image-resize',
    icon: '🔲',
    settings: {
      width: 300,
      height: 300,
      maintainAspectRatio: false
    }
  }
]

/**
 * Get all presets for a specific tool
 */
export function getPresetsForTool(toolId: string): ToolPreset[] {
  const presetMap: Record<string, ToolPreset[]> = {
    'pdf-compress': PDF_COMPRESS_PRESETS,
    'pdf-convert': PDF_CONVERT_PRESETS,
    'pdf-watermark': PDF_WATERMARK_PRESETS,
    'pdf-sign': PDF_SIGNATURE_PRESETS,
    'image-resize': IMAGE_RESIZE_PRESETS
  }

  return presetMap[toolId] || []
}

/**
 * Get popular presets across all tools
 */
export function getPopularPresets(): ToolPreset[] {
  const allPresets = [
    ...PDF_COMPRESS_PRESETS,
    ...PDF_CONVERT_PRESETS,
    ...PDF_WATERMARK_PRESETS,
    ...PDF_SIGNATURE_PRESETS,
    ...IMAGE_RESIZE_PRESETS
  ]

  return allPresets.filter(preset => preset.popular)
}

/**
 * Get a specific preset by ID
 */
export function getPresetById(presetId: string): ToolPreset | undefined {
  const allPresets = [
    ...PDF_COMPRESS_PRESETS,
    ...PDF_CONVERT_PRESETS,
    ...PDF_WATERMARK_PRESETS,
    ...PDF_SIGNATURE_PRESETS,
    ...IMAGE_RESIZE_PRESETS
  ]

  return allPresets.find(preset => preset.id === presetId)
}

/**
 * Apply preset to form values
 */
export function applyPreset(preset: ToolPreset): Record<string, any> {
  return { ...preset.settings }
}
