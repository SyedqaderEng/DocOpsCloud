'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageSharpenPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-sharpen',
        name: 'Sharpen Image',
        description: 'Enhance image sharpness and clarity',
        icon: '✨',
        apiEndpoint: '/api/tools/image-sharpen',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        strength: 5,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Sharpen Strength: {settings.strength}</label>
            <input
              type="range"
              value={settings.strength}
              onChange={(e) => setSettings({ ...settings, strength: parseInt(e.target.value) })}
              min="1"
              max="10"
              className="w-full"
              disabled={processing}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Subtle</span>
              <span>Strong</span>
            </div>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Smart Sharpening', description: 'Enhance edges without artifacts' },
        { title: 'Adjustable Strength', description: 'From subtle to strong' },
        { title: 'Photo Enhancement', description: 'Perfect for blurry photos' },
      ]}
    />
  )
}
