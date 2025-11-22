'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PdfOptimizeWebPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-optimize-web',
        name: 'Optimize PDF for Web',
        description: 'Optimize PDFs for fast web viewing',
        icon: '🌐',
        apiEndpoint: '/api/tools/pdf-optimize-web',
        acceptedFileTypes: '.pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{
        compressionLevel: 'medium',
        linearize: true,
        embedFonts: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Compression Level</label>
            <select
              value={settings.compressionLevel}
              onChange={(e) => setSettings({ ...settings, compressionLevel: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="low">Low (Faster, Larger)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Slower, Smaller)</option>
            </select>
          </div>
          <div className="space-y-2">
            {[
              { key: 'linearize', label: 'Linearize (Fast Web View)' },
              { key: 'embedFonts', label: 'Embed Fonts' },
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
        { title: 'Fast Loading', description: 'Optimize for web viewing' },
        { title: 'Linearization', description: 'Enable page-at-a-time loading' },
        { title: 'Compression', description: 'Reduce file size significantly' },
      ]}
    />
  )
}
