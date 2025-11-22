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
      multiFileMode={true}
      minFiles={2}
      defaultSettings={{
        mergeType: 'sheets',
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
              <option value="rows">Append All Rows</option>
            </select>
          </div>
        </div>
      )}
      prepareRequestBody={(fileIds, settings) => ({ fileIds, ...settings })}
      features={[
        { title: 'Multiple Merge Modes', description: 'Sheets or append rows' },
        { title: 'Format Preservation', description: 'Keep all formatting and formulas' },
        { title: 'Unlimited Files', description: 'Merge any number of Excel files' },
      ]}
    />
  )
}
