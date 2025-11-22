'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageFlipPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-flip',
        name: 'Flip Image',
        description: 'Flip images horizontally or vertically',
        icon: '↔️',
        apiEndpoint: '/api/tools/image-flip',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        direction: 'horizontal',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Flip Direction</label>
            <select
              value={settings.direction}
              onChange={(e) => setSettings({ ...settings, direction: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="horizontal">Horizontal (Left ↔ Right)</option>
              <option value="vertical">Vertical (Top ↔ Bottom)</option>
              <option value="both">Both Directions</option>
            </select>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Horizontal Flip', description: 'Mirror image left to right' },
        { title: 'Vertical Flip', description: 'Mirror image top to bottom' },
        { title: 'Both Directions', description: 'Flip in both axes' },
      ]}
    />
  )
}
