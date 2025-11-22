'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFGrayscalePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-grayscale',
        name: 'Convert to Grayscale',
        description: 'Remove colors from PDF',
        icon: '⚫',
        apiEndpoint: '/api/tools/pdf-grayscale',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{}}
      prepareRequestBody={(fileId) => ({ fileId })}
      features={[
        { title: 'Remove All Colors', description: 'Convert PDF to black and white' },
        { title: 'Reduce File Size', description: 'Grayscale PDFs are often smaller' },
        { title: 'Print-Friendly', description: 'Perfect for black and white printing' },
      ]}
    />
  )
}
