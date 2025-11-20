import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f0a1e] text-gray-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[rgba(26,19,50,0.95)] backdrop-blur-md border-b border-[#312e81] z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold text-[#8b5cf6]">
              DocOpsCloud
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-gray-300 hover:text-[#8b5cf6] transition font-medium">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-[#8b5cf6] transition font-medium">
                Pricing
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-[#8b5cf6] transition font-medium">
                Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="px-5 py-2.5 border border-[#312e81] rounded-lg text-gray-300 hover:bg-[#1e1b4b] transition font-semibold"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center pt-20 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center w-full">
          {/* Left Content */}
          <div>
            <h1 className="text-6xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
                Process Documents
              </span>
              <br />
              <span className="text-gray-100">with AI Power</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Merge, split, compress, and transform your PDFs, Word docs, Excel sheets, and images.
              All in one powerful platform.
            </p>
            <div className="flex gap-4 mb-8">
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition font-semibold text-lg shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:transform hover:-translate-y-0.5"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 border-2 border-gray-700 rounded-lg hover:border-gray-600 transition font-semibold text-lg"
              >
                View Features
              </Link>
            </div>
            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <div className="text-4xl font-extrabold text-[#8b5cf6]">105+</div>
                <div className="text-sm text-gray-500">Features</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-[#8b5cf6]">10k+</div>
                <div className="text-sm text-gray-500">Users</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-[#8b5cf6]">1M+</div>
                <div className="text-sm text-gray-500">Documents</div>
              </div>
            </div>
          </div>

          {/* Right Demo Area */}
          <div className="bg-[#1a1332] border-2 border-[#312e81] rounded-2xl p-8">
            <div className="bg-[#1e1b4b] border-2 border-dashed border-[#7c3aed] rounded-xl p-12 text-center hover:border-[#8b5cf6] hover:bg-[#312e81] transition cursor-pointer">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-bold mb-2">Drop files here</h3>
              <p className="text-gray-400 mb-4">or click to browse</p>
              <button className="px-6 py-3 bg-[#7c3aed] text-white rounded-lg font-semibold hover:bg-[#6d28d9] transition">
                Select Files
              </button>
              <p className="text-sm text-gray-500 mt-3">Supports PDF, DOCX, XLSX, PNG, JPG</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-5xl font-extrabold text-[#8b5cf6] mb-4">
              Powerful Document Operations
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to process documents at scale
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📄"
              title="PDF Tools"
              count="40+ operations"
              features={[
                'Merge & Split PDFs',
                'Compress & Optimize',
                'Watermark & Security',
                'Rotate & Extract Pages',
                'Page Numbers',
                'Convert to Images',
              ]}
            />
            <FeatureCard
              icon="📝"
              title="Word Processing"
              count="20+ operations"
              features={[
                'DOCX to PDF',
                'DOCX to HTML',
                'DOCX to Markdown',
                'Text Extraction',
                'Metadata Editing',
                'Find & Replace',
              ]}
            />
            <FeatureCard
              icon="📊"
              title="Excel & CSV"
              count="25+ operations"
              features={[
                'Excel to CSV',
                'CSV to Excel',
                'Data Analysis',
                'Sheet Manipulation',
                'Formula Processing',
                'Chart Generation',
              ]}
            />
            <FeatureCard
              icon="🖼️"
              title="Image Tools"
              count="20+ operations"
              features={[
                'Resize & Crop',
                'Format Conversion',
                'Compression',
                'Batch Processing',
                'Watermarking',
                'Filter Effects',
              ]}
            />
            <FeatureCard
              icon="🔐"
              title="Security"
              count="Enterprise-grade"
              features={[
                'End-to-end Encryption',
                '24h Auto-delete',
                'Private Processing',
                'No Data Retention',
                'GDPR Compliant',
                'SOC 2 Ready',
              ]}
            />
            <FeatureCard
              icon="⚡"
              title="Performance"
              count="Lightning-fast"
              features={[
                'Parallel Processing',
                'CDN Delivery',
                'Auto Scaling',
                'Priority Queue',
                'Real-time Status',
                'Instant Download',
              ]}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-[#1a1332]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-5xl font-extrabold text-[#8b5cf6] mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              name="Free"
              price="$0"
              period="/month"
              description="Perfect for trying out"
              features={[
                '10 operations/month',
                'All basic features',
                '24-hour file retention',
                'Community support',
                'Standard processing',
              ]}
              buttonText="Get Started"
              buttonLink="/auth/signup"
            />
            <PricingCard
              name="Pro"
              price="$79"
              period="/year"
              description="For professionals"
              features={[
                '500 operations/month',
                'All Pro features',
                '48-hour file retention',
                'Priority support',
                'Fast processing',
                'API access',
              ]}
              buttonText="Start Trial"
              buttonLink="/auth/signup"
              highlighted
            />
            <PricingCard
              name="Business"
              price="$149"
              period="/year"
              description="For teams & agencies"
              features={[
                'Unlimited operations',
                'All features included',
                '7-day file retention',
                '24/7 support',
                'Fastest processing',
                'Advanced API',
                'Team management',
                'Custom integrations',
              ]}
              buttonText="Contact Sales"
              buttonLink="/auth/signup"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] rounded-3xl p-16 shadow-[0_0_50px_rgba(139,92,246,0.3)]">
          <h2 className="text-4xl font-extrabold mb-4">
            Ready to streamline your document workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users processing millions of documents
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-10 py-4 bg-white text-[#7c3aed] rounded-lg font-bold text-lg hover:bg-gray-100 transition shadow-xl"
          >
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#312e81] py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-500">
          <p>© 2025 DocOpsCloud. Built with Next.js 14 & TypeScript.</p>
          <p className="mt-2 text-sm">Phase 5 - Excel/CSV Module Complete ✅</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  count,
  features,
}: {
  icon: string
  title: string
  count: string
  features: string[]
}) {
  return (
    <div className="bg-gradient-to-br from-[#1a1332] to-[#1e1b4b] border border-[#312e81] rounded-2xl p-8 hover:border-[#7c3aed] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:transform hover:-translate-y-1 transition-all">
      <div className="text-5xl mb-5">{icon}</div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <div className="text-[#8b5cf6] font-semibold text-sm mb-4">{count}</div>
      <ul className="space-y-2 text-gray-400 text-sm">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-[#8b5cf6] font-bold">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonText,
  buttonLink,
  highlighted,
}: {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  buttonText: string
  buttonLink: string
  highlighted?: boolean
}) {
  return (
    <div
      className={`bg-[#0f0a1e] border-2 rounded-2xl p-8 ${
        highlighted
          ? 'border-[#7c3aed] shadow-[0_0_40px_rgba(139,92,246,0.4)] transform scale-105'
          : 'border-[#312e81]'
      }`}
    >
      {highlighted && (
        <div className="bg-[#7c3aed] text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
          MOST POPULAR
        </div>
      )}
      <h3 className="text-2xl font-bold mb-2">{name}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      <div className="mb-6">
        <span className="text-5xl font-extrabold">{price}</span>
        <span className="text-gray-500">{period}</span>
      </div>
      <Link
        href={buttonLink}
        className={`block w-full py-3 rounded-lg font-bold text-center transition mb-6 ${
          highlighted
            ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9] shadow-[0_0_20px_rgba(139,92,246,0.4)]'
            : 'bg-[#1e1b4b] text-gray-300 hover:bg-[#312e81]'
        }`}
      >
        {buttonText}
      </Link>
      <ul className="space-y-3 text-sm text-gray-400">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-[#10b981] font-bold">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
