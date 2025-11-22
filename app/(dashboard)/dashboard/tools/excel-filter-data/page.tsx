'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelFilterDataPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-filter-data',
        name: 'Filter Excel Data',
        description: 'Filter rows based on conditions',
        icon: '🔎',
        apiEndpoint: '/api/tools/excel-filter-data',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        filterColumn: 'A',
        operator: 'equals',
        value: '',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Filter Column</label>
            <input
              type="text"
              value={settings.filterColumn}
              onChange={(e) => setSettings({ ...settings, filterColumn: e.target.value })}
              placeholder="A or column name"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Operator</label>
            <select
              value={settings.operator}
              onChange={(e) => setSettings({ ...settings, operator: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              <option value="startsWith">Starts With</option>
              <option value="endsWith">Ends With</option>
              <option value="greaterThan">Greater Than</option>
              <option value="lessThan">Less Than</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Value</label>
            <input
              type="text"
              value={settings.value}
              onChange={(e) => setSettings({ ...settings, value: e.target.value })}
              placeholder="Filter value"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Multiple Operators', description: 'Equals, contains, greater than, etc.' },
        { title: 'Complex Filters', description: 'Combine multiple conditions' },
        { title: 'Export Results', description: 'Save filtered data to new file' },
      ]}
    />
  )
}
