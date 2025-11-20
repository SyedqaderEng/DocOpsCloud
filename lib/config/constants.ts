/**
 * GLASSMORPHISM THEME - Dark Mode + Neon Accents
 * Modern frosted glass design with vibrant neon colors
 */
export const colors = {
  // Base dark colors
  dark: {
    base: '#0a0a0a',          // Deep black background
    card: '#0f0f0f',          // Slightly lighter for cards
    glass: 'rgba(255, 255, 255, 0.05)',  // Frosted glass base
    glassFull: 'rgba(255, 255, 255, 0.1)', // Stronger glass
    border: 'rgba(255, 255, 255, 0.1)',   // Glass border
    borderHover: 'rgba(0, 212, 255, 0.5)', // Neon border on hover
  },

  // Neon accent colors (Primary theme colors)
  neon: {
    cyan: '#00d4ff',          // Primary neon cyan
    cyanDark: '#00a3cc',      // Darker cyan
    magenta: '#ff00ff',       // Neon magenta/pink
    lime: '#00ff88',          // Neon lime green
    purple: '#a855f7',        // Neon purple
    blue: '#3b82f6',          // Neon blue
  },

  // Gradients
  gradient: {
    primary: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
    secondary: 'linear-gradient(135deg, #ff00ff 0%, #00d4ff 100%)',
    rainbow: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ff00ff 100%)',
    dark: 'linear-gradient(135deg, #0a0a0a 0%, #1a0f1f 100%)',
  },

  // Semantic colors (with neon twist)
  success: '#00ff88',
  warning: '#ffaa00',
  error: '#ff0055',
  info: '#00d4ff',
}

// Usage limits by tier
export const TIER_LIMITS = {
  FREE: {
    operations_per_month: 10,
    max_file_size: 10 * 1024 * 1024, // 10MB
    max_storage: 100 * 1024 * 1024, // 100MB
    features: ['basic_tools'],
    max_concurrent_jobs: 1,
  },
  PRO: {
    operations_per_month: 1000,
    max_file_size: 500 * 1024 * 1024, // 500MB
    max_storage: 10 * 1024 * 1024 * 1024, // 10GB
    features: ['basic_tools', 'advanced_tools', 'batch_processing', 'api_access'],
    max_concurrent_jobs: 5,
  },
  BUSINESS: {
    operations_per_month: -1, // unlimited
    max_file_size: 2 * 1024 * 1024 * 1024, // 2GB
    max_storage: 100 * 1024 * 1024 * 1024, // 100GB
    features: ['basic_tools', 'advanced_tools', 'batch_processing', 'api_access', 'priority_processing', 'custom_branding'],
    max_concurrent_jobs: 20,
  },
}

// Tool categories for organized display
export const TOOL_CATEGORIES = [
  {
    id: 'pdf',
    name: 'PDF Tools',
    icon: '📄',
    color: 'from-[#00d4ff] to-[#a855f7]', // Cyan to Purple gradient
    description: 'Complete PDF toolkit',
    subcategories: [
      { name: 'Convert', tools: ['pdf-to-word', 'pdf-to-excel', 'pdf-to-images', 'pdf-to-ppt'] },
      { name: 'Organize', tools: ['pdf-merge', 'pdf-split', 'pdf-rotate', 'pdf-reorder'] },
      { name: 'Optimize', tools: ['pdf-compress', 'pdf-repair', 'pdf-linearize'] },
      { name: 'Security', tools: ['pdf-password-protect', 'pdf-remove-password', 'pdf-sign', 'pdf-redact'] },
      { name: 'Edit', tools: ['pdf-watermark', 'pdf-page-numbers', 'pdf-header-footer', 'pdf-background'] },
    ]
  },
  {
    id: 'word',
    name: 'Word Tools',
    icon: '📝',
    color: 'from-[#a855f7] to-[#ff00ff]', // Purple to Magenta gradient
    description: 'Word document processing',
    subcategories: [
      { name: 'Convert', tools: ['word-to-pdf', 'word-to-html', 'word-to-markdown'] },
      { name: 'Edit', tools: ['word-merge', 'word-split', 'word-extract-text'] },
    ]
  },
  {
    id: 'excel',
    name: 'Excel Tools',
    icon: '📊',
    color: 'from-[#00ff88] to-[#00d4ff]', // Lime to Cyan gradient
    description: 'Spreadsheet manipulation',
    subcategories: [
      { name: 'Convert', tools: ['excel-to-csv', 'csv-to-excel', 'excel-to-pdf'] },
      { name: 'Process', tools: ['excel-merge', 'excel-split', 'excel-filter'] },
    ]
  },
  {
    id: 'image',
    name: 'Image Tools',
    icon: '🖼️',
    color: 'from-[#ff00ff] to-[#00d4ff]', // Magenta to Cyan gradient
    description: 'Image editing and conversion',
    subcategories: [
      { name: 'Convert', tools: ['image-convert', 'image-format-webp', 'image-format-avif'] },
      { name: 'Optimize', tools: ['image-compress', 'image-resize', 'image-optimize'] },
      { name: 'Edit', tools: ['image-crop', 'image-rotate', 'image-watermark', 'image-filter'] },
    ]
  },
]
