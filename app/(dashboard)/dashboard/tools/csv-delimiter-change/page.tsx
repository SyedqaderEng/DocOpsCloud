'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function CsvDelimiterChangePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'csv-delimiter-change',
        name: 'Change CSV Delimiter',
        description: 'Convert between different CSV delimiter formats',
        icon: '⚙️',
        apiEndpoint: '/api/tools/csv-delimiter-change',
        acceptedFileTypes: '.csv',
        acceptedMimeTypes: 'text/csv',
      }}
      defaultSettings={{
        sourceDelimiter: ',',
        targetDelimiter: ';',
        autoDetect: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Source Delimiter</label>
            <select
              value={settings.sourceDelimiter}
              onChange={(e) => setSettings({ ...settings, sourceDelimiter: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing || settings.autoDetect}
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Target Delimiter</label>
            <select
              value={settings.targetDelimiter}
              onChange={(e) => setSettings({ ...settings, targetDelimiter: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoDetect}
              onChange={(e) => setSettings({ ...settings, autoDetect: e.target.checked })}
              className="w-4 h-4"
              disabled={processing}
            />
            <span className="text-white">Auto-detect Source Delimiter</span>
          </label>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Auto-detection', description: 'Automatically detect current delimiter' },
        { title: 'All Formats', description: 'Comma, semicolon, tab, pipe' },
        { title: 'Preserve Data', description: 'No data loss during conversion' },
      ]}
    />
  )
}
