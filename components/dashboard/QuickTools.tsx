'use client'

import Link from 'next/link'
import { useState } from 'react'

const QUICK_TOOLS = [
  { id: 'text-analyzer', name: 'Text Analyzer', icon: '📊', description: 'Analyze text instantly' },
  { id: 'password-generator', name: 'Password Gen', icon: '🔑', description: 'Create strong passwords' },
  { id: 'hash-generator', name: 'Hash Generator', icon: '🔐', description: 'Generate checksums' },
  { id: 'pdf-compress', name: 'Compress PDF', icon: '🗜️', description: 'Reduce PDF size' },
  { id: 'image-resize', name: 'Resize Image', icon: '📐', description: 'Change dimensions' },
  { id: 'qr-generator', name: 'QR Generator', icon: '📱', description: 'Create QR codes' },
]

export default function QuickTools() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-xl border p-4">
      <h3 className="font-semibold text-sm mb-3">Quick Tools</h3>
      <div className="grid grid-cols-3 gap-2">
        {QUICK_TOOLS.map(tool => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="relative p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50 transition-all text-center group"
            onMouseEnter={() => setHoveredTool(tool.id)}
            onMouseLeave={() => setHoveredTool(null)}
          >
            <span className="text-2xl">{tool.icon}</span>
            <p className="text-xs mt-1 font-medium truncate">{tool.name}</p>
            {hoveredTool === tool.id && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {tool.description}
              </div>
            )}
          </Link>
        ))}
      </div>
      <Link
        href="/tools"
        className="mt-3 block text-center text-sm text-indigo-600 hover:text-indigo-800"
      >
        Browse all 145+ tools →
      </Link>
    </div>
  )
}
