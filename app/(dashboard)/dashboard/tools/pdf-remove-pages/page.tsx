'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFRemovePagesPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-remove-pages',
        name: 'Remove Pages',
        description: 'Delete specific pages from PDF',
        icon: '🗑️',
        apiEndpoint: '/api/tools/pdf-remove-pages',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{ pages: '' }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div>
          <label className="text-sm text-gray-300 mb-2 block">Pages to Remove</label>
          <input
            type="text"
            value={settings.pages}
            onChange={(e) => setSettings({ ...settings, pages: e.target.value })}
            placeholder="e.g., 2,4,6 or 2-5"
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
            disabled={processing}
          />
          <p className="text-xs text-gray-400 mt-2">Specify pages to delete</p>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, pages: settings.pages })}
      features={[
        { title: 'Remove Unwanted Pages', description: 'Delete specific pages from your PDF' },
        { title: 'Bulk Deletion', description: 'Remove multiple pages at once' },
        { title: 'Range Support', description: 'Delete page ranges like 5-10' },
      ]}
    />
  )
}
