// Refined color palette - Indigo/Blue-Purple combination
export const colors = {
  // Primary brand colors
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1', // Main brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },

  // Accent colors
  accent: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
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
    color: 'from-red-500 to-orange-500',
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
    color: 'from-blue-500 to-cyan-500',
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
    color: 'from-green-500 to-emerald-500',
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
    color: 'from-purple-500 to-pink-500',
    description: 'Image editing and conversion',
    subcategories: [
      { name: 'Convert', tools: ['image-convert', 'image-format-webp', 'image-format-avif'] },
      { name: 'Optimize', tools: ['image-compress', 'image-resize', 'image-optimize'] },
      { name: 'Edit', tools: ['image-crop', 'image-rotate', 'image-watermark', 'image-filter'] },
    ]
  },
]
