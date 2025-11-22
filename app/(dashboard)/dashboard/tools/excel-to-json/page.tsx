'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelToJsonPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-to-json',
        name: 'Excel to JSON',
        description: 'Convert Excel spreadsheets to JSON format',
        icon: '🔄',
        apiEndpoint: '/api/tools/excel-to-json',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        format: 'array',
        includeEmptyRows: false,
        prettyPrint: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">JSON Format</label>
            <select
              value={settings.format}
              onChange={(e) => setSettings({ ...settings, format: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="array">Array of Objects</option>
              <option value="object">Single Object</option>
              <option value="nested">Nested Structure</option>
            </select>
          </div>
          <div className="space-y-2">
            {[
              { key: 'includeEmptyRows', label: 'Include Empty Rows' },
              { key: 'prettyPrint', label: 'Pretty Print (Formatted)' },
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
        { title: 'Multiple Formats', description: 'Array, object, or nested JSON' },
        { title: 'Type Conversion', description: 'Smart data type detection' },
        { title: 'Clean Output', description: 'Remove empty rows and cells' },
      ]}
    />
  )
}
