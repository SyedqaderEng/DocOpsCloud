'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageSepiaPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-sepia',
        name: 'Apply Sepia Tone',
        description: 'Give images a vintage sepia look',
        icon: '🟤',
        apiEndpoint: '/api/tools/image-sepia',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        intensity: 100,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Sepia Intensity: {settings.intensity}%</label>
            <input
              type="range"
              value={settings.intensity}
              onChange={(e) => setSettings({ ...settings, intensity: parseInt(e.target.value) })}
              min="0"
              max="100"
              className="w-full"
              disabled={processing}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Subtle</span>
              <span>Full Sepia</span>
            </div>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Vintage Effect', description: 'Classic sepia tone look' },
        { title: 'Adjustable Intensity', description: 'Control the effect strength' },
        { title: 'Old Photo Style', description: 'Perfect for retro aesthetics' },
      ]}
    />
  )
}
