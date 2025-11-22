'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageRotatePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-rotate',
        name: 'Rotate Image',
        description: 'Rotate images by any angle',
        icon: '🔄',
        apiEndpoint: '/api/tools/image-rotate',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        angle: 90,
        backgroundColor: '#FFFFFF',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Rotation Angle: {settings.angle}°</label>
            <input
              type="range"
              value={settings.angle}
              onChange={(e) => setSettings({ ...settings, angle: parseInt(e.target.value) })}
              min="0"
              max="360"
              className="w-full"
              disabled={processing}
            />
            <div className="flex gap-2 mt-2">
              {[90, 180, 270].map((angle) => (
                <button
                  key={angle}
                  onClick={() => setSettings({ ...settings, angle })}
                  className="px-3 py-2 glass rounded text-white text-sm"
                  disabled={processing}
                >
                  {angle}°
                </button>
              ))}
            </div>
          </div>
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
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Any Angle', description: 'Rotate by 1-360 degrees' },
        { title: 'Quick Presets', description: 'Common angles: 90°, 180°, 270°' },
        { title: 'Custom Background', description: 'Set background color for rotated areas' },
      ]}
    />
  )
}
