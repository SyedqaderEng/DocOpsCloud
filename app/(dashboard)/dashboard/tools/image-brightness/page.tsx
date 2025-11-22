'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageBrightnessPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-brightness',
        name: 'Adjust Brightness',
        description: 'Make images lighter or darker',
        icon: '☀️',
        apiEndpoint: '/api/tools/image-brightness',
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
              Brightness: {settings.level > 0 ? '+' : ''}{settings.level}
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
              <span>Darker</span>
              <span>Normal</span>
              <span>Lighter</span>
            </div>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Brightness Control', description: 'Make images lighter or darker' },
        { title: 'Real-time Preview', description: 'See changes before applying' },
        { title: 'Fix Dark Photos', description: 'Rescue underexposed images' },
      ]}
    />
  )
}
