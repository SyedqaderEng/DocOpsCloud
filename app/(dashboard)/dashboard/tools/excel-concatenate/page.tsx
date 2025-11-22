'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelConcatenatePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-concatenate',
        name: 'Concatenate Columns',
        description: 'Combine multiple columns into one',
        icon: '➕',
        apiEndpoint: '/api/tools/excel-concatenate',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        columns: 'A,B',
        separator: ' ',
        targetColumn: 'C',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Columns to Combine</label>
            <input
              type="text"
              value={settings.columns}
              onChange={(e) => setSettings({ ...settings, columns: e.target.value })}
              placeholder="A,B,C or column names"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Separator</label>
            <input
              type="text"
              value={settings.separator}
              onChange={(e) => setSettings({ ...settings, separator: e.target.value })}
              placeholder="Space, comma, etc."
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Target Column</label>
            <input
              type="text"
              value={settings.targetColumn}
              onChange={(e) => setSettings({ ...settings, targetColumn: e.target.value })}
              placeholder="Column to place result"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Combine Multiple Columns', description: 'Merge any number of columns' },
        { title: 'Custom Separator', description: 'Use space, comma, or any text' },
        { title: 'Preserve Original', description: 'Keep source columns intact' },
      ]}
    />
  )
}
