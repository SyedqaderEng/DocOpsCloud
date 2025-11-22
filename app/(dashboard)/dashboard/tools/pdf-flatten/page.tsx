'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFFlattenPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-flatten',
        name: 'Flatten PDF',
        description: 'Convert forms to static content',
        icon: '📄',
        apiEndpoint: '/api/tools/pdf-flatten',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Flatten Forms', description: 'Convert fillable forms to static content' },
        { title: 'Lock Content', description: 'Prevent further editing of form fields' },
        { title: 'Universal Compatibility', description: 'Flattened PDFs work everywhere' },
      ]}
    />
  )
}
