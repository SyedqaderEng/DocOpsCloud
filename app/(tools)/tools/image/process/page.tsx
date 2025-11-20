'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ProcessingMode = 'resize' | 'compress' | 'convert' | 'optimize'

export default function ImageProcessPage() {
  const router = useRouter()
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null)
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('resize')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resize options
  const [width, setWidth] = useState<number | ''>('')
  const [height, setHeight] = useState<number | ''>('')
  const [fit, setFit] = useState('cover')
  const [withoutEnlargement, setWithoutEnlargement] = useState(false)

  // Compress options
  const [compressQuality, setCompressQuality] = useState(80)
  const [compressFormat, setCompressFormat] = useState('')
  const [progressive, setProgressive] = useState(false)

  // Convert options
  const [targetFormat, setTargetFormat] = useState('webp')
  const [convertQuality, setConvertQuality] = useState(90)
  const [lossless, setLossless] = useState(false)

  // Optimize options
  const [maxWidth, setMaxWidth] = useState<number | ''>('')
  const [maxHeight, setMaxHeight] = useState<number | ''>('')
  const [optimizeQuality, setOptimizeQuality] = useState(80)
  const [optimizeFormat, setOptimizeFormat] = useState('')
  const [stripMetadata, setStripMetadata] = useState(false)

  const handleProcess = async () => {
    if (!uploadedFile) {
      setError('Please upload an image first')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      let endpoint = ''
      let body: any = { fileId: uploadedFile.id }

      switch (processingMode) {
        case 'resize':
          endpoint = '/api/process/image/resize'
          body = {
            ...body,
            width: width || undefined,
            height: height || undefined,
            fit,
            withoutEnlargement,
          }
          break

        case 'compress':
          endpoint = '/api/process/image/compress'
          body = {
            ...body,
            quality: compressQuality,
            format: compressFormat || undefined,
            progressive,
          }
          break

        case 'convert':
          endpoint = '/api/process/image/convert'
          body = {
            ...body,
            format: targetFormat,
            quality: convertQuality,
            lossless,
          }
          break

        case 'optimize':
          endpoint = '/api/process/image/optimize'
          body = {
            ...body,
            maxWidth: maxWidth || undefined,
            maxHeight: maxHeight || undefined,
            quality: optimizeQuality,
            format: optimizeFormat || undefined,
            stripMetadata,
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create processing job')
      }

      const data = await response.json()
      router.push(`/jobs/${data.jobId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
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
              Image
            </span>{' '}
            <span className="text-gray-100">Processing</span>
          </h1>
          <p className="text-xl text-gray-400">
            Resize, compress, convert, and optimize your images
          </p>
        </div>

        {/* Processing Mode Selection */}
        <div className="bg-[#1a1332] border border-[#312e81] rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">1. Select Processing Mode</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <ModeCard
              title="Resize"
              description="Change dimensions"
              icon="📐"
              selected={processingMode === 'resize'}
              onClick={() => setProcessingMode('resize')}
            />
            <ModeCard
              title="Compress"
              description="Reduce file size"
              icon="🗜️"
              selected={processingMode === 'compress'}
              onClick={() => setProcessingMode('compress')}
            />
            <ModeCard
              title="Convert"
              description="Change format"
              icon="🔄"
              selected={processingMode === 'convert'}
              onClick={() => setProcessingMode('convert')}
            />
            <ModeCard
              title="Optimize"
              description="All-in-one"
              icon="✨"
              selected={processingMode === 'optimize'}
              onClick={() => setProcessingMode('optimize')}
            />
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-[#1a1332] border border-[#312e81] rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">2. Upload Image</h2>
          <div className="border-2 border-dashed border-[#7c3aed] rounded-xl p-12 text-center hover:border-[#8b5cf6] hover:bg-[#1e1b4b] transition cursor-pointer">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-gray-300 mb-4">Upload an image file</p>
            <button className="px-6 py-3 bg-[#7c3aed] text-white rounded-lg font-semibold hover:bg-[#6d28d9] transition shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              Select Image
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Supports: JPEG, PNG, WebP, GIF, AVIF, TIFF (max 10MB)
            </p>
          </div>
        </div>

        {/* Options Section */}
        <div className="bg-[#1a1332] border border-[#312e81] rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">3. Configure Options</h2>

          {processingMode === 'resize' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                    placeholder="e.g., 1920"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                    placeholder="e.g., 1080"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Fit Mode
                </label>
                <select
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                >
                  <option value="cover">Cover (crop to fill)</option>
                  <option value="contain">Contain (fit inside)</option>
                  <option value="fill">Fill (stretch)</option>
                  <option value="inside">Inside (shrink only)</option>
                  <option value="outside">Outside (enlarge only)</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withoutEnlargement}
                  onChange={(e) => setWithoutEnlargement(e.target.checked)}
                  className="w-5 h-5 rounded border-[#312e81] bg-[#1e1b4b] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
                />
                <span className="text-gray-300 font-medium">
                  Prevent enlargement (don't upscale small images)
                </span>
              </label>
            </div>
          )}

          {processingMode === 'compress' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Quality: {compressQuality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={compressQuality}
                  onChange={(e) => setCompressQuality(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#1e1b4b] rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Output Format (optional)
                </label>
                <select
                  value={compressFormat}
                  onChange={(e) => setCompressFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                >
                  <option value="">Keep original format</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="avif">AVIF</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={progressive}
                  onChange={(e) => setProgressive(e.target.checked)}
                  className="w-5 h-5 rounded border-[#312e81] bg-[#1e1b4b] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
                />
                <span className="text-gray-300 font-medium">Progressive encoding</span>
              </label>
            </div>
          )}

          {processingMode === 'convert' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Target Format
                </label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                >
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP (recommended)</option>
                  <option value="avif">AVIF (modern)</option>
                  <option value="tiff">TIFF</option>
                  <option value="gif">GIF</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Quality: {convertQuality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={convertQuality}
                  onChange={(e) => setConvertQuality(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#1e1b4b] rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>
              {(targetFormat === 'webp' || targetFormat === 'avif') && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lossless}
                    onChange={(e) => setLossless(e.target.checked)}
                    className="w-5 h-5 rounded border-[#312e81] bg-[#1e1b4b] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
                  />
                  <span className="text-gray-300 font-medium">Lossless compression</span>
                </label>
              )}
            </div>
          )}

          {processingMode === 'optimize' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Max Width (optional)
                  </label>
                  <input
                    type="number"
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                    placeholder="e.g., 2000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    Max Height (optional)
                  </label>
                  <input
                    type="number"
                    value={maxHeight}
                    onChange={(e) => setMaxHeight(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                    placeholder="e.g., 2000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Quality: {optimizeQuality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={optimizeQuality}
                  onChange={(e) => setOptimizeQuality(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#1e1b4b] rounded-lg appearance-none cursor-pointer accent-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Output Format (optional)
                </label>
                <select
                  value={optimizeFormat}
                  onChange={(e) => setOptimizeFormat(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-100 focus:border-[#7c3aed] focus:outline-none transition"
                >
                  <option value="">Auto (keep original)</option>
                  <option value="webp">WebP (best compression)</option>
                  <option value="avif">AVIF (smallest size)</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stripMetadata}
                  onChange={(e) => setStripMetadata(e.target.checked)}
                  className="w-5 h-5 rounded border-[#312e81] bg-[#1e1b4b] text-[#7c3aed] focus:ring-[#7c3aed] focus:ring-offset-0"
                />
                <span className="text-gray-300 font-medium">
                  Strip metadata (remove EXIF data for privacy)
                </span>
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

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={!uploadedFile || isProcessing}
          className="w-full bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white py-5 rounded-lg font-bold text-lg hover:from-[#6d28d9] hover:to-[#5b21b6] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
        >
          {isProcessing ? 'Processing...' : `Process Image`}
        </button>

        {/* Features Info */}
        <div className="mt-10 bg-gradient-to-br from-[#1a1332] to-[#1e1b4b] border border-[#312e81] rounded-2xl p-8">
          <h3 className="text-xl font-bold text-gray-100 mb-6 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Image Processing Features
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <FeatureItem text="Resize to any dimensions" />
            <FeatureItem text="Smart compression (up to 80% savings)" />
            <FeatureItem text="Modern formats (WebP, AVIF)" />
            <FeatureItem text="Batch optimization" />
            <FeatureItem text="Lossless & lossy compression" />
            <FeatureItem text="Metadata stripping for privacy" />
            <FeatureItem text="Progressive encoding" />
            <FeatureItem text="Quality presets" />
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

function ModeCard({
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
