'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordToMarkdownPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-to-markdown',
        name: 'Word to Markdown',
        description: 'Convert Word documents to Markdown format',
        icon: '📋',
        apiEndpoint: '/api/tools/word-to-markdown',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Markdown Conversion', description: 'Convert to standard Markdown format' },
        { title: 'GitHub Compatible', description: 'Works with GitHub, GitLab, etc.' },
        { title: 'Plain Text', description: 'Easy to edit and version control' },
      ]}
    />
  )
}
