'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function WordSplitPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'word-split',
        name: 'Split Word Document',
        description: 'Divide Word document into multiple files',
        icon: '✂️',
        apiEndpoint: '/api/tools/word-split',
        acceptedFileTypes: '.docx,.doc',
        acceptedMimeTypes: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }}
      defaultSettings={{ splitBy: 'pages', pagesPerFile: 5 }}
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
              <option value="pages">Pages</option>
              <option value="sections">Sections</option>
              <option value="headings">Headings</option>
            </select>
          </div>
          {settings.splitBy === 'pages' && (
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Pages Per File: {settings.pagesPerFile}</label>
              <input
                type="range"
                min="1"
                max="50"
                value={settings.pagesPerFile}
                onChange={(e) => setSettings({ ...settings, pagesPerFile: parseInt(e.target.value) })}
                className="w-full"
                disabled={processing}
              />
            </div>
          )}
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, ...settings })}
      features={[
        { title: 'Multiple Split Options', description: 'Split by pages, sections, or headings' },
        { title: 'Automatic Naming', description: 'Files named sequentially' },
        { title: 'Preserve Formatting', description: 'Each file keeps original formatting' },
      ]}
    />
  )
}
