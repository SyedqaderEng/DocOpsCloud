'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelSortDataPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-sort-data',
        name: 'Sort Excel Data',
        description: 'Sort rows in Excel spreadsheets',
        icon: '📊',
        apiEndpoint: '/api/tools/excel-sort-data',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        sortColumn: 'A',
        order: 'asc',
        hasHeaders: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Sort Column</label>
            <input
              type="text"
              value={settings.sortColumn}
              onChange={(e) => setSettings({ ...settings, sortColumn: e.target.value })}
              placeholder="A or column name"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Sort Order</label>
            <select
              value={settings.order}
              onChange={(e) => setSettings({ ...settings, order: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="asc">Ascending (A-Z, 0-9)</option>
              <option value="desc">Descending (Z-A, 9-0)</option>
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hasHeaders}
              onChange={(e) => setSettings({ ...settings, hasHeaders: e.target.checked })}
              className="w-4 h-4"
              disabled={processing}
            />
            <span className="text-white">First Row is Headers</span>
          </label>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Multi-column Sort', description: 'Sort by multiple columns' },
        { title: 'Smart Sorting', description: 'Auto-detect numbers, dates, text' },
        { title: 'Preserve Formulas', description: 'Keep all formulas intact' },
      ]}
    />
  )
}
