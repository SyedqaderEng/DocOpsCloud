'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFPageNumbersPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-page-numbers',
        name: 'Add Page Numbers',
        description: 'Number your PDF pages automatically',
        icon: '🔢',
        apiEndpoint: '/api/tools/pdf-page-numbers',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{
        position: 'bottom-center',
        format: 'Page {n}',
        startNumber: 1,
        fontSize: 12,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Position</label>
            <select
              value={settings.position}
              onChange={(e) => setSettings({ ...settings, position: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-2 block">Format</label>
            <input
              type="text"
              value={settings.format}
              onChange={(e) => setSettings({ ...settings, format: e.target.value })}
              placeholder="Page {n}"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
            <p className="text-xs text-gray-400 mt-2">Use {'{n}'} for page number</p>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-2 block">Start Number: {settings.startNumber}</label>
            <input
              type="range"
              min="1"
              max="100"
              value={settings.startNumber}
              onChange={(e) => setSettings({ ...settings, startNumber: parseInt(e.target.value) })}
              className="w-full"
              disabled={processing}
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-2 block">Font Size: {settings.fontSize}px</label>
            <input
              type="range"
              min="8"
              max="24"
              value={settings.fontSize}
              onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
              className="w-full"
              disabled={processing}
            />
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Automatic Numbering', description: 'Add page numbers to all pages' },
        { title: 'Custom Format', description: 'Choose your numbering format' },
        { title: '6 Position Options', description: 'Place numbers anywhere on the page' },
      ]}
    />
  )
}
