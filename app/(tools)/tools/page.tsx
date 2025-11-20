import Link from 'next/link'

export default function ToolsPage() {
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

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
              105+ Powerful Tools
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Everything you need to process, convert, and optimize your documents and images
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* PDF Tools */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-5xl">📄</span>
              <div>
                <h2 className="text-3xl font-bold text-gray-100">PDF Tools</h2>
                <p className="text-gray-400">25+ operations for PDF files</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <ToolCard
                title="Merge PDFs"
                description="Combine multiple PDF files into one"
                href="/tools/pdf/merge"
                icon="🔗"
              />
              <ToolCard
                title="Split PDF"
                description="Extract pages or split into multiple files"
                href="/tools/pdf/split"
                icon="✂️"
              />
              <ToolCard
                title="Compress PDF"
                description="Reduce PDF file size without quality loss"
                href="/tools/pdf/compress"
                icon="🗜️"
              />
              <ToolCard
                title="PDF to Images"
                description="Convert PDF pages to PNG/JPEG images"
                href="/tools/pdf/to-images"
                icon="🖼️"
              />
              <ToolCard
                title="Add Watermark"
                description="Add text or image watermarks to PDF"
                href="/tools/pdf/watermark"
                icon="🏷️"
              />
              <ToolCard
                title="Rotate Pages"
                description="Rotate PDF pages by 90, 180, or 270 degrees"
                href="/tools/pdf/rotate"
                icon="🔄"
              />
              <ToolCard
                title="Extract Text"
                description="Extract all text content from PDF"
                href="/tools/pdf/extract-text"
                icon="📝"
              />
              <ToolCard
                title="Add Page Numbers"
                description="Add page numbers to PDF documents"
                href="/tools/pdf/page-numbers"
                icon="🔢"
              />
              <ToolCard
                title="PDF Metadata"
                description="View and edit PDF metadata"
                href="/tools/pdf/metadata"
                icon="ℹ️"
              />
            </div>
          </div>

          {/* Word Tools */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-5xl">📝</span>
              <div>
                <h2 className="text-3xl font-bold text-gray-100">Word Tools</h2>
                <p className="text-gray-400">20+ operations for DOCX files</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <ToolCard
                title="Word to HTML"
                description="Convert DOCX to clean HTML"
                href="/tools/word/convert"
                icon="🌐"
              />
              <ToolCard
                title="Word to Markdown"
                description="Convert DOCX to Markdown format"
                href="/tools/word/convert"
                icon="📋"
              />
              <ToolCard
                title="Word to PDF"
                description="Convert DOCX documents to PDF"
                href="/tools/word/convert"
                icon="📄"
              />
              <ToolCard
                title="Extract Text"
                description="Extract plain text from DOCX"
                href="/tools/word/convert"
                icon="📝"
              />
              <ToolCard
                title="Word Metadata"
                description="View and edit document properties"
                href="/tools/word/convert"
                icon="ℹ️"
              />
              <ToolCard
                title="Word to Images"
                description="Convert Word pages to images"
                href="/tools/word/convert"
                icon="🖼️"
              />
            </div>
          </div>

          {/* Excel & CSV Tools */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-5xl">📊</span>
              <div>
                <h2 className="text-3xl font-bold text-gray-100">Excel & CSV Tools</h2>
                <p className="text-gray-400">30+ operations for spreadsheets</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <ToolCard
                title="Excel to CSV"
                description="Convert XLSX to CSV format"
                href="/tools/excel/convert"
                icon="📉"
              />
              <ToolCard
                title="CSV to Excel"
                description="Convert CSV to XLSX with formatting"
                href="/tools/excel/convert"
                icon="📈"
              />
              <ToolCard
                title="Extract Sheet"
                description="Export specific worksheet to CSV"
                href="/tools/excel/convert"
                icon="📋"
              />
              <ToolCard
                title="Analyze CSV"
                description="Detect delimiters and column types"
                href="/tools/excel/convert"
                icon="🔍"
              />
              <ToolCard
                title="Merge Sheets"
                description="Combine multiple sheets into one"
                href="/tools/excel/convert"
                icon="🔗"
              />
              <ToolCard
                title="Excel Metadata"
                description="View workbook and sheet information"
                href="/tools/excel/convert"
                icon="ℹ️"
              />
            </div>
          </div>

          {/* Image Tools */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-5xl">🖼️</span>
              <div>
                <h2 className="text-3xl font-bold text-gray-100">Image Tools</h2>
                <p className="text-gray-400">30+ operations for images</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <ToolCard
                title="Resize Image"
                description="Change image dimensions with smart fit"
                href="/tools/image/process"
                icon="📐"
              />
              <ToolCard
                title="Compress Image"
                description="Reduce file size up to 80%"
                href="/tools/image/process"
                icon="🗜️"
              />
              <ToolCard
                title="Convert Format"
                description="Convert between JPEG, PNG, WebP, AVIF"
                href="/tools/image/process"
                icon="🔄"
              />
              <ToolCard
                title="Optimize Image"
                description="All-in-one optimization"
                href="/tools/image/process"
                icon="✨"
              />
              <ToolCard
                title="Crop Image"
                description="Crop to specific dimensions"
                href="/tools/image/process"
                icon="✂️"
              />
              <ToolCard
                title="Rotate & Flip"
                description="Rotate and flip images"
                href="/tools/image/process"
                icon="🔄"
              />
              <ToolCard
                title="Apply Filters"
                description="Grayscale, blur, sharpen, and more"
                href="/tools/image/process"
                icon="🎨"
              />
              <ToolCard
                title="Add Watermark"
                description="Add text or image watermarks"
                href="/tools/image/process"
                icon="🏷️"
              />
              <ToolCard
                title="Create Thumbnail"
                description="Generate thumbnails quickly"
                href="/tools/image/process"
                icon="🖼️"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[#1a1332] to-[#1e1b4b] border border-[#312e81] rounded-3xl p-12 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
          <h2 className="text-4xl font-black mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Sign up now and get access to all 105+ tools
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-lg font-bold text-lg hover:from-[#6d28d9] hover:to-[#5b21b6] transition shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
            >
              Sign Up Free
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 border-2 border-[#7c3aed] text-[#8b5cf6] rounded-lg font-bold text-lg hover:bg-[#1e1b4b] transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#312e81] py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>© 2025 DocOpsCloud. Built with Next.js 14 & TypeScript.</p>
        </div>
      </footer>
    </div>
  )
}

function ToolCard({
  title,
  description,
  href,
  icon,
}: {
  title: string
  description: string
  href: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className="bg-gradient-to-br from-[#1a1332] to-[#1e1b4b] border border-[#312e81] rounded-xl p-6 hover:border-[#7c3aed] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:transform hover:-translate-y-1 transition-all group"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-100 mb-2 group-hover:text-[#8b5cf6] transition">
        {title}
      </h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </Link>
  )
}
