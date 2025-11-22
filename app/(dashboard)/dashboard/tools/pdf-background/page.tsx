'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PdfBackgroundPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-background',
        name: 'Add PDF Background',
        description: 'Add background color or image to PDF pages',
        icon: '🎨',
        apiEndpoint: '/api/tools/pdf-background',
        acceptedFileTypes: '.pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{
        backgroundColor: '#FFFFFF',
        opacity: 1.0,
        applyToAllPages: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Background Color</label>
            <input
              type="color"
              value={settings.backgroundColor}
              onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
              className="w-full h-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Opacity: {Math.round(settings.opacity * 100)}%</label>
            <input
              type="range"
              value={settings.opacity}
              onChange={(e) => setSettings({ ...settings, opacity: parseFloat(e.target.value) })}
              min="0"
              max="1"
              step="0.1"
              className="w-full"
              disabled={processing}
            />
          </div>
          <label className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.applyToAllPages}
              onChange={(e) => setSettings({ ...settings, applyToAllPages: e.target.checked })}
              className="w-4 h-4"
              disabled={processing}
            />
            <span className="text-white">Apply to All Pages</span>
          </label>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Color Background', description: 'Add any color background' },
        { title: 'Opacity Control', description: 'Adjust transparency' },
        { title: 'Selective Application', description: 'Apply to specific pages' },
      ]}
    />
  )
}
