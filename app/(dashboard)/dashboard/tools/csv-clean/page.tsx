'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function CsvCleanPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'csv-clean',
        name: 'Clean CSV',
        description: 'Remove duplicates and fix formatting issues in CSV files',
        icon: '🧹',
        apiEndpoint: '/api/tools/csv-clean',
        acceptedFileTypes: '.csv',
        acceptedMimeTypes: 'text/csv',
      }}
      defaultSettings={{
        removeDuplicates: true,
        trimWhitespace: true,
        removeEmptyRows: true,
        fixEncoding: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-2">
          {[
            { key: 'removeDuplicates', label: 'Remove Duplicate Rows' },
            { key: 'trimWhitespace', label: 'Trim Whitespace' },
            { key: 'removeEmptyRows', label: 'Remove Empty Rows' },
            { key: 'fixEncoding', label: 'Fix Encoding Issues' },
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
        { title: 'Auto-fix Issues', description: 'Detect and fix common CSV problems' },
        { title: 'Duplicate Removal', description: 'Remove exact duplicate rows' },
        { title: 'Encoding Fix', description: 'Fix UTF-8 and special character issues' },
      ]}
    />
  )
}
