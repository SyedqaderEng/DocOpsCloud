'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelStatisticsPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-statistics',
        name: 'Excel Statistics',
        description: 'Calculate statistics for Excel data',
        icon: '📈',
        apiEndpoint: '/api/tools/excel-statistics',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        includeBasic: true,
        includeAdvanced: false,
        groupByColumn: '',
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div className="space-y-2">
            {[
              { key: 'includeBasic', label: 'Basic Statistics (count, sum, avg, min, max)' },
              { key: 'includeAdvanced', label: 'Advanced Statistics (median, stddev, variance)' },
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
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Group By Column (optional)</label>
            <input
              type="text"
              value={settings.groupByColumn}
              onChange={(e) => setSettings({ ...settings, groupByColumn: e.target.value })}
              placeholder="Column name or letter"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Comprehensive Stats', description: 'Count, sum, avg, min, max, median' },
        { title: 'Group Analysis', description: 'Statistics by category' },
        { title: 'Export Results', description: 'Download as Excel or CSV' },
      ]}
    />
  )
}
