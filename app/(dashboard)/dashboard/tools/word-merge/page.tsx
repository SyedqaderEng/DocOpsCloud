'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordMergePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-merge',
        name: 'Merge Word Documents',
        description: 'Combine multiple Word files into one',
        icon: '🔗',
        apiEndpoint: '/api/tools/word-merge',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Combine Documents', description: 'Merge multiple Word files into one' },
        { title: 'Preserve Formatting', description: 'Keeps styles and formatting intact' },
        { title: 'Page Breaks', description: 'Automatically adds page breaks between documents' },
      ]}
    />
  )
}
