'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function CsvToExcelPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'csv-to-excel',
        name: 'CSV to Excel',
        description: 'Convert CSV files to Excel spreadsheets',
        icon: '📈',
        apiEndpoint: '/api/tools/csv-to-excel',
        acceptedFileTypes: '.csv',
        acceptedMimeTypes: 'text/csv',
      }}
      defaultSettings={{
        delimiter: ',',
        hasHeaders: true,
        autoDetectTypes: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">CSV Delimiter</label>
            <select
              value={settings.delimiter}
              onChange={(e) => setSettings({ ...settings, delimiter: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
          <div className="space-y-2">
            {[
              { key: 'hasHeaders', label: 'First Row is Headers' },
              { key: 'autoDetectTypes', label: 'Auto-detect Data Types' },
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
        { title: 'Smart Import', description: 'Auto-detect delimiters and data types' },
        { title: 'Format Preservation', description: 'Maintain data formatting' },
        { title: 'Large Files', description: 'Handle files with millions of rows' },
      ]}
    />
  )
}
