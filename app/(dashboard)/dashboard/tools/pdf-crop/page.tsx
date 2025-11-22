'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFCropPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-crop',
        name: 'Crop PDF',
        description: 'Trim margins and resize PDF pages',
        icon: '✂️',
        apiEndpoint: '/api/tools/pdf-crop',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          {['top', 'bottom', 'left', 'right'].map((side) => (
            <div key={side}>
              <label className="text-sm text-gray-300 mb-2 block capitalize">
                {side} Margin: {settings[side]}px
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={settings[side]}
                onChange={(e) => setSettings({ ...settings, [side]: parseInt(e.target.value) })}
                className="w-full"
                disabled={processing}
              />
            </div>
          ))}
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, margins: settings })}
      features={[
        { title: 'Trim Margins', description: 'Remove unwanted white space' },
        { title: 'Custom Cropping', description: 'Set margins for each side independently' },
        { title: 'All Pages', description: 'Crop applied to all pages' },
      ]}
    />
  )
}
