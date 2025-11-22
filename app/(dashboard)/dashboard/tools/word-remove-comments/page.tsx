'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordRemoveCommentsPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-remove-comments',
        name: 'Remove Comments',
        description: 'Clean up tracked changes and comments from Word documents',
        icon: '🗑️',
        apiEndpoint: '/api/tools/word-remove-comments',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Remove All Comments', description: 'Delete all comments from document' },
        { title: 'Accept Track Changes', description: 'Accept all tracked changes' },
        { title: 'Clean Document', description: 'Perfect for final versions' },
      ]}
    />
  )
}
