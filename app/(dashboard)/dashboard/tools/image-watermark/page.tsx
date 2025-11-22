'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageWatermarkPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-watermark',
        name: 'Add Watermark',
        description: 'Add text watermarks to images',
        icon: '©️',
        apiEndpoint: '/api/tools/image-watermark',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        text: 'Copyright',
        position: 'bottom-right',
        opacity: 0.5,
        fontSize: 24,
        color: '#FFFFFF',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Watermark Text</label>
            <input
              type="text"
              value={settings.text}
              onChange={(e) => setSettings({ ...settings, text: e.target.value })}
              placeholder="Copyright or your name"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Position</label>
            <select
              value={settings.position}
              onChange={(e) => setSettings({ ...settings, position: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="top-left">Top Left</option>
              <option value="top-right">Top Right</option>
              <option value="center">Center</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Font Size</label>
              <input
                type="number"
                value={settings.fontSize}
                onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                min="8"
                max="100"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                disabled={processing}
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Color</label>
              <input
                type="color"
                value={settings.color}
                onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                className="w-full h-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg"
                disabled={processing}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Opacity: {Math.round(settings.opacity * 100)}%</label>
            <input
              type="range"
              value={settings.opacity}
              onChange={(e) => setSettings({ ...settings, opacity: parseFloat(e.target.value) })}
              min="0"
              max="1"
              step="0.1"
              className="w-full"
              disabled={processing}
            />
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Custom Text', description: 'Add any text as watermark' },
        { title: 'Flexible Positioning', description: 'Place watermark anywhere' },
        { title: 'Adjustable Opacity', description: 'Control transparency' },
      ]}
    />
  )
}
