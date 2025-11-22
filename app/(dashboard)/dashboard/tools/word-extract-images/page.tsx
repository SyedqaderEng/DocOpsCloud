'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordExtractImagesPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-extract-images',
        name: 'Extract Images',
        description: 'Save all images from Word documents',
        icon: '🖼️',
        apiEndpoint: '/api/tools/word-extract-images',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Extract All Images', description: 'Save all embedded images' },
        { title: 'Original Quality', description: 'Images saved in original resolution' },
        { title: 'ZIP Archive', description: 'All images packaged in one file' },
      ]}
    />
  )
}
