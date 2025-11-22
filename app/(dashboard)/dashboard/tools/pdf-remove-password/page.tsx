'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'

export default function PDFRemovePasswordPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-remove-password',
        name: 'Remove PDF Password',
        description: 'Unlock password-protected PDF files',
        icon: '🔓',
        apiEndpoint: '/api/tools/pdf-remove-password',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{ password: '' }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div>
          <label className="text-sm text-gray-300 mb-2 block">PDF Password</label>
          <input
            type="password"
            value={settings.password}
            onChange={(e) => setSettings({ ...settings, password: e.target.value })}
            placeholder="Enter PDF password"
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
            disabled={processing}
          />
          <p className="text-xs text-gray-400 mt-2">Enter the password used to protect this PDF</p>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({ fileId, password: settings.password })}
      features={[
        { title: 'Unlock Protected PDFs', description: 'Remove password protection from PDFs' },
        { title: 'Fast Processing', description: 'Quick password removal' },
        { title: 'Secure', description: 'Your password and file are kept private' },
      ]}
    />
  )
}
