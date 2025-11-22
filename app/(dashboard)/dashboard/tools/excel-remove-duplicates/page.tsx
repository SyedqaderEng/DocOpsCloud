'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelRemoveDuplicatesPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-remove-duplicates',
        name: 'Remove Excel Duplicates',
        description: 'Find and remove duplicate rows in Excel files',
        icon: '🔍',
        apiEndpoint: '/api/tools/excel-remove-duplicates',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        compareBy: 'all',
        keepFirst: true,
        caseSensitive: false,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Compare By</label>
            <select
              value={settings.compareBy}
              onChange={(e) => setSettings({ ...settings, compareBy: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="all">All Columns</option>
              <option value="selected">Selected Columns</option>
              <option value="key">Key Column</option>
            </select>
          </div>
          <div className="space-y-2">
            {[
              { key: 'keepFirst', label: 'Keep First Occurrence' },
              { key: 'caseSensitive', label: 'Case Sensitive Comparison' },
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
        { title: 'Smart Detection', description: 'Find duplicates across columns' },
        { title: 'Flexible Comparison', description: 'Compare by all or selected columns' },
        { title: 'Preserve Data', description: 'Keep first or last occurrence' },
      ]}
    />
  )
}
