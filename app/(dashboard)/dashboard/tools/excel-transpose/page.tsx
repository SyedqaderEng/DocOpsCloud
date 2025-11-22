'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelTransposePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-transpose',
        name: 'Transpose Excel',
        description: 'Convert rows to columns and vice versa',
        icon: '🔄',
        apiEndpoint: '/api/tools/excel-transpose',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        preserveFormatting: true,
        includeFormulas: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-2">
          {[
            { key: 'preserveFormatting', label: 'Preserve Cell Formatting' },
            { key: 'includeFormulas', label: 'Convert Formulas' },
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
        { title: 'Swap Rows & Columns', description: 'Rotate your data 90 degrees' },
        { title: 'Keep Formatting', description: 'Preserve colors, fonts, borders' },
        { title: 'Formula Support', description: 'Update formula references automatically' },
      ]}
    />
  )
}
