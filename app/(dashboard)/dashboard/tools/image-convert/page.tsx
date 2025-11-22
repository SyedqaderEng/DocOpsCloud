'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageConvertPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-convert',
        name: 'Convert Image Format',
        description: 'Convert between image formats',
        icon: '🔄',
        apiEndpoint: '/api/tools/image-convert',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.svg',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp,image/tiff,image/svg+xml',
      }}
      defaultSettings={{
        outputFormat: 'png',
        quality: 90,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Output Format</label>
            <select
              value={settings.outputFormat}
              onChange={(e) => setSettings({ ...settings, outputFormat: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
              <option value="gif">GIF</option>
              <option value="bmp">BMP</option>
              <option value="tiff">TIFF</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Quality: {settings.quality}%</label>
            <input
              type="range"
              value={settings.quality}
              onChange={(e) => setSettings({ ...settings, quality: parseInt(e.target.value) })}
              min="1"
              max="100"
              className="w-full"
              disabled={processing}
            />
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'All Formats', description: 'JPEG, PNG, WebP, GIF, BMP, TIFF' },
        { title: 'Batch Convert', description: 'Convert multiple images at once' },
        { title: 'Quality Control', description: 'Adjust output quality' },
      ]}
    />
  )
}
