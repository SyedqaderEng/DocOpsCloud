// Integration Providers Index

import { googleDrive } from './google-drive'
import { dropbox } from './dropbox'
import { onedrive } from './onedrive'
import { box } from './box'
import { sharepoint } from './sharepoint'
import { slack } from './slack'
import { microsoftTeams } from './microsoft-teams'
import { salesforce } from './salesforce'
import { hubspot } from './hubspot'
import { notion } from './notion'

export interface IntegrationMetadata {
  id: string
  name: string
  description: string
  category: 'cloud_storage' | 'communication' | 'crm' | 'productivity'
  icon: string
  provider: any
  features: string[]
}

export const INTEGRATIONS: Record<string, IntegrationMetadata> = {
  'google-drive': {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Store and share files in Google Drive',
    category: 'cloud_storage',
    icon: '📁',
    provider: googleDrive,
    features: [
      'Upload files',
      'Download files',
      'List folders',
      'Create folders',
      'Delete files',
    ],
  },
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Sync and share files with Dropbox',
    category: 'cloud_storage',
    icon: '📦',
    provider: dropbox,
    features: [
      'Upload files',
      'Download files',
      'Search files',
      'Copy/Move files',
      'Share files',
    ],
  },
  onedrive: {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Microsoft OneDrive cloud storage',
    category: 'cloud_storage',
    icon: '☁️',
    provider: onedrive,
    features: [
      'Upload files',
      'Large file upload',
      'Download files',
      'Search files',
      'Create sharing links',
    ],
  },
  box: {
    id: 'box',
    name: 'Box',
    description: 'Secure file sharing and collaboration',
    category: 'cloud_storage',
    icon: '📂',
    provider: box,
    features: [
      'Upload files',
      'Download files',
      'Search content',
      'Share files',
      'Folder management',
    ],
  },
  sharepoint: {
    id: 'sharepoint',
    name: 'SharePoint',
    description: 'Microsoft SharePoint document management',
    category: 'cloud_storage',
    icon: '🗂️',
    provider: sharepoint,
    features: [
      'Document libraries',
      'Upload/Download files',
      'Site lists',
      'Search sites',
      'Create list items',
    ],
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration',
    category: 'communication',
    icon: '💬',
    provider: slack,
    features: [
      'Send messages',
      'Upload files',
      'Channel management',
      'User management',
      'Reactions',
    ],
  },
  'microsoft-teams': {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Team chat and collaboration platform',
    category: 'communication',
    icon: '👥',
    provider: microsoftTeams,
    features: [
      'Send messages',
      'Channel management',
      'Team management',
      'Online meetings',
      'File sharing',
    ],
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Customer relationship management platform',
    category: 'crm',
    icon: '⚡',
    provider: salesforce,
    features: [
      'SOQL queries',
      'Create/Update records',
      'Opportunities',
      'Leads & Contacts',
      'File attachments',
    ],
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing and sales automation platform',
    category: 'crm',
    icon: '🎯',
    provider: hubspot,
    features: [
      'Contact management',
      'Company records',
      'Deal pipeline',
      'Form submissions',
      'File uploads',
    ],
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    description: 'All-in-one workspace for notes and docs',
    category: 'productivity',
    icon: '📝',
    provider: notion,
    features: [
      'Create pages',
      'Manage databases',
      'Block management',
      'Comments',
      'Search workspace',
    ],
  },
}

export function getIntegrationById(id: string): IntegrationMetadata | undefined {
  return INTEGRATIONS[id]
}

export function getIntegrationsByCategory(category: string): IntegrationMetadata[] {
  return Object.values(INTEGRATIONS).filter(i => i.category === category)
}

export function getAllIntegrations(): IntegrationMetadata[] {
  return Object.values(INTEGRATIONS)
}

// Export individual providers
export {
  googleDrive,
  dropbox,
  onedrive,
  box,
  sharepoint,
  slack,
  microsoftTeams,
  salesforce,
  hubspot,
  notion,
}
