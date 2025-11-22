'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelSplitColumnsPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-split-columns',
        name: 'Split Columns',
        description: 'Split one column into multiple columns',
        icon: '✂️',
        apiEndpoint: '/api/tools/excel-split-columns',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        sourceColumn: 'A',
        delimiter: ',',
        maxSplits: 0,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Source Column</label>
            <input
              type="text"
              value={settings.sourceColumn}
              onChange={(e) => setSettings({ ...settings, sourceColumn: e.target.value })}
              placeholder="A or column name"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
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
              <option value=" ">Space</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Max Splits (0 = unlimited)</label>
            <input
              type="number"
              value={settings.maxSplits}
              onChange={(e) => setSettings({ ...settings, maxSplits: parseInt(e.target.value) })}
              min="0"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Smart Splitting', description: 'Split by delimiter or pattern' },
        { title: 'Flexible Delimiters', description: 'Comma, space, custom text' },
        { title: 'Preserve Original', description: 'Keep source column intact' },
      ]}
    />
  )
}
