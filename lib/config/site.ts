export const siteConfig = {
  name: 'DocOpsCloud',
  description: '105+ document processing tools for PDF, Word, Excel, CSV, and Image files',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',
  links: {
    twitter: 'https://twitter.com/docopscloud',
    github: 'https://github.com/docopscloud',
  },
}

export type SiteConfig = typeof siteConfig
