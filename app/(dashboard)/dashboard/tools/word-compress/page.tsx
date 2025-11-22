'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordCompressPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-compress',
        name: 'Compress Word',
        description: 'Reduce Word document file size',
        icon: '🗜️',
        apiEndpoint: '/api/tools/word-compress',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{ quality: 'medium' }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div>
          <label className="text-sm text-gray-300 mb-2 block">Compression Quality</label>
          <select
            value={settings.quality}
            onChange={(e) => setSettings({ ...settings, quality: e.target.value })}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
            disabled={processing}
          >
            <option value="high">High Quality (~30% reduction)</option>
            <option value="medium">Medium Quality (~50% reduction)</option>
            <option value="low">Low Quality (~70% reduction)</option>
          </select>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, quality: settings.quality })}
      features={[
        { title: 'Reduce File Size', description: 'Compress images and remove unused data' },
        { title: 'Quality Options', description: 'Choose compression level' },
        { title: 'Faster Sharing', description: 'Smaller files are easier to email' },
      ]}
    />
  )
}
