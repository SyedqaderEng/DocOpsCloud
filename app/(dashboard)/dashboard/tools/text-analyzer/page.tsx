'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function TextAnalyzerPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'text-analyzer',
        name: 'Text Analyzer',
        description: 'Analyze text files for word count, character count, and statistics',
        icon: '📊',
        apiEndpoint: '/api/tools/text-analyzer',
        acceptedFileTypes: '.txt,.md,.json,.xml,.csv',
        acceptedMimeTypes: 'text/plain,text/markdown,application/json,application/xml,text/csv',
      }}
      defaultSettings={{
        includeWordFrequency: true,
        includeSentenceCount: true,
        includeReadability: false,
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-2">
          {[
            { key: 'includeWordFrequency', label: 'Word Frequency Analysis' },
            { key: 'includeSentenceCount', label: 'Sentence Count' },
            { key: 'includeReadability', label: 'Readability Score' },
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
        { title: 'Comprehensive Analysis', description: 'Word count, character count, sentences' },
        { title: 'Word Frequency', description: 'Most common words and phrases' },
        { title: 'Readability Score', description: 'Flesch reading ease score' },
      ]}
    />
  )
}
