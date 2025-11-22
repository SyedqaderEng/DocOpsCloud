'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordToTxtPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-to-txt',
        name: 'Word to Text',
        description: 'Extract plain text from Word documents',
        icon: '📝',
        apiEndpoint: '/api/tools/word-to-txt',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Plain Text Extraction', description: 'Remove all formatting, keep text' },
        { title: 'Small File Size', description: 'Text files are very small' },
        { title: 'Universal', description: 'Works on any device or platform' },
      ]}
    />
  )
}
