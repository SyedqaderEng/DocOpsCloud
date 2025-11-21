// Workflow Triggers

import prisma from '@/lib/db/prisma'
import { startWorkflowRun } from '../engine/executor'

export interface TriggerConfig {
  type: TriggerType
  config: Record<string, any>
}

export type TriggerType =
  | 'manual'
  | 'file_upload'
  | 'file_type'
  | 'schedule'
  | 'webhook'
  | 'form_submit'
  | 'document_signed'
  | 'api_call'
  | 'folder_watch'
  | 'email_received'
  | 'ai_detection'

// Trigger metadata for UI
export const TRIGGER_METADATA: Record<TriggerType, {
  name: string
  description: string
  configFields: Array<{ key: string; type: string; label: string; required?: boolean }>
}> = {
  manual: {
    name: 'Manual Trigger',
    description: 'Run workflow manually',
    configFields: [],
  },
  file_upload: {
    name: 'File Uploaded',
    description: 'Trigger when any file is uploaded',
    configFields: [
      { key: 'folderId', type: 'string', label: 'Folder (optional)' },
    ],
  },
  file_type: {
    name: 'Specific File Type',
    description: 'Trigger when specific file type is uploaded',
    configFields: [
      { key: 'fileTypes', type: 'array', label: 'File Types', required: true },
      { key: 'folderId', type: 'string', label: 'Folder (optional)' },
    ],
  },
  schedule: {
    name: 'Schedule',
    description: 'Run on a schedule',
    configFields: [
      { key: 'cronExpression', type: 'cron', label: 'Cron Expression', required: true },
      { key: 'timezone', type: 'string', label: 'Timezone' },
    ],
  },
  webhook: {
    name: 'Webhook',
    description: 'Trigger via HTTP webhook',
    configFields: [
      { key: 'secret', type: 'string', label: 'Webhook Secret' },
    ],
  },
  form_submit: {
    name: 'Form Submitted',
    description: 'Trigger when a form is submitted',
    configFields: [
      { key: 'formId', type: 'string', label: 'Form ID', required: true },
    ],
  },
  document_signed: {
    name: 'Document Signed',
    description: 'Trigger when document is signed',
    configFields: [
      { key: 'templateId', type: 'string', label: 'Template ID (optional)' },
    ],
  },
  api_call: {
    name: 'API Call',
    description: 'Trigger via API',
    configFields: [],
  },
  folder_watch: {
    name: 'Folder Watch',
    description: 'Watch folder for new files',
    configFields: [
      { key: 'folderId', type: 'string', label: 'Folder ID', required: true },
      { key: 'recursive', type: 'boolean', label: 'Include Subfolders' },
    ],
  },
  email_received: {
    name: 'Email Received',
    description: 'Trigger on incoming email',
    configFields: [
      { key: 'emailAddress', type: 'string', label: 'Email Address' },
      { key: 'subjectFilter', type: 'string', label: 'Subject Contains' },
    ],
  },
  ai_detection: {
    name: 'AI Detection',
    description: 'Trigger based on AI content analysis',
    configFields: [
      { key: 'documentType', type: 'string', label: 'Document Type' },
      { key: 'confidence', type: 'number', label: 'Min Confidence' },
    ],
  },
}

// Fire a trigger
export async function fireTrigger(
  triggerType: TriggerType,
  triggerData: Record<string, any>,
  matchConfig?: Record<string, any>
) {
  // Find workflows that match this trigger
  const workflows = await prisma.workflow.findMany({
    where: {
      status: 'ACTIVE',
    },
  })

  const matchingWorkflows = workflows.filter(workflow => {
    const trigger = workflow.trigger as TriggerConfig
    if (trigger.type !== triggerType) return false

    // Check additional config matching
    if (matchConfig) {
      for (const [key, value] of Object.entries(matchConfig)) {
        if (trigger.config[key] && trigger.config[key] !== value) {
          return false
        }
      }
    }

    return true
  })

  // Start runs for matching workflows
  const runIds: string[] = []
  for (const workflow of matchingWorkflows) {
    try {
      const runId = await startWorkflowRun(
        workflow.id,
        workflow.user_id,
        triggerType,
        triggerData
      )
      runIds.push(runId)
    } catch (error) {
      console.error(`Failed to start workflow ${workflow.id}:`, error)
    }
  }

  return runIds
}

// Manual trigger
export async function triggerManually(
  workflowId: string,
  userId: string,
  data: Record<string, any> = {}
): Promise<string> {
  return startWorkflowRun(workflowId, userId, 'manual', data)
}

// Webhook trigger
export async function triggerByWebhook(
  workflowId: string,
  payload: Record<string, any>,
  secret?: string
): Promise<string> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  })

  if (!workflow) {
    throw new Error('Workflow not found')
  }

  const trigger = workflow.trigger as TriggerConfig
  if (trigger.type !== 'webhook') {
    throw new Error('Workflow does not have a webhook trigger')
  }

  // Verify secret if configured
  if (trigger.config.secret && trigger.config.secret !== secret) {
    throw new Error('Invalid webhook secret')
  }

  return startWorkflowRun(workflowId, workflow.user_id, 'webhook', payload)
}

// Schedule handler (called by cron job)
export async function processScheduledTriggers() {
  const now = new Date()

  const dueTriggers = await prisma.scheduledTrigger.findMany({
    where: {
      enabled: true,
      next_run: { lte: now },
    },
  })

  for (const trigger of dueTriggers) {
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: trigger.workflow_id },
      })

      if (workflow && workflow.status === 'ACTIVE') {
        await startWorkflowRun(
          workflow.id,
          workflow.user_id,
          'schedule',
          { scheduledTime: now.toISOString() }
        )
      }

      // Calculate next run time
      const nextRun = calculateNextRun(trigger.cron_expr, trigger.timezone)
      await prisma.scheduledTrigger.update({
        where: { id: trigger.id },
        data: {
          last_run: now,
          next_run: nextRun,
        },
      })
    } catch (error) {
      console.error(`Failed to process scheduled trigger ${trigger.id}:`, error)
    }
  }
}

// Simple cron parser (for common patterns)
function calculateNextRun(cronExpr: string, timezone: string): Date {
  // Simplified - in production use a proper cron parser like 'cron-parser'
  const parts = cronExpr.split(' ')
  const now = new Date()

  // Handle common patterns
  if (cronExpr === '0 * * * *') {
    // Every hour
    now.setHours(now.getHours() + 1, 0, 0, 0)
  } else if (cronExpr === '0 0 * * *') {
    // Every day at midnight
    now.setDate(now.getDate() + 1)
    now.setHours(0, 0, 0, 0)
  } else if (cronExpr === '0 0 * * 0') {
    // Every week
    now.setDate(now.getDate() + 7)
    now.setHours(0, 0, 0, 0)
  } else if (cronExpr === '0 0 1 * *') {
    // Every month
    now.setMonth(now.getMonth() + 1, 1)
    now.setHours(0, 0, 0, 0)
  } else {
    // Default: 1 hour from now
    now.setHours(now.getHours() + 1)
  }

  return now
}
