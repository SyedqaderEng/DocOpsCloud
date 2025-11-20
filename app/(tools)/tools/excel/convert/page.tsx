'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ExcelConvertPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null)
  const [conversionType, setConversionType] = useState<'to-csv' | 'to-excel'>('to-csv')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Excel to CSV options
  const [sheetIndex, setSheetIndex] = useState(0)
  const [delimiter, setDelimiter] = useState(',')
  const [includeHeaders, setIncludeHeaders] = useState(true)

  // CSV to Excel options
  const [sheetName, setSheetName] = useState('Sheet1')
  const [hasHeaders, setHasHeaders] = useState(true)
  const [autoDetectTypes, setAutoDetectTypes] = useState(true)

  const handleConvert = async () => {
    if (!uploadedFile) {
      setError('Please upload a file first')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const endpoint = `/api/process/excel/${conversionType}`
      const body =
        conversionType === 'to-csv'
          ? {
              fileId: uploadedFile.id,
              sheetIndex,
              delimiter,
              includeHeaders,
            }
          : {
              fileId: uploadedFile.id,
              sheetName,
              delimiter,
              hasHeaders,
              autoDetectTypes,
            }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create conversion job')
      }

      const data = await response.json()

      // Redirect to job status page
      router.push(`/jobs/${data.jobId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert file')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[rgba(26,19,50,0.95)] backdrop-blur-md border-b border-[#312e81] z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold text-[#8b5cf6]">
              DocOpsCloud
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 border border-[#312e81] rounded-lg text-gray-300 hover:bg-[#1e1b4b] transition font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto pt-28 pb-16 px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
              Excel & CSV
            </span>{' '}
            <span className="text-gray-100">Converter</span>
          </h1>
          <p className="text-xl text-gray-400">
            Convert between Excel and CSV formats with advanced options
          </p>
        </div>

        {/* Conversion Type Selection */}
        <div className="bg-[#1a1332] border border-[#312e81] rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">1. Select Conversion Type</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <ConversionTypeCard
              title="Excel to CSV"
              description="Convert XLSX/XLS to CSV format"
              icon="📊"
              selected={conversionType === 'to-csv'}
              onClick={() => setConversionType('to-csv')}
            />
            <ConversionTypeCard
              title="CSV to Excel"
              description="Convert CSV to XLSX format"
              icon="📈"
              selected={conversionType === 'to-excel'}
              onClick={() => setConversionType('to-excel')}
            />
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-[#1a1332] border border-[#312e81] rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">2. Upload File</h2>
          <div className="border-2 border-dashed border-[#7c3aed] rounded-xl p-12 text-center hover:border-[#8b5cf6] hover:bg-[#1e1b4b] transition cursor-pointer">
            <div className="text-6xl mb-4">{conversionType === 'to-csv' ? '📊' : '📄'}</div>
            <p className="text-gray-300 mb-4">
              Upload a {conversionType === 'to-csv' ? 'Excel' : 'CSV'} file
            </p>
            <button className="px-6 py-3 bg-[#7c3aed] text-white rounded-lg font-semibold hover:bg-[#6d28d9] transition shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              Select File
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Max file size: 10MB
            </p>
          </div>
        </div>

        {/* Options Section */}
        <div className="bg-[#1a1332] border border-[#312e81] rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">3. Configure Options</h2>

          {conversionType === 'to-csv' ? (
            // Excel to CSV Options
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Sheet to Convert
                </label>
                <input
                  type="number"
                  value={sheetIndex}
                  onChange={(e) => setSheetIndex(parseInt(e.target.value))}
                  min="0"
                  className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                  placeholder="Sheet index (0 for first sheet)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Delimiter
                </label>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="w-5 h-5 rounded border-[#312e81] bg-[#1e1b4b] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
                />
                <span className="text-gray-300 font-medium">Include column headers</span>
              </label>
            </div>
          ) : (
            // CSV to Excel Options
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Sheet Name
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                  placeholder="Sheet1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  CSV Delimiter
                </label>
                <select
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasHeaders}
                  onChange={(e) => setHasHeaders(e.target.checked)}
                  className="w-5 h-5 rounded border-[#312e81] bg-[#1e1b4b] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
                />
                <span className="text-gray-300 font-medium">First row is headers</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDetectTypes}
                  onChange={(e) => setAutoDetectTypes(e.target.checked)}
                  className="w-5 h-5 rounded border-[#312e81] bg-[#1e1b4b] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
                />
                <span className="text-gray-300 font-medium">Auto-detect column types</span>
              </label>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={!uploadedFile || isProcessing}
          className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white py-5 rounded-lg font-bold text-lg hover:from-[#6d28d9] hover:to-[#5b21b6] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
        >
          {isProcessing
            ? 'Converting...'
            : `Convert ${conversionType === 'to-csv' ? 'to CSV' : 'to Excel'}`}
        </button>

        {/* Features Info */}
        <div className="mt-10 bg-gradient-to-br from-[#1a1332] to-[#1e1b4b] border border-[#312e81] rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Supported Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <FeatureItem text="Multiple sheet support" />
            <FeatureItem text="Custom delimiters" />
            <FeatureItem text="Header row detection" />
            <FeatureItem text="Auto type conversion" />
            <FeatureItem text="Large file support (up to 10MB)" />
            <FeatureItem text="Preserves data formatting" />
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/tools"
            className="text-[#8b5cf6] hover:text-[#a78bfa] transition font-semibold inline-flex items-center gap-2"
          >
            <span>←</span>
            Back to tools
          </Link>
        </div>
      </div>
    </div>
  )
}

function ConversionTypeCard({
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
      className={`p-6 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-[#7c3aed] bg-[#1e1b4b] shadow-[0_0_20px_rgba(139,92,246,0.3)]'
          : 'border-[#312e81] bg-[#0f0a1e] hover:border-[#7c3aed]/50'
      }`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[#10b981] text-lg">✓</span>
      <span className="text-gray-300">{text}</span>
    </div>
  )
}
