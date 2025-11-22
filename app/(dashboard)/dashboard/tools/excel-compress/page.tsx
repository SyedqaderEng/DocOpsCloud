'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function ExcelCompressPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'excel-compress',
        name: 'Compress Excel',
        description: 'Reduce Excel file size',
        icon: '🗜️',
        apiEndpoint: '/api/tools/excel-compress',
        acceptedFileTypes: '.xlsx,.xls',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel',
      }}
      defaultSettings={{
        removeUnusedStyles: true,
        compressImages: true,
        removeHiddenData: true,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-2">
          {[
            { key: 'removeUnusedStyles', label: 'Remove Unused Styles' },
            { key: 'compressImages', label: 'Compress Embedded Images' },
            { key: 'removeHiddenData', label: 'Remove Hidden Data' },
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
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Smart Compression', description: 'Reduce file size up to 90%' },
        { title: 'No Data Loss', description: 'Preserve all data and formulas' },
        { title: 'Image Optimization', description: 'Compress embedded images' },
      ]}
    />
  )
}
