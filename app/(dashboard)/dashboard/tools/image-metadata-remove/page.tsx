'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageMetadataRemovePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-metadata-remove',
        name: 'Remove Metadata',
        description: 'Strip EXIF data for privacy',
        icon: '🔒',
        apiEndpoint: '/api/tools/image-metadata-remove',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        removeAll: true,
        keepColorProfile: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-2">
          {[
            { key: 'removeAll', label: 'Remove All Metadata' },
            { key: 'keepColorProfile', label: 'Keep Color Profile' },
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
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Privacy Protection', description: 'Remove location and camera data' },
        { title: 'Reduce File Size', description: 'Strip unnecessary metadata' },
        { title: 'Safe Sharing', description: 'Share photos without personal info' },
      ]}
    />
  )
}
