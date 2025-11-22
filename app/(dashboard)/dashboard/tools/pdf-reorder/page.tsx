'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PdfReorderPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-reorder',
        name: 'Reorder PDF Pages',
        description: 'Rearrange pages in any order',
        icon: '🔢',
        apiEndpoint: '/api/tools/pdf-reorder',
        acceptedFileTypes: '.pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{
        pageOrder: '',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">New Page Order</label>
            <input
              type="text"
              value={settings.pageOrder}
              onChange={(e) => setSettings({ ...settings, pageOrder: e.target.value })}
              placeholder="e.g., 3,1,2,4 or 5-1 (reverse)"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter page numbers separated by commas, or use ranges (e.g., 1-3,5,7-9)
            </p>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Flexible Reordering', description: 'Any page order you want' },
        { title: 'Visual Preview', description: 'See pages before reordering' },
        { title: 'Drag & Drop', description: 'Interactive page arrangement' },
      ]}
    />
  )
}
