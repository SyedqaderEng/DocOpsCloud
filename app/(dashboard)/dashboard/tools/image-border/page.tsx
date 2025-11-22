'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageBorderPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-border',
        name: 'Add Border',
        description: 'Add borders and frames to images',
        icon: '🖼️',
        apiEndpoint: '/api/tools/image-border',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        width: 10,
        color: '#000000',
        style: 'solid',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Border Width: {settings.width}px</label>
            <input
              type="range"
              value={settings.width}
              onChange={(e) => setSettings({ ...settings, width: parseInt(e.target.value) })}
              min="1"
              max="50"
              className="w-full"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Border Color</label>
            <input
              type="color"
              value={settings.color}
              onChange={(e) => setSettings({ ...settings, color: e.target.value })}
              className="w-full h-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Border Style</label>
            <select
              value={settings.style}
              onChange={(e) => setSettings({ ...settings, style: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="solid">Solid</option>
              <option value="rounded">Rounded</option>
              <option value="shadow">With Shadow</option>
            </select>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Custom Border', description: 'Any color and width' },
        { title: 'Multiple Styles', description: 'Solid, rounded, with shadow' },
        { title: 'Professional Look', description: 'Frame your images perfectly' },
      ]}
    />
  )
}
