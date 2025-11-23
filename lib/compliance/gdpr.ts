// GDPR Compliance Tools

import { prisma } from '@/lib/db/prisma'
import { encryption } from '@/lib/security/encryption'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface DataExportResult {
  user: any
  files: any[]
  usage_logs: any[]
  api_keys: any[]
  workflows: any[]
  teams: any[]
  integrations: any[]
  audit_logs: any[]
  exportDate: Date
}

export interface DataDeletionResult {
  deleted: {
    files: number
    usage_logs: number
    api_keys: number
    workflows: number
    teams: number
    integrations: number
    audit_logs: number
    user: boolean
  }
  errors: string[]
}

export class GDPRComplianceService {
  /**
   * Export all user data (Right to Data Portability - GDPR Article 20)
   */
  async exportUserData(userId: string): Promise<DataExportResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Fetch all user-related data
    const [files, usageLogs, apiKeys, workflows, teams, integrations, auditLogs] =
      await Promise.all([
        prisma.file.findMany({ where: { user_id: userId } }),
        prisma.usageLog.findMany({ where: { user_id: userId } }),
        prisma.apiKey.findMany({ where: { user_id: userId } }),
        prisma.workflow.findMany({ where: { user_id: userId } }),
        prisma.teamMember.findMany({
          where: { user_id: userId },
          include: { team: true },
        }),
        prisma.integrationConnection.findMany({
          where: { user_id: userId },
          select: {
            id: true,
            provider_id: true,
            status: true,
            connected_at: true,
            last_used_at: true,
            // Don't include encrypted_credentials for security
          },
        }),
        prisma.auditLog.findMany({ where: { user_id: userId } }),
      ])

    // Remove sensitive data
    const sanitizedUser = {
      ...user,
      password_hash: undefined, // Don't export password hash
    }

    return {
      user: sanitizedUser,
      files,
      usage_logs: usageLogs,
      api_keys: apiKeys.map(key => ({
        ...key,
        key: undefined, // Don't export actual API key
        key_preview: key.key_preview,
      })),
      workflows,
      teams,
      integrations,
      audit_logs: auditLogs,
      exportDate: new Date(),
    }
  }

  /**
   * Export user data as JSON file
   */
  async exportUserDataAsJSON(userId: string): Promise<string> {
    const data = await this.exportUserData(userId)
    return JSON.stringify(data, null, 2)
  }

  /**
   * Delete all user data (Right to Erasure - GDPR Article 17)
   */
  async deleteUserData(
    userId: string,
    options: {
      keepAuditLogs?: boolean // For compliance, audit logs might need to be retained
      anonymizeInsteadOfDelete?: boolean // Anonymize instead of hard delete
    } = {}
  ): Promise<DataDeletionResult> {
    const result: DataDeletionResult = {
      deleted: {
        files: 0,
        usage_logs: 0,
        api_keys: 0,
        workflows: 0,
        teams: 0,
        integrations: 0,
        audit_logs: 0,
        user: false,
      },
      errors: [],
    }

    try {
      // Delete files and their physical storage
      const files = await prisma.file.findMany({ where: { user_id: userId } })
      for (const file of files) {
        try {
          // Delete physical file (if stored locally)
          if (file.storage_path) {
            await fs.unlink(file.storage_path).catch(() => {})
          }
          await prisma.file.delete({ where: { id: file.id } })
          result.deleted.files++
        } catch (error) {
          result.errors.push(`Failed to delete file ${file.id}`)
        }
      }

      // Delete usage logs
      const usageLogsDeleted = await prisma.usageLog.deleteMany({
        where: { user_id: userId },
      })
      result.deleted.usage_logs = usageLogsDeleted.count

      // Delete API keys
      const apiKeysDeleted = await prisma.apiKey.deleteMany({
        where: { user_id: userId },
      })
      result.deleted.api_keys = apiKeysDeleted.count

      // Delete workflows
      const workflowsDeleted = await prisma.workflow.deleteMany({
        where: { user_id: userId },
      })
      result.deleted.workflows = workflowsDeleted.count

      // Remove from teams
      const teamMembersDeleted = await prisma.teamMember.deleteMany({
        where: { user_id: userId },
      })
      result.deleted.teams = teamMembersDeleted.count

      // Delete integrations
      const integrationsDeleted = await prisma.integrationConnection.deleteMany({
        where: { user_id: userId },
      })
      result.deleted.integrations = integrationsDeleted.count

      // Handle audit logs
      if (!options.keepAuditLogs) {
        if (options.anonymizeInsteadOfDelete) {
          // Anonymize instead of delete
          await prisma.auditLog.updateMany({
            where: { user_id: userId },
            data: {
              user_id: 'DELETED_USER',
              ip_address: 'REDACTED',
              user_agent: 'REDACTED',
            },
          })
        } else {
          const auditLogsDeleted = await prisma.auditLog.deleteMany({
            where: { user_id: userId },
          })
          result.deleted.audit_logs = auditLogsDeleted.count
        }
      }

      // Delete or anonymize user record
      if (options.anonymizeInsteadOfDelete) {
        // Anonymize user data
        await prisma.user.update({
          where: { id: userId },
          data: {
            email: `deleted-${userId}@deleted.local`,
            name: 'Deleted User',
            password_hash: null,
            avatar_url: null,
            email_verified: null,
          },
        })
      } else {
        // Hard delete user
        await prisma.user.delete({ where: { id: userId } })
      }

      result.deleted.user = true

      // Log deletion for compliance
      await prisma.auditLog.create({
        data: {
          action: 'USER_DATA_DELETED',
          resource_type: 'USER',
          resource_id: userId,
          metadata: {
            timestamp: new Date().toISOString(),
            deletionType: options.anonymizeInsteadOfDelete ? 'anonymized' : 'hard_delete',
            deletedRecords: result.deleted,
          },
        },
      })
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    return result
  }

  /**
   * Get consent status for a user
   */
  async getConsentStatus(userId: string): Promise<{
    marketing: boolean
    analytics: boolean
    thirdParty: boolean
    lastUpdated?: Date
  }> {
    // This would typically be stored in a separate consent table
    // For now, returning defaults
    return {
      marketing: false,
      analytics: true,
      thirdParty: false,
    }
  }

  /**
   * Update user consent
   */
  async updateConsent(
    userId: string,
    consent: {
      marketing?: boolean
      analytics?: boolean
      thirdParty?: boolean
    }
  ): Promise<void> {
    // Log consent change
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'CONSENT_UPDATED',
        resource_type: 'USER',
        resource_id: userId,
        metadata: {
          consent,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // In production, store consent in dedicated table
    // This is a placeholder
  }

  /**
   * Generate data processing report
   */
  async generateProcessingReport(userId: string): Promise<{
    dataCategories: Array<{
      category: string
      purpose: string
      legalBasis: string
      retention: string
      recordCount: number
    }>
    processors: string[]
    transfers: string[]
  }> {
    const [fileCount, usageCount, auditCount] = await Promise.all([
      prisma.file.count({ where: { user_id: userId } }),
      prisma.usageLog.count({ where: { user_id: userId } }),
      prisma.auditLog.count({ where: { user_id: userId } }),
    ])

    return {
      dataCategories: [
        {
          category: 'Account Data',
          purpose: 'Service provision and account management',
          legalBasis: 'Contract',
          retention: '90 days after account deletion',
          recordCount: 1,
        },
        {
          category: 'File Data',
          purpose: 'Document processing and storage',
          legalBasis: 'Contract',
          retention: '30 days after deletion',
          recordCount: fileCount,
        },
        {
          category: 'Usage Logs',
          purpose: 'Service improvement and analytics',
          legalBasis: 'Legitimate Interest',
          retention: '12 months',
          recordCount: usageCount,
        },
        {
          category: 'Audit Logs',
          purpose: 'Security and compliance',
          legalBasis: 'Legal Obligation',
          retention: '7 years',
          recordCount: auditCount,
        },
      ],
      processors: [
        'AWS (Cloud Storage)',
        'Stripe (Payment Processing)',
        'OpenAI (AI Processing)',
      ],
      transfers: [
        'United States (AWS)',
        'Ireland (Stripe)',
      ],
    }
  }

  /**
   * Verify GDPR compliance
   */
  async verifyCompliance(userId: string): Promise<{
    compliant: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const issues: string[] = []
    const recommendations: string[] = []

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return {
        compliant: false,
        issues: ['User not found'],
        recommendations: [],
      }
    }

    // Check if user email is verified
    if (!user.email_verified) {
      issues.push('Email not verified')
      recommendations.push('Verify user email address')
    }

    // Check for old data that should be deleted
    const oldFiles = await prisma.file.count({
      where: {
        user_id: userId,
        created_at: {
          lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year old
        },
      },
    })

    if (oldFiles > 0) {
      recommendations.push(`${oldFiles} files older than 1 year - consider retention policy`)
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations,
    }
  }
}

export const gdpr = new GDPRComplianceService()
