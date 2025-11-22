'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordToPDFPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-to-pdf',
        name: 'Word to PDF',
        description: 'Convert DOCX documents to PDF format',
        icon: '📄',
        apiEndpoint: '/api/tools/word-to-pdf',
        acceptedFileTypes: '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'High Quality Conversion', description: 'Preserves formatting, fonts, and images' },
        { title: 'Fast Processing', description: 'Quick conversion in seconds' },
        { title: 'Universal Compatibility', description: 'PDFs work on any device' },
      ]}
    />
  )
}
