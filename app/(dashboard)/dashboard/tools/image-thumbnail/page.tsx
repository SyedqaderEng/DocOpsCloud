'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageThumbnailPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-thumbnail',
        name: 'Create Thumbnail',
        description: 'Generate small preview thumbnails',
        icon: '🖼️',
        apiEndpoint: '/api/tools/image-thumbnail',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        size: 'medium',
        customWidth: 200,
        customHeight: 200,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Thumbnail Size</label>
            <select
              value={settings.size}
              onChange={(e) => setSettings({ ...settings, size: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="small">Small (100x100)</option>
              <option value="medium">Medium (200x200)</option>
              <option value="large">Large (400x400)</option>
              <option value="custom">Custom Size</option>
            </select>
          </div>
          {settings.size === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Width</label>
                <input
                  type="number"
                  value={settings.customWidth}
                  onChange={(e) => setSettings({ ...settings, customWidth: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                  disabled={processing}
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Height</label>
                <input
                  type="number"
                  value={settings.customHeight}
                  onChange={(e) => setSettings({ ...settings, customHeight: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                  disabled={processing}
                />
              </div>
            </div>
          )}
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Quick Thumbnails', description: 'Generate preview images instantly' },
        { title: 'Standard Sizes', description: 'Common thumbnail dimensions' },
        { title: 'Custom Dimensions', description: 'Set your own size' },
      ]}
    />
  )
}
