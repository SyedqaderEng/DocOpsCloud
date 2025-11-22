'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordPageCountPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-page-count',
        name: 'Word Page Counter',
        description: 'Count pages, words, and characters in Word documents',
        icon: '🔢',
        apiEndpoint: '/api/tools/word-page-count',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Page Count', description: 'Get total number of pages' },
        { title: 'Word Count', description: 'Count all words in document' },
        { title: 'Character Count', description: 'Count characters with and without spaces' },
      ]}
    />
  )
}
