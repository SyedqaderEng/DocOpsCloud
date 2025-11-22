'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageSaturationPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-saturation',
        name: 'Adjust Saturation',
        description: 'Control image color intensity',
        icon: '🎨',
        apiEndpoint: '/api/tools/image-saturation',
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
              Saturation: {settings.level > 0 ? '+' : ''}{settings.level}
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
              <span>Desaturate</span>
              <span>Normal</span>
              <span>Vibrant</span>
            </div>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Color Control', description: 'Enhance or reduce color intensity' },
        { title: 'Vibrant Colors', description: 'Make colors pop' },
        { title: 'Vintage Effect', description: 'Desaturate for vintage look' },
      ]}
    />
  )
}
