'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordToHTMLPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-to-html',
        name: 'Word to HTML',
        description: 'Convert Word documents to clean HTML',
        icon: '🌐',
        apiEndpoint: '/api/tools/word-to-html',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Clean HTML Output', description: 'Well-formatted, semantic HTML' },
        { title: 'Preserves Styling', description: 'Converts Word styles to CSS' },
        { title: 'Web Ready', description: 'Perfect for websites and blogs' },
      ]}
    />
  )
}
