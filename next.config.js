/** @type {import('next').NextConfig} */
const nextConfig = {
  // API-only backend server configuration
  output: 'standalone',

  // Disable ESLint during build (backend-only, no UI to lint)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during build (run separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Large file upload support for document processing
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },

  // Webpack configuration for PDF processing dependencies
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }]
    return config
  },

  // Disable static page generation (API routes only)
  trailingSlash: false,
}

module.exports = nextConfig
