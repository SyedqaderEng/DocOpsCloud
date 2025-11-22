'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function HashGeneratorPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'hash-generator',
        name: 'Hash Generator',
        description: 'Generate file checksums and hashes',
        icon: '#️⃣',
        apiEndpoint: '/api/tools/hash-generator',
        acceptedFileTypes: '*',
        acceptedMimeTypes: '*/*',
      }}
      defaultSettings={{
        algorithms: ['md5', 'sha1', 'sha256'],
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-2">
          <label className="text-sm text-gray-300 mb-2 block">Hash Algorithms</label>
          {[
            { key: 'md5', label: 'MD5' },
            { key: 'sha1', label: 'SHA-1' },
            { key: 'sha256', label: 'SHA-256' },
            { key: 'sha512', label: 'SHA-512' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={settings.algorithms.includes(key)}
                onChange={(e) => {
                  const newAlgorithms = e.target.checked
                    ? [...settings.algorithms, key]
                    : settings.algorithms.filter((a: string) => a !== key)
                  setSettings({ ...settings, algorithms: newAlgorithms })
                }}
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
        { title: 'Multiple Algorithms', description: 'MD5, SHA-1, SHA-256, SHA-512' },
        { title: 'File Verification', description: 'Verify file integrity' },
        { title: 'Checksum Generation', description: 'Generate checksums for any file' },
      ]}
    />
  )
}
