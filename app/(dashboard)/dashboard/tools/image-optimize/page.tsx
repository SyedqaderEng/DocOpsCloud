'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageOptimizePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-optimize',
        name: 'Optimize Image',
        description: 'Optimize images for web performance',
        icon: '⚡',
        apiEndpoint: '/api/tools/image-optimize',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/webp',
      }}
      defaultSettings={{
        targetSize: 'web',
        stripMetadata: true,
        convertToWebP: false,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Target Use</label>
            <select
              value={settings.targetSize}
              onChange={(e) => setSettings({ ...settings, targetSize: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="web">Web (Balanced)</option>
              <option value="thumbnail">Thumbnail (Small)</option>
              <option value="social">Social Media</option>
              <option value="email">Email Attachment</option>
            </select>
          </div>
          <div className="space-y-2">
            {[
              { key: 'stripMetadata', label: 'Strip Metadata (Reduce Size)' },
              { key: 'convertToWebP', label: 'Convert to WebP (Best Compression)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                  className="w-4 h-4"
                  disabled={processing}
                />
                <span className="text-white">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Web Optimization', description: 'Reduce size for faster loading' },
        { title: 'Smart Compression', description: 'Optimize without quality loss' },
        { title: 'WebP Conversion', description: 'Modern format for best compression' },
      ]}
    />
  )
}
