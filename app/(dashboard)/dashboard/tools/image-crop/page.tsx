'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageCropPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-crop',
        name: 'Crop Image',
        description: 'Crop and trim images',
        icon: '✂️',
        apiEndpoint: '/api/tools/image-crop',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        x: 0,
        y: 0,
        width: 500,
        height: 500,
        aspectRatio: 'free',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Aspect Ratio</label>
            <select
              value={settings.aspectRatio}
              onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="free">Free</option>
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Landscape (16:9)</option>
              <option value="4:3">Standard (4:3)</option>
              <option value="9:16">Portrait (9:16)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">X Position</label>
              <input
                type="number"
                value={settings.x}
                onChange={(e) => setSettings({ ...settings, x: parseInt(e.target.value) })}
                min="0"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                disabled={processing}
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Y Position</label>
              <input
                type="number"
                value={settings.y}
                onChange={(e) => setSettings({ ...settings, y: parseInt(e.target.value) })}
                min="0"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                disabled={processing}
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Width</label>
              <input
                type="number"
                value={settings.width}
                onChange={(e) => setSettings({ ...settings, width: parseInt(e.target.value) })}
                min="1"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                disabled={processing}
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Height</label>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => setSettings({ ...settings, height: parseInt(e.target.value) })}
                min="1"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                disabled={processing}
              />
            </div>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Aspect Ratio Presets', description: 'Square, landscape, portrait' },
        { title: 'Precise Control', description: 'Set exact crop coordinates' },
        { title: 'Visual Editor', description: 'Interactive crop selection' },
      ]}
    />
  )
}
