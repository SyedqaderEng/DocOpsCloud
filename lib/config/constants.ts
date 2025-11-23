/**
 * NEO DARK FINANCE UI THEME - Professional Finance-Grade Design
 * Sophisticated dark theme optimized for financial applications
 */
export const colors = {
  // Base dark backgrounds - Deep professional dark
  dark: {
    primary: '#080810',          // Deepest background
    secondary: '#0d0d15',        // Secondary background
    tertiary: '#12121a',         // Elevated surfaces
    elevated: '#18181f',         // Cards and panels
    hover: '#1d1d25',            // Hover states
    glass: 'rgba(18, 18, 26, 0.6)',        // Glass morphism base
    glassFull: 'rgba(18, 18, 26, 0.85)',   // Stronger glass
    border: 'rgba(255, 255, 255, 0.1)',    // Glass border
    borderHover: 'rgba(14, 165, 233, 0.5)', // Accent border on hover
  },

  // Finance accent colors - Professional and trustworthy
  finance: {
    blue: '#0ea5e9',             // Primary electric blue
    blueLight: '#38bdf8',        // Lighter blue
    blueDark: '#0284c7',         // Darker blue

    cyan: '#06b6d4',             // Secondary cyan
    cyanLight: '#22d3ee',        // Lighter cyan

    emerald: '#10b981',          // Success/Gains green
    emeraldLight: '#34d399',     // Lighter emerald

    gold: '#f59e0b',             // Premium/Warning gold
    goldLight: '#fbbf24',        // Lighter gold

    red: '#ef4444',              // Loss/Danger red
    redLight: '#f87171',         // Lighter red

    purple: '#8b5cf6',           // Premium purple
    purpleLight: '#a78bfa',      // Lighter purple
  },

  // Text colors - High contrast for readability
  text: {
    primary: '#f8fafc',          // Primary white text
    secondary: '#cbd5e1',        // Secondary gray text
    tertiary: '#94a3b8',         // Tertiary muted text
    muted: '#64748b',            // Most muted text
    accent: '#0ea5e9',           // Accent text (blue)
  },

  // Border & divider colors
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.15)',
    accent: 'rgba(14, 165, 233, 0.5)',
  },

  // Gradients - Professional and modern
  gradient: {
    blue: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)',
    emerald: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    gold: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    dark: 'linear-gradient(135deg, #080810 0%, #12121a 100%)',
    overlay: 'linear-gradient(180deg, rgba(8, 8, 16, 0) 0%, rgba(8, 8, 16, 0.8) 100%)',
  },

  // Semantic colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#0ea5e9',

  // Chart & data visualization colors
  chart: {
    gain: '#10b981',
    loss: '#ef4444',
    neutral: '#64748b',
    grid: 'rgba(255, 255, 255, 0.05)',
  },
}

// Usage limits by tier
export const TIER_LIMITS = {
  FREE: {
    operations_per_day: 5,
    operations_per_month: 150, // 5 per day * 30 days
    max_file_size: 10 * 1024 * 1024, // 10MB
    max_storage: 100 * 1024 * 1024, // 100MB
    features: ['all_tools'], // All tools included
    max_concurrent_jobs: 1,
    support: 'basic',
  },
  PRO: {
    operations_per_day: -1, // Unlimited per day
    operations_per_month: 1000,
    max_file_size: 500 * 1024 * 1024, // 500MB
    max_storage: 10 * 1024 * 1024 * 1024, // 10GB
    features: ['all_tools', 'priority_processing', 'api_access'],
    max_concurrent_jobs: 5,
    support: 'email',
  },
  BUSINESS: {
    operations_per_day: -1, // Unlimited
    operations_per_month: -1, // Unlimited
    max_file_size: 2 * 1024 * 1024 * 1024, // 2GB
    max_storage: 100 * 1024 * 1024 * 1024, // 100GB
    features: ['all_tools', 'priority_processing', 'api_access', 'custom_branding'],
    max_concurrent_jobs: 20,
    support: 'priority',
  },
}

// Tool categories for organized display - Updated with finance theme colors
export const TOOL_CATEGORIES = [
  {
    id: 'pdf',
    name: 'PDF Tools',
    icon: '📄',
    color: 'from-[#0ea5e9] to-[#8b5cf6]', // Blue to Purple gradient
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
    color: 'from-[#8b5cf6] to-[#a78bfa]', // Purple to Light Purple gradient
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
    color: 'from-[#10b981] to-[#06b6d4]', // Emerald to Cyan gradient
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
    color: 'from-[#06b6d4] to-[#0ea5e9]', // Cyan to Blue gradient
    description: 'Image editing and conversion',
    subcategories: [
      { name: 'Convert', tools: ['image-convert', 'image-format-webp', 'image-format-avif'] },
      { name: 'Optimize', tools: ['image-compress', 'image-resize', 'image-optimize'] },
      { name: 'Edit', tools: ['image-crop', 'image-rotate', 'image-watermark', 'image-filter'] },
    ]
  },
]
