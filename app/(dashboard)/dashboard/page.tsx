'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="flex h-screen bg-[#0f0a1e] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1332] border-r border-[#312e81] flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-[#312e81]">
          <Link href="/" className="text-2xl font-extrabold text-[#8b5cf6]">
            DocOpsCloud
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-5 overflow-y-auto">
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-3">
              Main
            </div>
            <NavItem
              icon="📊"
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <NavItem
              icon="🗂️"
              label="My Files"
              active={activeTab === 'files'}
              onClick={() => setActiveTab('files')}
            />
            <NavItem
              icon="⚙️"
              label="Jobs"
              active={activeTab === 'jobs'}
              onClick={() => setActiveTab('jobs')}
            />
          </div>

          <div className="mb-6">
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-3">
              Tools
            </div>
            <NavItem icon="📄" label="PDF Tools" href="/tools/pdf/merge" />
            <NavItem icon="📝" label="Word Tools" href="/tools/word/convert" />
            <NavItem icon="📊" label="Excel Tools" href="/tools/excel" />
            <NavItem icon="🖼️" label="Image Tools" href="/tools/image" />
          </div>

          <div>
            <div className="text-xs font-bold text-gray-500 uppercase mb-2 px-3">
              Account
            </div>
            <NavItem icon="⚙️" label="Settings" href="/settings" />
            <NavItem icon="💳" label="Billing" href="/billing" />
            <NavItem icon="📖" label="API Docs" href="/docs" />
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-5 border-t border-[#312e81]">
          <div className="flex items-center gap-3 p-3 bg-[#1e1b4b] rounded-lg cursor-pointer hover:bg-[#312e81] transition">
            <div className="w-10 h-10 bg-[#7c3aed] rounded-full flex items-center justify-center text-lg">
              👤
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">John Doe</div>
              <div className="text-xs text-[#10b981]">Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-[#1a1332] border-b border-[#312e81] px-8 py-4 flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="search"
                placeholder="Search files, jobs..."
                className="w-full px-4 py-2.5 pl-10 bg-[#1e1b4b] border border-[#312e81] rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#7c3aed]"
              />
              <span className="absolute left-3 top-3 text-gray-500">🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#1e1b4b] rounded-lg transition">
              <span className="text-xl">🔔</span>
            </button>
            <button className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg font-semibold hover:bg-[#6d28d9] transition shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              + New Job
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'files' && <FilesTab />}
          {activeTab === 'jobs' && <JobsTab />}
        </div>
      </main>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  href,
}: {
  icon: string
  label: string
  active?: boolean
  onClick?: () => void
  href?: string
}) {
  const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition ${
    active
      ? 'bg-[#1e1b4b] text-gray-100'
      : 'text-gray-400 hover:bg-[#1e1b4b] hover:text-gray-200'
  }`

  if (href) {
    return (
      <Link href={href} className={className}>
        <span className="text-lg">{icon}</span>
        {label}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={className + ' w-full text-left'}>
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  )
}

function OverviewTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
      <p className="text-gray-400 mb-8">Here's what's happening with your documents</p>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="📄" label="Total Files" value="47" change="+12%" />
        <StatCard icon="⚡" label="Jobs This Month" value="156" change="+23%" />
        <StatCard icon="✅" label="Completed" value="142" change="+18%" />
        <StatCard icon="⏳" label="Processing" value="14" change="-5%" />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <ActionCard icon="📄" title="Merge PDFs" href="/tools/pdf/merge" />
          <ActionCard icon="✂️" title="Split PDF" href="/tools/pdf/split" />
          <ActionCard icon="📝" title="DOCX to PDF" href="/tools/word/convert" />
          <ActionCard icon="🗜️" title="Compress PDF" href="/tools/pdf/compress" />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="bg-[#1a1332] border border-[#312e81] rounded-xl overflow-hidden">
          <ActivityItem
            status="completed"
            title="PDF Merge"
            description="3 files merged"
            time="2 minutes ago"
          />
          <ActivityItem
            status="processing"
            title="DOCX to PDF"
            description="Converting document.docx"
            time="5 minutes ago"
          />
          <ActivityItem
            status="completed"
            title="PDF Compression"
            description="Reduced by 65%"
            time="12 minutes ago"
          />
          <ActivityItem
            status="completed"
            title="Watermark Added"
            description="Added to presentation.pdf"
            time="1 hour ago"
          />
        </div>
      </div>
    </div>
  )
}

function FilesTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Files</h1>
      <div className="bg-[#1a1332] border border-[#312e81] rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-bold mb-2">No files yet</h3>
        <p className="text-gray-400 mb-6">Upload your first file to get started</p>
        <button className="px-6 py-3 bg-[#7c3aed] text-white rounded-lg font-semibold hover:bg-[#6d28d9] transition">
          Upload File
        </button>
      </div>
    </div>
  )
}

function JobsTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Processing Jobs</h1>
      <div className="bg-[#1a1332] border border-[#312e81] rounded-xl p-8 text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-xl font-bold mb-2">No active jobs</h3>
        <p className="text-gray-400">Your processing jobs will appear here</p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  change,
}: {
  icon: string
  label: string
  value: string
  change: string
}) {
  const isPositive = change.startsWith('+')
  return (
    <div className="bg-[#1a1332] border border-[#312e81] rounded-xl p-6 hover:border-[#7c3aed] transition">
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {change}
        </span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

function ActionCard({ icon, title, href }: { icon: string; title: string; href: string }) {
  return (
    <Link
      href={href}
      className="bg-gradient-to-br from-[#1a1332] to-[#1e1b4b] border border-[#312e81] rounded-xl p-6 hover:border-[#7c3aed] hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition text-center"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold">{title}</div>
    </Link>
  )
}

function ActivityItem({
  status,
  title,
  description,
  time,
}: {
  status: 'completed' | 'processing' | 'failed'
  title: string
  description: string
  time: string
}) {
  const statusColors = {
    completed: 'bg-green-500',
    processing: 'bg-blue-500',
    failed: 'bg-red-500',
  }

  return (
    <div className="flex items-center gap-4 p-4 border-b border-[#312e81] last:border-0 hover:bg-[#1e1b4b] transition">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <div className="flex-1">
        <div className="font-semibold mb-0.5">{title}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <div className="text-sm text-gray-500">{time}</div>
    </div>
  )
}
