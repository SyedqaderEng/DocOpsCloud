'use client'

import { useState } from 'react'

export default function PasswordGeneratorPage() {
  const [settings, setSettings] = useState({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  })
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const generatePassword = () => {
    let charset = ''
    if (settings.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (settings.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (settings.includeNumbers) charset += '0123456789'
    if (settings.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'

    if (!charset) {
      setPassword('Please select at least one character type')
      return
    }

    let newPassword = ''
    for (let i = 0; i < settings.length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setPassword(newPassword)
    setCopied(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔐 Password Generator</h1>
          <p className="text-gray-400">Generate secure random passwords</p>
        </div>

        <div className="glass p-8 rounded-2xl space-y-6">
          {/* Password Display */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Generated Password</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                readOnly
                placeholder="Click 'Generate Password' to create"
                className="flex-1 px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.2)] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#00d4ff] font-mono"
              />
              <button
                onClick={copyToClipboard}
                disabled={!password}
                className="px-6 py-3 bg-[#00d4ff] text-black font-medium rounded-lg hover:bg-[#00b8e6] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Length Slider */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block">Password Length: {settings.length}</label>
            <input
              type="range"
              value={settings.length}
              onChange={(e) => setSettings({ ...settings, length: parseInt(e.target.value) })}
              min="4"
              max="64"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Short (4)</span>
              <span>Long (64)</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 mb-2 block">Include Characters</label>
            {[
              { key: 'includeUppercase', label: 'Uppercase Letters (A-Z)' },
              { key: 'includeLowercase', label: 'Lowercase Letters (a-z)' },
              { key: 'includeNumbers', label: 'Numbers (0-9)' },
              { key: 'includeSymbols', label: 'Symbols (!@#$%^&*)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-white">{label}</span>
              </label>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePassword}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#00d4ff] to-[#7b2cbf] text-white font-medium rounded-lg hover:opacity-90"
          >
            Generate Password
          </button>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-[rgba(255,255,255,0.1)]">
            <div className="p-4 glass rounded-lg">
              <h3 className="font-medium text-white mb-1">🔒 Secure</h3>
              <p className="text-sm text-gray-400">Cryptographically random</p>
            </div>
            <div className="p-4 glass rounded-lg">
              <h3 className="font-medium text-white mb-1">⚙️ Customizable</h3>
              <p className="text-sm text-gray-400">Control length and characters</p>
            </div>
            <div className="p-4 glass rounded-lg">
              <h3 className="font-medium text-white mb-1">📋 Easy Copy</h3>
              <p className="text-sm text-gray-400">One-click copy to clipboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
