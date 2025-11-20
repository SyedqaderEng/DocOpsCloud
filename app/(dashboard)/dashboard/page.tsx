'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ALL_TOOLS } from '@/lib/tools-data'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <Link href="/" className="text-2xl font-extrabold text-gray-900">
            Doc<span className="text-purple-600">Ops</span>Cloud
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-5 overflow-y-auto">
          <div className="mb-6">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-3">
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
            <NavItem
              icon="🛠️"
              label="All Tools"
              active={activeTab === 'tools'}
              onClick={() => setActiveTab('tools')}
            />
          </div>

          <div className="mb-6">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-3">
              Quick Access
            </div>
            <NavItem icon="📄" label="PDF Tools" href="/tools/pdf/merge" />
            <NavItem icon="📝" label="Word Tools" href="/tools/word/convert" />
            <NavItem icon="📊" label="Excel Tools" href="/tools/excel" />
            <NavItem icon="🖼️" label="Image Tools" href="/tools/image" />
          </div>

          <div>
            <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-3">
              Account
            </div>
            <NavItem icon="⚙️" label="Settings" href="/settings" />
            <NavItem icon="💳" label="Billing" href="/billing" />
            <NavItem icon="📖" label="API Docs" href="/docs" />
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-5 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-lg">
              👤
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900">John Doe</div>
              <div className="text-xs text-green-600 font-medium">Pro Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="search"
                placeholder="Search files, jobs..."
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
              />
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-50 rounded-lg transition">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-sm">
              + New Job
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'files' && <FilesTab />}
          {activeTab === 'jobs' && <JobsTab />}
          {activeTab === 'tools' && <ToolsTab />}
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
      ? 'bg-purple-50 text-purple-600 border border-purple-200'
      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h1>
      <p className="text-gray-600 mb-8">Here&apos;s what&apos;s happening with your documents</p>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="📄" label="Total Files" value="47" change="+12%" />
        <StatCard icon="⚡" label="Jobs This Month" value="156" change="+23%" />
        <StatCard icon="✅" label="Completed" value="142" change="+18%" />
        <StatCard icon="⏳" label="Processing" value="14" change="-5%" />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <ActionCard icon="📄" title="Merge PDFs" href="/tools/pdf/merge" />
          <ActionCard icon="✂️" title="Split PDF" href="/tools/pdf/split" />
          <ActionCard icon="📝" title="DOCX to PDF" href="/tools/word/convert" />
          <ActionCard icon="🗜️" title="Compress PDF" href="/tools/pdf/compress" />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Files</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No files yet</h3>
        <p className="text-gray-600 mb-6">Upload your first file to get started</p>
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-sm">
          Upload File
        </button>
      </div>
    </div>
  )
}

function JobsTab() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Processing Jobs</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
        <div className="text-6xl mb-4">⚙️</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No active jobs</h3>
        <p className="text-gray-600">Your processing jobs will appear here</p>
      </div>
    </div>
  )
}

function ToolsTab() {
  const toolCategories = [
    { id: 'pdf', data: ALL_TOOLS.pdf },
    { id: 'word', data: ALL_TOOLS.word },
    { id: 'excel', data: ALL_TOOLS.excel },
    { id: 'image', data: ALL_TOOLS.image },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Tools</h1>
        <p className="text-gray-600">Browse and access all 120+ document processing tools</p>
      </div>

      <div className="space-y-8">
        {toolCategories.map((category) => (
          <div key={category.id}>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{category.data.icon}</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{category.data.name}</h3>
                <p className="text-sm text-gray-600">{category.data.count} tools available</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.data.tools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.id}`}
                  className="group p-5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="text-3xl mb-3">{tool.icon}</div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-purple-600 transition mb-1">
                    {tool.name}
                  </h4>
                  <p className="text-sm text-gray-500 line-clamp-2">{tool.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}
        >
          {change}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

function ActionCard({ icon, title, href }: { icon: string; title: string; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-md transition text-center group"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-gray-900 group-hover:text-purple-600 transition">{title}</div>
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
    <div className="flex items-center gap-4 p-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-0.5">{title}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
      <div className="text-sm text-gray-500">{time}</div>
    </div>
  )
}
