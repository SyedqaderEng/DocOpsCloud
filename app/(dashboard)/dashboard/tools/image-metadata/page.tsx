'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ImageMetadataPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'image-metadata',
        name: 'View Image Metadata',
        description: 'View and edit EXIF data',
        icon: 'ℹ️',
        apiEndpoint: '/api/tools/image-metadata',
        acceptedFileTypes: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        acceptedMimeTypes: 'image/jpeg,image/png,image/gif,image/bmp,image/webp',
      }}
      defaultSettings={{
        title: '',
        author: '',
        copyright: '',
        description: '',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          {['title', 'author', 'copyright', 'description'].map((field) => (
            <div key={field}>
              <label className="text-sm text-gray-300 mb-2 block capitalize">{field}</label>
              <input
                type="text"
                value={settings[field]}
                onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
                placeholder={`Enter ${field}`}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
                disabled={processing}
              />
            </div>
          ))}
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, metadata: settings })}
      features={[
        { title: 'View EXIF Data', description: 'See camera settings, date, location' },
        { title: 'Edit Metadata', description: 'Update title, author, copyright' },
        { title: 'Preserve Info', description: 'Keep important image data' },
      ]}
    />
  )
}
