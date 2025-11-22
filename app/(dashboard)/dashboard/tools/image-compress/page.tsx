'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageCompressPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-compress',
        name: 'Compress Image',
        description: 'Reduce image file size',
        icon: '🗜️',
        apiEndpoint: '/api/tools/image-compress',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/webp',
      }}
      defaultSettings={{
        quality: 80,
        format: 'auto',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
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
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Output Format</label>
            <select
              value={settings.format}
              onChange={(e) => setSettings({ ...settings, format: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="auto">Auto (keep original)</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Smart Compression', description: 'Reduce size by up to 80%' },
        { title: 'Quality Control', description: 'Adjust compression level' },
        { title: 'Format Conversion', description: 'Convert to WebP for better compression' },
      ]}
    />
  )
}
