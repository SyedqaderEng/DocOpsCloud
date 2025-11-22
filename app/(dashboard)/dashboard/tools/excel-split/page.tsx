'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelSplitPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-split',
        name: 'Split Excel Files',
        description: 'Split Excel spreadsheets into multiple files',
        icon: '✂️',
        apiEndpoint: '/api/tools/excel-split',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        splitBy: 'sheets',
        rowsPerFile: 1000,
        preserveHeaders: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Split By</label>
            <select
              value={settings.splitBy}
              onChange={(e) => setSettings({ ...settings, splitBy: e.target.value })}
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            >
              <option value="sheets">Separate Sheets</option>
              <option value="rows">Every N Rows</option>
              <option value="columns">Column Values</option>
            </select>
          </div>
          {settings.splitBy === 'rows' && (
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Rows Per File</label>
              <input
                type="number"
                value={settings.rowsPerFile}
                onChange={(e) => setSettings({ ...settings, rowsPerFile: parseInt(e.target.value) })}
                min="1"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
                disabled={processing}
              />
            </div>
          )}
          <label className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.preserveHeaders}
              onChange={(e) => setSettings({ ...settings, preserveHeaders: e.target.checked })}
              className="w-4 h-4"
              disabled={processing}
            />
            <span className="text-white">Preserve Headers in Each File</span>
          </label>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Multiple Split Modes', description: 'By sheets, rows, or column values' },
        { title: 'Header Preservation', description: 'Keep headers in each split file' },
        { title: 'ZIP Archive', description: 'All files packaged in one download' },
      ]}
    />
  )
}
