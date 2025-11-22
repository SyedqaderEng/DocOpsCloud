'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageGrayscalePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-grayscale',
        name: 'Convert to Grayscale',
        description: 'Convert images to black and white',
        icon: '⚫',
        apiEndpoint: '/api/tools/image-grayscale',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        method: 'luminosity',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Conversion Method</label>
            <select
              value={settings.method}
              onChange={(e) => setSettings({ ...settings, method: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="luminosity">Luminosity (Recommended)</option>
              <option value="average">Average</option>
              <option value="lightness">Lightness</option>
            </select>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Perfect B&W', description: 'Professional grayscale conversion' },
        { title: 'Multiple Methods', description: 'Choose conversion algorithm' },
        { title: 'Classic Look', description: 'Timeless black and white style' },
      ]}
    />
  )
}
