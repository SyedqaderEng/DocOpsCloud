'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelFindReplacePage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-find-replace',
        name: 'Excel Find & Replace',
        description: 'Batch text replacement in Excel files',
        icon: '🔍',
        apiEndpoint: '/api/tools/excel-find-replace',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        findText: '',
        replaceText: '',
        caseSensitive: false,
        matchWholeCell: false,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Find Text</label>
            <input
              type="text"
              value={settings.findText}
              onChange={(e) => setSettings({ ...settings, findText: e.target.value })}
              placeholder="Text to find"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Replace With</label>
            <input
              type="text"
              value={settings.replaceText}
              onChange={(e) => setSettings({ ...settings, replaceText: e.target.value })}
              placeholder="Replacement text"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
          <div className="space-y-2">
            {[
              { key: 'caseSensitive', label: 'Case Sensitive' },
              { key: 'matchWholeCell', label: 'Match Whole Cell Only' },
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
        { title: 'Batch Replacement', description: 'Replace all occurrences at once' },
        { title: 'Case Options', description: 'Case-sensitive or insensitive' },
        { title: 'All Sheets', description: 'Search across entire workbook' },
      ]}
    />
  )
}
