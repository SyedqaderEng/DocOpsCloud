import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              DocOpsCloud
            </Link>
            <div className="flex gap-4">
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Process Documents with{' '}
            <span className="text-blue-600">AI-Powered Automation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Merge, split, compress, and transform your PDFs, Word docs, Excel sheets, and images.
            All in one powerful platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-gray-400 transition"
            >
              View Features
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Powerful Document Operations
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            title="PDF Tools"
            description="Merge, split, compress, watermark, rotate, and extract pages from PDFs"
            icon="📄"
          />
          <FeatureCard
            title="Word Processing"
            description="Convert DOCX to PDF, HTML, Markdown and manipulate Word documents"
            icon="📝"
          />
          <FeatureCard
            title="Excel & CSV"
            description="Convert between formats, process spreadsheets, and analyze data"
            icon="📊"
          />
          <FeatureCard
            title="Image Tools"
            description="Resize, compress, convert, and optimize images in bulk"
            icon="🖼️"
          />
        </div>
      </div>

      {/* Status Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            🚀 Development Status - Phase 3
          </h2>
          <div className="space-y-4">
            <StatusItem completed text="✅ Foundation & Authentication" />
            <StatusItem completed text="✅ File Upload & Storage (S3)" />
            <StatusItem completed text="✅ Job Queue System (BullMQ)" />
            <StatusItem completed text="✅ PDF Module (40+ operations)" />
            <StatusItem text="⏳ Word Module (In Progress)" />
            <StatusItem text="⏳ Excel Module (Planned)" />
            <StatusItem text="⏳ Image Module (Planned)" />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center bg-blue-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to streamline your document workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users processing millions of documents
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Get Started Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 DocOpsCloud. Built with Next.js 14 & TypeScript.</p>
          <p className="mt-2 text-sm">Phase 3 - PDF Module Complete ✅</p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StatusItem({ completed, text }: { completed?: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className={completed ? 'text-gray-900' : 'text-gray-600'}>{text}</span>
    </div>
  )
}
