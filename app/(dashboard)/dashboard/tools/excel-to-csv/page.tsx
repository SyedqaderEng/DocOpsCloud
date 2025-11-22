'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelToCsvPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-to-csv',
        name: 'Excel to CSV',
        description: 'Convert Excel spreadsheets to CSV format',
        icon: '📊',
        apiEndpoint: '/api/tools/excel-to-csv',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        delimiter: ',',
        encoding: 'UTF-8',
        includeHeaders: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Delimiter</label>
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
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Encoding</label>
            <select
              value={settings.encoding}
              onChange={(e) => setSettings({ ...settings, encoding: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="UTF-8">UTF-8</option>
              <option value="UTF-16">UTF-16</option>
              <option value="ISO-8859-1">ISO-8859-1</option>
            </select>
          </div>
          <label className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.includeHeaders}
              onChange={(e) => setSettings({ ...settings, includeHeaders: e.target.checked })}
              className="w-4 h-4"
              disabled={processing}
            />
            <span className="text-white">Include Headers</span>
          </label>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Custom Delimiter', description: 'Choose comma, semicolon, tab, or pipe' },
        { title: 'Multiple Sheets', description: 'Convert all sheets to separate CSV files' },
        { title: 'Encoding Options', description: 'UTF-8, UTF-16, or ISO-8859-1' },
      ]}
    />
  )
}
