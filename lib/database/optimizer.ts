// Database Query Optimizer

import { prisma } from '@/lib/db/prisma'
import { performanceMonitor } from '@/lib/monitoring/performance'

export interface QueryAnalysis {
  query: string
  executionTime: number
  rowsAffected: number
  recommendations: string[]
}

export class DatabaseOptimizer {
  /**
   * Analyze slow queries
   */
  async analyzeSlowQueries(threshold: number = 1000): Promise<QueryAnalysis[]> {
    const slowQueries = await performanceMonitor.getSlowQueries(24, threshold)

    return slowQueries.map(q => ({
      query: q.operation,
      executionTime: q.duration,
      rowsAffected: 0, // TODO: Extract from metadata
      recommendations: this.generateRecommendations(q.operation, q.duration),
    }))
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(query: string, duration: number): string[] {
    const recommendations: string[] = []

    if (duration > 5000) {
      recommendations.push('Consider adding database indexes for frequently queried fields')
    }

    if (duration > 2000) {
      recommendations.push('Review query complexity and consider query optimization')
    }

    if (query.includes('list') || query.includes('findMany')) {
      recommendations.push('Implement pagination to reduce result set size')
      recommendations.push('Add selective field projection to reduce data transfer')
    }

    if (query.includes('count')) {
      recommendations.push('Consider caching count results')
    }

    return recommendations
  }

  /**
   * Get index recommendations
   */
  async getIndexRecommendations(): Promise<{
    table: string
    column: string
    reason: string
  }[]> {
    // In production, analyze query patterns from logs
    // For now, returning common recommendations

    return [
      {
        table: 'users',
        column: 'email',
        reason: 'Frequently used in WHERE clauses for authentication',
      },
      {
        table: 'files',
        column: 'user_id',
        reason: 'Frequently joined with users table',
      },
      {
        table: 'audit_logs',
        column: 'created_at',
        reason: 'Used in time-range queries for analytics',
      },
      {
        table: 'workflows',
        column: 'status',
        reason: 'Frequently filtered by status',
      },
    ]
  }

  /**
   * Analyze database size and growth
   */
  async analyzeDatabaseSize(): Promise<{
    totalSize: number
    tables: Array<{
      name: string
      rows: number
      size: number
    }>
    recommendations: string[]
  }> {
    // Get table sizes (PostgreSQL specific)
    const tableSizes = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      LIMIT 10
    `

    // Get row counts
    const tables = await Promise.all(
      tableSizes.map(async (table: any) => ({
        name: table.tablename,
        rows: await this.getTableRowCount(table.tablename),
        size: table.size_bytes,
      }))
    )

    const totalSize = tables.reduce((sum, t) => sum + t.size, 0)

    // Generate recommendations
    const recommendations: string[] = []

    tables.forEach(table => {
      if (table.name === 'audit_logs' && table.rows > 1000000) {
        recommendations.push(
          `Consider partitioning audit_logs table by date (${table.rows.toLocaleString()} rows)`
        )
      }

      if (table.name === 'files' && table.rows > 100000) {
        recommendations.push(
          `Implement file cleanup policy for old files (${table.rows.toLocaleString()} rows)`
        )
      }
    })

    if (totalSize > 10 * 1024 * 1024 * 1024) {
      // 10GB
      recommendations.push('Database size exceeds 10GB - consider archiving old data')
    }

    return {
      totalSize,
      tables,
      recommendations,
    }
  }

  /**
   * Get table row count
   */
  private async getTableRowCount(tableName: string): Promise<number> {
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    )
    return parseInt(result[0].count, 10)
  }

  /**
   * Optimize database connections
   */
  async optimizeConnections(): Promise<{
    current: number
    max: number
    idle: number
    active: number
    recommendations: string[]
  }> {
    // Get connection pool stats (Prisma specific)
    const recommendations: string[] = []

    const maxConnections = parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10', 10)
    const currentConnections = 5 // Placeholder - get from actual pool

    if (currentConnections > maxConnections * 0.8) {
      recommendations.push('Connection pool nearing capacity - consider increasing max connections')
    }

    if (maxConnections < 20) {
      recommendations.push('Consider increasing connection pool size for better performance')
    }

    return {
      current: currentConnections,
      max: maxConnections,
      idle: 2,
      active: currentConnections - 2,
      recommendations,
    }
  }

  /**
   * Run VACUUM ANALYZE on all tables
   */
  async runMaintenance(): Promise<{
    success: boolean
    duration: number
    tables: string[]
  }> {
    const start = performance.now()
    const tables: string[] = []

    try {
      // Run VACUUM ANALYZE (PostgreSQL)
      await prisma.$executeRaw`VACUUM ANALYZE`

      const duration = performance.now() - start

      return {
        success: true,
        duration: Math.round(duration),
        tables: ['all'],
      }
    } catch (error) {
      console.error('Database maintenance error:', error)
      return {
        success: false,
        duration: 0,
        tables: [],
      }
    }
  }

  /**
   * Get query execution plan
   */
  async explainQuery(query: string): Promise<{
    plan: any[]
    estimatedCost: number
    recommendations: string[]
  }> {
    try {
      // Run EXPLAIN on query
      const plan = await prisma.$queryRawUnsafe<any[]>(`EXPLAIN (FORMAT JSON) ${query}`)

      return {
        plan,
        estimatedCost: 0, // Extract from plan
        recommendations: [],
      }
    } catch (error) {
      console.error('Query explain error:', error)
      return {
        plan: [],
        estimatedCost: 0,
        recommendations: ['Query failed to execute'],
      }
    }
  }
}

export const dbOptimizer = new DatabaseOptimizer()
