'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageContrastPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-contrast',
        name: 'Adjust Contrast',
        description: 'Increase or decrease image contrast',
        icon: '◐',
        apiEndpoint: '/api/tools/image-contrast',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        level: 0,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Contrast: {settings.level > 0 ? '+' : ''}{settings.level}
            </label>
            <input
              type="range"
              value={settings.level}
              onChange={(e) => setSettings({ ...settings, level: parseInt(e.target.value) })}
              min="-100"
              max="100"
              className="w-full"
              disabled={processing}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Less Contrast</span>
              <span>Normal</span>
              <span>More Contrast</span>
            </div>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Contrast Adjustment', description: 'Enhance or reduce contrast' },
        { title: 'Detail Enhancement', description: 'Make details pop' },
        { title: 'Fix Flat Images', description: 'Add depth to washed-out photos' },
      ]}
    />
  )
}
