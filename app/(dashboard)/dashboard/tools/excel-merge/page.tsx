'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelMergePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-merge',
        name: 'Merge Excel Files',
        description: 'Combine multiple Excel spreadsheets into one',
        icon: '🔗',
        apiEndpoint: '/api/tools/excel-merge',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        mergeType: 'sheets',
        preserveFormatting: true,
        addSourceInfo: false,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Merge Type</label>
            <select
              value={settings.mergeType}
              onChange={(e) => setSettings({ ...settings, mergeType: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="sheets">Keep Separate Sheets</option>
              <option value="append">Append All Rows</option>
              <option value="side-by-side">Side by Side Columns</option>
            </select>
          </div>
          <div className="space-y-2">
            {[
              { key: 'preserveFormatting', label: 'Preserve Formatting' },
              { key: 'addSourceInfo', label: 'Add Source File Info' },
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
        { title: 'Multiple Merge Modes', description: 'Sheets, append rows, or side-by-side' },
        { title: 'Format Preservation', description: 'Keep all formatting and formulas' },
        { title: 'Unlimited Files', description: 'Merge any number of Excel files' },
      ]}
    />
  )
}
