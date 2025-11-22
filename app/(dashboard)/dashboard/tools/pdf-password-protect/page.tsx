'use client'

import UniversalToolTemplate from '@/components/tools/UniversalToolTemplate'
import { useState } from 'react'

export default function PDFPasswordProtectPage() {
  return (
    <UniversalToolTemplate
      config={{
        id: 'pdf-password-protect',
        name: 'Password Protect PDF',
        description: 'Add password security to your PDF files',
        icon: '🔒',
        apiEndpoint: '/api/tools/pdf-password-protect',
        acceptedFileTypes: '.pdf,application/pdf',
        acceptedMimeTypes: 'application/pdf',
      }}
      defaultSettings={{
        userPassword: '',
        ownerPassword: '',
        permissions: {
          printing: true,
          modifying: false,
          copying: false,
          annotating: false,
        },
      }}
      renderSettings={({ settings, setSettings, processing }) => (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-2 block">User Password (Required)</label>
            <input
              type="password"
              value={settings.userPassword}
              onChange={(e) => setSettings({ ...settings, userPassword: e.target.value })}
              placeholder="Enter password to open PDF"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-2 block">Owner Password (Optional)</label>
            <input
              type="password"
              value={settings.ownerPassword}
              onChange={(e) => setSettings({ ...settings, ownerPassword: e.target.value })}
              placeholder="Enter password for permissions"
              className="w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff]"
              disabled={processing}
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-3 block">Permissions</label>
            <div className="space-y-2">
              {[
                { key: 'printing', label: 'Allow Printing' },
                { key: 'modifying', label: 'Allow Modifying' },
                { key: 'copying', label: 'Allow Copying' },
                { key: 'annotating', label: 'Allow Annotating' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer hover:border-[#00d4ff]">
                  <input
                    type="checkbox"
                    checked={settings.permissions[key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        permissions: { ...settings.permissions, [key]: e.target.checked },
                      })
                    }
                    className="w-4 h-4"
                    disabled={processing}
                  />
                  <span className="text-white">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      prepareRequestBody={(fileId, settings) => ({
        fileId,
        userPassword: settings.userPassword,
        ownerPassword: settings.ownerPassword || settings.userPassword,
        permissions: settings.permissions,
      })}
      features={[
        { title: 'Strong Encryption', description: 'Secure your PDFs with password protection' },
        { title: 'Permission Control', description: 'Set what users can do with the PDF' },
        { title: 'User & Owner Passwords', description: 'Separate passwords for opening and editing' },
      ]}
    />
  )
}
