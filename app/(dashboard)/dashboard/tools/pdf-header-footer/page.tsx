'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFHeaderFooterPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-header-footer',
        name: 'Add Header/Footer',
        description: 'Add headers and footers to PDF pages',
        icon: '📋',
        apiEndpoint: '/api/tools/pdf-header-footer',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{
        headerText: '',
        footerText: 'Page {n}',
        fontSize: 10,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Header Text</label>
            <input
              type="text"
              value={settings.headerText}
              onChange={(e) => setSettings({ ...settings, headerText: e.target.value })}
              placeholder="Enter header text"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Footer Text</label>
            <input
              type="text"
              value={settings.footerText}
              onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
              placeholder="Enter footer text"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
            <p className="text-xs text-gray-400 mt-2">Use {'{n}'} for page number, {'{total}'} for total pages</p>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Custom Headers & Footers', description: 'Add any text to header or footer' },
        { title: 'Page Numbers', description: 'Include dynamic page numbering' },
        { title: 'Applied to All Pages', description: 'Automatically added to every page' },
      ]}
    />
  )
}
