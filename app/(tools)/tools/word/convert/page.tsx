'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WordConvertPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null)
  const [conversionType, setConversionType] = useState<'html' | 'markdown' | 'pdf'>('html')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!uploadedFile) {
      setError('Please upload a DOCX file first')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const endpoint = `/api/process/word/to-${conversionType}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: uploadedFile.id,
          // Add conversion-specific options here
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create conversion job')
      }

      const data = await response.json()

      // Redirect to job status page
      router.push(`/jobs/${data.jobId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert document')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Convert Word Documents</h1>
        <p className="text-gray-600">
          Convert DOCX files to HTML, Markdown, or PDF format
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6">
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Upload Word Document</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-600 mb-4">
              Upload a DOCX file to convert
            </p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Choose File
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Max file size: 10MB
            </p>
          </div>
        </div>

        {/* Conversion Type Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Choose Output Format</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <ConversionOption
              title="HTML"
              description="Web-ready HTML with styles"
              icon="🌐"
              selected={conversionType === 'html'}
              onClick={() => setConversionType('html')}
            />
            <ConversionOption
              title="Markdown"
              description="Plain text with formatting"
              icon="📄"
              selected={conversionType === 'markdown'}
              onClick={() => setConversionType('markdown')}
            />
            <ConversionOption
              title="PDF"
              description="Portable document format"
              icon="📑"
              selected={conversionType === 'pdf'}
              onClick={() => setConversionType('pdf')}
            />
          </div>
        </div>

        {/* Conversion Options */}
        {conversionType === 'html' && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">HTML Options</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                <span className="text-gray-700">Include styles</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                <span className="text-gray-700">Include images</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 mr-2" />
                <span className="text-gray-700">Clean HTML (remove extra formatting)</span>
              </label>
            </div>
          </div>
        )}

        {conversionType === 'markdown' && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Markdown Options</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                <span className="text-gray-700">Preserve formatting</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 mr-2" />
                <span className="text-gray-700">Include images</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heading style
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="atx">ATX (# Heading)</option>
                  <option value="setext">Setext (Underline)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {conversionType === 'pdf' && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">PDF Options</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page size
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={!uploadedFile || isProcessing}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isProcessing ? 'Converting...' : `Convert to ${conversionType.toUpperCase()}`}
        </button>
      </div>

      {/* Features Info */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Supported Features:</h3>
        <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Preserves text formatting
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Converts headings and lists
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Maintains document structure
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Handles images and links
          </li>
        </ul>
      </div>

      {/* Back Link */}
      <div className="mt-6 text-center">
        <Link href="/tools" className="text-blue-600 hover:text-blue-700">
          ← Back to tools
        </Link>
      </div>
    </div>
  )
}

function ConversionOption({
  title,
  description,
  icon,
  selected,
  onClick,
}: {
  title: string
  description: string
  icon: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg border-2 transition ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  )
}
