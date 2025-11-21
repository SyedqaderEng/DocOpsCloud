// HIPAA Compliance Tools

import { prisma } from '@/lib/prisma'
import { encryption } from '@/lib/security/encryption'

export interface PHIAccessLog {
  userId: string
  resourceType: string
  resourceId: string
  action: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface HIPAAComplianceReport {
  compliant: boolean
  findings: Array<{
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    category: string
    description: string
    recommendation: string
  }>
  accessLogs: number
  encryptionStatus: 'COMPLIANT' | 'NON_COMPLIANT'
  auditLogRetention: 'COMPLIANT' | 'NON_COMPLIANT'
}

export class HIPAAComplianceService {
  /**
   * Log PHI (Protected Health Information) access
   * HIPAA requires logging all access to PHI
   */
  async logPHIAccess(log: PHIAccessLog): Promise<void> {
    await prisma.auditLog.create({
      data: {
        user_id: log.userId,
        action: `PHI_${log.action.toUpperCase()}`,
        resource_type: log.resourceType,
        resource_id: log.resourceId,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        metadata: {
          phi_access: true,
          timestamp: log.timestamp.toISOString(),
        },
      },
    })
  }

  /**
   * Get PHI access logs for a specific resource
   */
  async getPHIAccessLogs(
    resourceType: string,
    resourceId: string,
    days: number = 90
  ): Promise<Array<{
    userId: string
    action: string
    timestamp: Date
    ipAddress?: string
  }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await prisma.auditLog.findMany({
      where: {
        resource_type: resourceType,
        resource_id: resourceId,
        action: {
          startsWith: 'PHI_',
        },
        created_at: {
          gte: startDate,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return logs.map(log => ({
      userId: log.user_id || 'SYSTEM',
      action: log.action,
      timestamp: log.created_at,
      ipAddress: log.ip_address || undefined,
    }))
  }

  /**
   * Get user access logs (who accessed PHI)
   */
  async getUserAccessLogs(
    userId: string,
    days: number = 90
  ): Promise<Array<{
    resourceType: string
    resourceId: string
    action: string
    timestamp: Date
  }>> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await prisma.auditLog.findMany({
      where: {
        user_id: userId,
        action: {
          startsWith: 'PHI_',
        },
        created_at: {
          gte: startDate,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return logs.map(log => ({
      resourceType: log.resource_type,
      resourceId: log.resource_id || '',
      action: log.action,
      timestamp: log.created_at,
    }))
  }

  /**
   * Generate HIPAA compliance report
   */
  async generateComplianceReport(): Promise<HIPAAComplianceReport> {
    const findings: HIPAAComplianceReport['findings'] = []

    // Check encryption status
    const unencryptedData = await this.checkUnencryptedData()
    const encryptionStatus = unencryptedData.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT'

    if (unencryptedData.length > 0) {
      findings.push({
        severity: 'HIGH',
        category: 'Encryption',
        description: `Found ${unencryptedData.length} records with potentially unencrypted PHI`,
        recommendation: 'Enable encryption for all PHI data at rest',
      })
    }

    // Check audit log retention (HIPAA requires 6 years)
    const oldestLog = await prisma.auditLog.findFirst({
      where: {
        action: {
          startsWith: 'PHI_',
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    })

    const logRetentionYears = oldestLog
      ? Math.floor((Date.now() - oldestLog.created_at.getTime()) / (365 * 24 * 60 * 60 * 1000))
      : 0

    const auditLogRetention = logRetentionYears >= 6 ? 'COMPLIANT' : 'NON_COMPLIANT'

    if (logRetentionYears < 6) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Audit Logs',
        description: `Audit logs only retained for ${logRetentionYears} years (HIPAA requires 6 years)`,
        recommendation: 'Configure audit log retention policy for minimum 6 years',
      })
    }

    // Check for access controls
    const accessControlIssues = await this.checkAccessControls()
    findings.push(...accessControlIssues)

    // Count PHI access logs
    const accessLogCount = await prisma.auditLog.count({
      where: {
        action: {
          startsWith: 'PHI_',
        },
      },
    })

    // Check for breach notification procedures
    const breachNotificationReady = await this.checkBreachNotificationReadiness()
    if (!breachNotificationReady) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Breach Notification',
        description: 'Breach notification procedures not fully configured',
        recommendation: 'Set up automated breach detection and notification system',
      })
    }

    // Check for backup and disaster recovery
    const backupCompliant = await this.checkBackupCompliance()
    if (!backupCompliant) {
      findings.push({
        severity: 'HIGH',
        category: 'Backup & Recovery',
        description: 'Backup and disaster recovery not fully compliant',
        recommendation: 'Implement automated backups with encryption and regular testing',
      })
    }

    return {
      compliant: findings.filter(f => f.severity === 'HIGH').length === 0,
      findings,
      accessLogs: accessLogCount,
      encryptionStatus,
      auditLogRetention,
    }
  }

  /**
   * Check for unencrypted data
   */
  private async checkUnencryptedData(): Promise<string[]> {
    const issues: string[] = []

    // Check integration connections
    const unencryptedConnections = await prisma.integrationConnection.count({
      where: {
        encrypted_credentials: null,
        status: 'ACTIVE',
      },
    })

    if (unencryptedConnections > 0) {
      issues.push(`${unencryptedConnections} unencrypted integration connections`)
    }

    // Check SSO configurations
    const unencryptedSSO = await prisma.sSOConfiguration.count({
      where: {
        client_secret: null,
        enabled: true,
      },
    })

    if (unencryptedSSO > 0) {
      issues.push(`${unencryptedSSO} SSO configurations without encrypted secrets`)
    }

    return issues
  }

  /**
   * Check access control implementation
   */
  private async checkAccessControls(): Promise<HIPAAComplianceReport['findings']> {
    const findings: HIPAAComplianceReport['findings'] = []

    // Check for users without MFA (if MFA is required for PHI access)
    // This is a placeholder - implement based on your auth system

    // Check for overly permissive roles
    const adminCount = await prisma.teamMember.count({
      where: {
        role: 'OWNER',
      },
    })

    if (adminCount > 10) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Access Control',
        description: `${adminCount} users with owner/admin access`,
        recommendation: 'Review and minimize users with elevated privileges',
      })
    }

    return findings
  }

  /**
   * Check breach notification readiness
   */
  private async checkBreachNotificationReadiness(): Promise<boolean> {
    // Check if breach notification configuration exists
    // This would typically check for:
    // - Incident response plan
    // - Notification templates
    // - Contact lists
    // - Automated detection rules

    // Placeholder implementation
    return process.env.BREACH_NOTIFICATION_EMAIL !== undefined
  }

  /**
   * Check backup compliance
   */
  private async checkBackupCompliance(): Promise<boolean> {
    // Check if backups are configured and encrypted
    // This would typically check for:
    // - Automated backup schedule
    // - Backup encryption
    // - Off-site backup storage
    // - Regular restore testing

    // Placeholder implementation
    return process.env.BACKUP_ENABLED === 'true'
  }

  /**
   * Generate Business Associate Agreement (BAA) data
   */
  async generateBAAData(): Promise<{
    coveredEntities: string[]
    businessAssociates: string[]
    safeguards: string[]
    breachNotification: string
  }> {
    return {
      coveredEntities: [
        'Healthcare providers using the platform',
        'Health plans integrated with the system',
      ],
      businessAssociates: [
        'AWS (Cloud Infrastructure)',
        'Stripe (Payment Processing)',
        'OpenAI (Document Processing)',
      ],
      safeguards: [
        'AES-256-GCM encryption at rest',
        'TLS 1.3 encryption in transit',
        'Role-based access control (RBAC)',
        'Comprehensive audit logging',
        'Automated key rotation',
        'Regular security audits',
        'Multi-factor authentication support',
        'Data backup and disaster recovery',
      ],
      breachNotification: 'Breaches will be reported within 60 days of discovery as required by HIPAA',
    }
  }

  /**
   * Sanitize PHI from logs (de-identification)
   */
  sanitizePHI(text: string): string {
    // Remove common PHI patterns
    let sanitized = text

    // Remove email addresses
    sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL_REDACTED]')

    // Remove phone numbers
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]')

    // Remove SSN patterns
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]')

    // Remove dates of birth (various formats)
    sanitized = sanitized.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '[DATE_REDACTED]')

    // Remove names (this is simplistic - use NER for production)
    // This is a placeholder

    return sanitized
  }

  /**
   * Generate minimum necessary access report
   * HIPAA requires "minimum necessary" access to PHI
   */
  async generateMinimumNecessaryReport(userId: string): Promise<{
    user: any
    accessLevel: 'FULL' | 'LIMITED' | 'MINIMAL'
    recommendations: string[]
  }> {
    const logs = await this.getUserAccessLogs(userId, 30)

    // Analyze access patterns
    const uniqueResources = new Set(logs.map(l => l.resourceId)).size
    const accessFrequency = logs.length

    let accessLevel: 'FULL' | 'LIMITED' | 'MINIMAL'
    const recommendations: string[] = []

    if (accessFrequency > 100 && uniqueResources > 50) {
      accessLevel = 'FULL'
      recommendations.push('Consider restricting access to specific departments or resources')
    } else if (accessFrequency > 20 && uniqueResources > 10) {
      accessLevel = 'LIMITED'
      recommendations.push('Access level appears appropriate')
    } else {
      accessLevel = 'MINIMAL'
      recommendations.push('Access level is minimal - compliant with minimum necessary standard')
    }

    return {
      user: { userId },
      accessLevel,
      recommendations,
    }
  }
}

export const hipaa = new HIPAAComplianceService()
