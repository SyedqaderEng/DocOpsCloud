'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFLinearizePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-linearize',
        name: 'Linearize PDF',
        description: 'Optimize for fast web view',
        icon: '⚡',
        apiEndpoint: '/api/tools/pdf-linearize',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Fast Web View', description: 'Enable page-at-a-time downloading' },
        { title: 'Better User Experience', description: 'Users can start viewing before full download' },
        { title: 'Web Optimized', description: 'Perfect for online PDF viewing' },
      ]}
    />
  )
}
