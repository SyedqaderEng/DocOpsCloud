'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFMetadataPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-metadata',
        name: 'Edit Metadata',
        description: 'Change PDF document properties',
        icon: 'ℹ️',
        apiEndpoint: '/api/tools/pdf-metadata',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{
        title: '',
        author: '',
        subject: '',
        keywords: '',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          {['title', 'author', 'subject', 'keywords'].map((field) => (
            <div key={field}>
              <label className="text-sm text-gray-300 mb-2 block capitalize">{field}</label>
              <input
                type="text"
                value={settings[field]}
                onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
                placeholder={`Enter ${field}`}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
                disabled={processing}
              />
            </div>
          ))}
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, metadata: settings })}
      features={[
        { title: 'Edit All Properties', description: 'Change title, author, subject, keywords' },
        { title: 'Professional Documents', description: 'Add proper metadata for business PDFs' },
        { title: 'SEO Friendly', description: 'Improve document discoverability' },
      ]}
    />
  )
}
