'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageBlurPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-blur',
        name: 'Blur Image',
        description: 'Apply blur effect to images',
        icon: '〰️',
        apiEndpoint: '/api/tools/image-blur',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        strength: 5,
        type: 'gaussian',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Blur Type</label>
            <select
              value={settings.type}
              onChange={(e) => setSettings({ ...settings, type: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="gaussian">Gaussian Blur</option>
              <option value="motion">Motion Blur</option>
              <option value="radial">Radial Blur</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Blur Strength: {settings.strength}</label>
            <input
              type="range"
              value={settings.strength}
              onChange={(e) => setSettings({ ...settings, strength: parseInt(e.target.value) })}
              min="1"
              max="20"
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
        { title: 'Multiple Blur Types', description: 'Gaussian, motion, radial' },
        { title: 'Adjustable Strength', description: 'From subtle to strong' },
        { title: 'Privacy Protection', description: 'Blur sensitive information' },
      ]}
    />
  )
}
