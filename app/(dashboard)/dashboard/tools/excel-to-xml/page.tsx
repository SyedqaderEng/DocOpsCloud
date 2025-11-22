'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelToXmlPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-to-xml',
        name: 'Excel to XML',
        description: 'Convert Excel spreadsheets to XML format',
        icon: '📝',
        apiEndpoint: '/api/tools/excel-to-xml',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        rootElement: 'workbook',
        rowElement: 'row',
        prettyPrint: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Root Element Name</label>
            <input
              type="text"
              value={settings.rootElement}
              onChange={(e) => setSettings({ ...settings, rootElement: e.target.value })}
              placeholder="workbook"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Row Element Name</label>
            <input
              type="text"
              value={settings.rowElement}
              onChange={(e) => setSettings({ ...settings, rowElement: e.target.value })}
              placeholder="row"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <label className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.prettyPrint}
              onChange={(e) => setSettings({ ...settings, prettyPrint: e.target.checked })}
              className="w-4 h-4"
              disabled={processing}
            />
            <span className="text-white">Pretty Print (Formatted)</span>
          </label>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Custom Elements', description: 'Define your own XML element names' },
        { title: 'Schema Support', description: 'Generate valid XML schemas' },
        { title: 'Attribute Mapping', description: 'Map columns to XML attributes' },
      ]}
    />
  )
}
