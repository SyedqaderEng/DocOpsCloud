// Pre-built Workflow Templates

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'finance' | 'legal' | 'hr' | 'marketing' | 'operations' | 'general'
  trigger: {
    type: string
    config: Record<string, any>
  }
  steps: Array<{
    id: string
    action: string
    config: Record<string, any>
    nextOnSuccess?: string
    nextOnFailure?: string
  }>
  variables: Record<string, any>
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'invoice-processing',
    name: 'Invoice Processing Pipeline',
    description: 'Automatically extract data from invoices, validate, and send to accounting',
    category: 'finance',
    trigger: {
      type: 'file_type',
      config: { fileTypes: ['pdf'], folderId: 'invoices' },
    },
    steps: [
      {
        id: 'ocr',
        action: 'ai.ocr',
        config: { imageFile: '{{triggerData.fileId}}' },
      },
      {
        id: 'extract',
        action: 'ai.extract',
        config: {
          text: '{{stepResults.ocr.text}}',
          documentType: 'invoice',
        },
      },
      {
        id: 'notify',
        action: 'notify.email',
        config: {
          to: '{{variables.accountingEmail}}',
          subject: 'New Invoice: {{stepResults.extract.data.vendor}}',
          body: 'Invoice Amount: {{stepResults.extract.data.total}}',
        },
      },
    ],
    variables: {
      accountingEmail: 'accounting@company.com',
    },
  },
  {
    id: 'contract-review',
    name: 'Contract Review & Approval',
    description: 'AI analysis of contracts with automatic routing for approval',
    category: 'legal',
    trigger: {
      type: 'file_upload',
      config: { folderId: 'contracts' },
    },
    steps: [
      {
        id: 'analyze',
        action: 'ai.extract',
        config: {
          text: '{{triggerData.content}}',
          documentType: 'contract',
        },
      },
      {
        id: 'summarize',
        action: 'ai.summarize',
        config: {
          text: '{{triggerData.content}}',
          length: 'medium',
        },
      },
      {
        id: 'notify-legal',
        action: 'notify.email',
        config: {
          to: '{{variables.legalTeam}}',
          subject: 'Contract Review: {{stepResults.analyze.data.parties}}',
          body: 'Summary: {{stepResults.summarize.summary}}',
        },
      },
    ],
    variables: {
      legalTeam: 'legal@company.com',
    },
  },
  {
    id: 'document-archive',
    name: 'Document Archival System',
    description: 'Compress, watermark, and archive documents after 30 days',
    category: 'operations',
    trigger: {
      type: 'schedule',
      config: { cronExpression: '0 0 * * *', timezone: 'UTC' },
    },
    steps: [
      {
        id: 'compress',
        action: 'file.compress',
        config: {
          inputFile: '{{triggerData.file}}',
          quality: 'high',
        },
      },
      {
        id: 'watermark',
        action: 'file.watermark',
        config: {
          inputFile: '{{stepResults.compress.compressedFile}}',
          watermarkText: 'ARCHIVED - {{triggerData.date}}',
          position: 'bottom-right',
        },
      },
      {
        id: 'move',
        action: 'file.move',
        config: {
          file: '{{stepResults.watermark.watermarkedFile}}',
          destination: 'archive',
        },
      },
    ],
    variables: {},
  },
  {
    id: 'employee-onboarding',
    name: 'New Employee Onboarding',
    description: 'Generate offer letter, collect signatures, create employee folder',
    category: 'hr',
    trigger: {
      type: 'form_submit',
      config: { formId: 'new-employee-form' },
    },
    steps: [
      {
        id: 'generate-offer',
        action: 'file.convert',
        config: {
          inputFile: '{{variables.offerTemplate}}',
          outputFormat: 'pdf',
        },
      },
      {
        id: 'notify-hr',
        action: 'notify.email',
        config: {
          to: '{{triggerData.hrEmail}}',
          subject: 'New Employee: {{triggerData.employeeName}}',
          body: 'Offer letter generated and ready for review.',
        },
      },
    ],
    variables: {
      offerTemplate: 'templates/offer-letter.docx',
    },
  },
  {
    id: 'expense-report',
    name: 'Expense Report Automation',
    description: 'Process receipts, categorize expenses, generate report',
    category: 'finance',
    trigger: {
      type: 'file_upload',
      config: { folderId: 'receipts' },
    },
    steps: [
      {
        id: 'ocr',
        action: 'ai.ocr',
        config: { imageFile: '{{triggerData.fileId}}' },
      },
      {
        id: 'extract',
        action: 'ai.extract',
        config: {
          text: '{{stepResults.ocr.text}}',
          documentType: 'receipt',
        },
      },
      {
        id: 'classify',
        action: 'ai.classify',
        config: {
          text: '{{stepResults.extract.data.items}}',
          categories: ['travel', 'meals', 'supplies', 'software', 'other'],
        },
      },
    ],
    variables: {},
  },
  {
    id: 'weekly-report',
    name: 'Weekly Report Generation',
    description: 'Compile data and generate weekly report',
    category: 'operations',
    trigger: {
      type: 'schedule',
      config: { cronExpression: '0 8 * * 1', timezone: 'America/New_York' },
    },
    steps: [
      {
        id: 'generate-report',
        action: 'data.merge',
        config: {
          sources: ['{{variables.dataSource1}}', '{{variables.dataSource2}}'],
        },
      },
      {
        id: 'summarize',
        action: 'ai.summarize',
        config: {
          text: '{{stepResults.generate-report.merged}}',
          length: 'long',
          format: 'bullets',
        },
      },
      {
        id: 'send-report',
        action: 'notify.email',
        config: {
          to: '{{variables.recipients}}',
          subject: 'Weekly Report - {{triggerData.scheduledTime}}',
          body: '{{stepResults.summarize.summary}}',
        },
      },
    ],
    variables: {
      dataSource1: 'sales-data',
      dataSource2: 'operations-data',
      recipients: 'team@company.com',
    },
  },
  {
    id: 'multi-language-docs',
    name: 'Multi-Language Document Processing',
    description: 'Translate documents to multiple languages',
    category: 'general',
    trigger: {
      type: 'manual',
      config: {},
    },
    steps: [
      {
        id: 'translate-es',
        action: 'ai.translate',
        config: {
          text: '{{triggerData.content}}',
          targetLanguage: 'Spanish',
        },
      },
      {
        id: 'translate-fr',
        action: 'ai.translate',
        config: {
          text: '{{triggerData.content}}',
          targetLanguage: 'French',
        },
      },
      {
        id: 'translate-de',
        action: 'ai.translate',
        config: {
          text: '{{triggerData.content}}',
          targetLanguage: 'German',
        },
      },
    ],
    variables: {},
  },
  {
    id: 'compliance-check',
    name: 'Compliance Document Check',
    description: 'AI-powered compliance verification',
    category: 'legal',
    trigger: {
      type: 'file_upload',
      config: { folderId: 'compliance' },
    },
    steps: [
      {
        id: 'analyze',
        action: 'ai.extract',
        config: {
          text: '{{triggerData.content}}',
          documentType: 'contract',
          fields: ['parties', 'terms', 'compliance_clauses'],
        },
      },
      {
        id: 'check-compliance',
        action: 'ai.classify',
        config: {
          text: '{{stepResults.analyze.extractedData}}',
          categories: ['compliant', 'needs_review', 'non_compliant'],
        },
      },
      {
        id: 'alert-if-needed',
        action: 'notify.slack',
        config: {
          channel: '{{variables.complianceChannel}}',
          message: 'Compliance check: {{stepResults.check-compliance.category}}',
        },
      },
    ],
    variables: {
      complianceChannel: '#compliance-alerts',
    },
  },
  {
    id: 'backup-automation',
    name: 'File Backup Automation',
    description: 'Automatically backup files to cloud storage',
    category: 'operations',
    trigger: {
      type: 'schedule',
      config: { cronExpression: '0 2 * * *', timezone: 'UTC' },
    },
    steps: [
      {
        id: 'compress',
        action: 'file.compress',
        config: {
          inputFile: '{{variables.backupFolder}}',
          quality: 'high',
        },
      },
      {
        id: 'upload-gdrive',
        action: 'integration.google_drive.upload',
        config: {
          file: '{{stepResults.compress.compressedFile}}',
          folderId: '{{variables.gdriveFolderId}}',
        },
      },
    ],
    variables: {
      backupFolder: 'important-documents',
      gdriveFolderId: 'backup-folder-id',
    },
  },
  {
    id: 'customer-docs',
    name: 'Customer Document Collection',
    description: 'Collect and organize customer documents',
    category: 'general',
    trigger: {
      type: 'form_submit',
      config: { formId: 'customer-upload-form' },
    },
    steps: [
      {
        id: 'organize',
        action: 'file.move',
        config: {
          file: '{{triggerData.uploadedFile}}',
          destination: 'customers/{{triggerData.customerId}}',
        },
      },
      {
        id: 'notify-sales',
        action: 'notify.email',
        config: {
          to: '{{variables.salesTeam}}',
          subject: 'New Document from {{triggerData.customerName}}',
          body: 'Customer has submitted new documents.',
        },
      },
      {
        id: 'update-crm',
        action: 'integration.salesforce.create',
        config: {
          object: 'Note',
          fields: {
            ParentId: '{{triggerData.customerId}}',
            Body: 'Document received: {{triggerData.uploadedFile}}',
          },
        },
      },
    ],
    variables: {
      salesTeam: 'sales@company.com',
    },
  },
]

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category)
}
