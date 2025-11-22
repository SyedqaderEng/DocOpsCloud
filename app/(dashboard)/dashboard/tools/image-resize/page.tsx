'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageResizePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-resize',
        name: 'Resize Image',
        description: 'Change image dimensions',
        icon: '📐',
        apiEndpoint: '/api/tools/image-resize',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        width: 1920,
        height: 1080,
        maintainAspectRatio: true,
        resizeMode: 'fit',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Width (px)</label>
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
              <label className="text-sm text-gray-300 mb-2 block">Height (px)</label>
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
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Resize Mode</label>
            <select
              value={settings.resizeMode}
              onChange={(e) => setSettings({ ...settings, resizeMode: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="fit">Fit (maintain aspect ratio)</option>
              <option value="fill">Fill (crop if needed)</option>
              <option value="stretch">Stretch (ignore aspect ratio)</option>
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintainAspectRatio}
              onChange={(e) => setSettings({ ...settings, maintainAspectRatio: e.target.checked })}
              className="w-4 h-4"
              disabled={processing}
            />
            <span className="text-white">Maintain Aspect Ratio</span>
          </label>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Custom Dimensions', description: 'Set exact width and height' },
        { title: 'Smart Resize', description: 'Maintain aspect ratio automatically' },
        { title: 'Multiple Modes', description: 'Fit, fill, or stretch options' },
      ]}
    />
  )
}
