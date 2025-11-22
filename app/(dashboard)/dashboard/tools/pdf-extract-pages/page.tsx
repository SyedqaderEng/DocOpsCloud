'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFExtractPagesPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-extract-pages',
        name: 'Extract Pages',
        description: 'Extract specific pages from PDF',
        icon: '📄',
        apiEndpoint: '/api/tools/pdf-extract-pages',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{ pages: '1,2,3' }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div>
          <label className="text-sm text-gray-300 mb-2 block">Pages to Extract</label>
          <input
            type="text"
            value={settings.pages}
            onChange={(e) => setSettings({ ...settings, pages: e.target.value })}
            placeholder="e.g., 1,3,5 or 1-5 or 1,3-7,10"
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
            disabled={processing}
          />
          <p className="text-xs text-gray-400 mt-2">Specify pages like: 1,3,5 or ranges like: 1-5</p>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, pages: settings.pages })}
      features={[
        { title: 'Extract Specific Pages', description: 'Choose exactly which pages to extract' },
        { title: 'Range Support', description: 'Use ranges like 1-10 for convenience' },
        { title: 'Multiple Selections', description: 'Combine individual pages and ranges' },
      ]}
    />
  )
}
