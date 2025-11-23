// Performance Monitoring Service

import { prisma } from '@/lib/db/prisma'

export interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: Date
  metadata?: Record<string, any>
}

export interface PerformanceReport {
  period: string
  metrics: {
    operation: string
    count: number
    avgDuration: number
    minDuration: number
    maxDuration: number
    p50: number
    p95: number
    p99: number
  }[]
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private flushInterval = 60000 // 1 minute
  private maxBufferSize = 1000

  constructor() {
    // Flush metrics periodically
    setInterval(() => this.flush(), this.flushInterval)
  }

  /**
   * Record a performance metric
   */
  record(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      operation,
      duration,
      timestamp: new Date(),
      metadata,
    })

    // Flush if buffer is full
    if (this.metrics.length >= this.maxBufferSize) {
      this.flush()
    }
  }

  /**
   * Measure execution time of an async function
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.record(operation, duration, metadata)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.record(operation, duration, {
        ...metadata,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Flush metrics to database
   */
  private async flush(): Promise<void> {
    if (this.metrics.length === 0) return

    const metricsToFlush = [...this.metrics]
    this.metrics = []

    try {
      // In production, send to monitoring service (Datadog, New Relic, etc.)
      // For now, we'll store in audit log
      await prisma.auditLog.createMany({
        data: metricsToFlush.map(m => ({
          action: 'PERFORMANCE_METRIC',
          resource_type: 'SYSTEM',
          resource_id: m.operation,
          metadata: {
            duration_ms: m.duration,
            timestamp: m.timestamp.toISOString(),
            ...m.metadata,
          },
        })),
      })
    } catch (error) {
      console.error('Failed to flush performance metrics:', error)
    }
  }

  /**
   * Get performance report for a time period
   */
  async getReport(hours: number = 24): Promise<PerformanceReport> {
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'PERFORMANCE_METRIC',
        created_at: {
          gte: startTime,
        },
      },
    })

    // Group by operation
    const grouped = new Map<string, number[]>()

    logs.forEach(log => {
      const operation = log.resource_id || 'unknown'
      const metadata = log.metadata as any
      const duration = metadata?.duration_ms

      if (duration !== undefined) {
        if (!grouped.has(operation)) {
          grouped.set(operation, [])
        }
        grouped.get(operation)!.push(duration)
      }
    })

    // Calculate statistics
    const metrics = Array.from(grouped.entries()).map(([operation, durations]) => {
      durations.sort((a, b) => a - b)

      const count = durations.length
      const sum = durations.reduce((a, b) => a + b, 0)
      const avg = sum / count

      return {
        operation,
        count,
        avgDuration: Math.round(avg * 100) / 100,
        minDuration: Math.round(durations[0] * 100) / 100,
        maxDuration: Math.round(durations[count - 1] * 100) / 100,
        p50: Math.round(durations[Math.floor(count * 0.5)] * 100) / 100,
        p95: Math.round(durations[Math.floor(count * 0.95)] * 100) / 100,
        p99: Math.round(durations[Math.floor(count * 0.99)] * 100) / 100,
      }
    })

    return {
      period: `Last ${hours} hours`,
      metrics: metrics.sort((a, b) => b.count - a.count),
    }
  }

  /**
   * Get slow queries (>1000ms)
   */
  async getSlowQueries(hours: number = 24, threshold: number = 1000): Promise<{
    operation: string
    duration: number
    timestamp: Date
    metadata?: any
  }[]> {
    const startTime = new Date()
    startTime.setHours(startTime.getHours() - hours)

    const logs = await prisma.auditLog.findMany({
      where: {
        action: 'PERFORMANCE_METRIC',
        created_at: {
          gte: startTime,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 1000,
    })

    const slowQueries = logs
      .map(log => ({
        operation: log.resource_id || 'unknown',
        duration: (log.metadata as any)?.duration_ms || 0,
        timestamp: log.created_at,
        metadata: log.metadata,
      }))
      .filter(q => q.duration >= threshold)
      .sort((a, b) => b.duration - a.duration)

    return slowQueries
  }

  /**
   * Get system health metrics
   */
  async getHealthMetrics(): Promise<{
    database: { healthy: boolean; latency?: number }
    cache: { healthy: boolean; hitRate?: number }
    api: { healthy: boolean; avgResponseTime?: number }
  }> {
    // Database health check
    const dbStart = performance.now()
    try {
      await prisma.$queryRaw`SELECT 1`
      const dbLatency = performance.now() - dbStart

      return {
        database: {
          healthy: dbLatency < 100,
          latency: Math.round(dbLatency * 100) / 100,
        },
        cache: {
          healthy: true, // TODO: Implement Redis health check
          hitRate: 0.85, // TODO: Calculate from actual cache stats
        },
        api: {
          healthy: true,
          avgResponseTime: 150, // TODO: Calculate from recent metrics
        },
      }
    } catch (error) {
      return {
        database: { healthy: false },
        cache: { healthy: false },
        api: { healthy: false },
      }
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Helper decorator for measuring function performance
export function Measure(operation: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(
        `${operation}.${propertyKey}`,
        () => originalMethod.apply(this, args)
      )
    }

    return descriptor
  }
}
