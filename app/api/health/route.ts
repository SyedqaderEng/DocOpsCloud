// Health Check Endpoint

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache/redis-cache'
import { performanceMonitor } from '@/lib/monitoring/performance'

export async function GET() {
  const startTime = performance.now()

  try {
    // Database health check
    const dbStart = performance.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = performance.now() - dbStart

    // Cache health check
    const cacheStats = cache.getStats()

    // Get recent performance metrics
    const healthMetrics = await performanceMonitor.getHealthMetrics()

    // System status
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '2.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbLatency < 100 ? 'healthy' : 'degraded',
          latency_ms: Math.round(dbLatency * 100) / 100,
          connection: 'active',
        },
        cache: {
          status: cacheStats.hitRate > 50 ? 'healthy' : 'degraded',
          hit_rate: cacheStats.hitRate,
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          keys: cacheStats.keys,
        },
        api: {
          status: 'healthy',
          response_time_ms: Math.round((performance.now() - startTime) * 100) / 100,
        },
        memory: {
          status: 'healthy',
          used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
      },
    }

    // Determine overall status
    const allHealthy = Object.values(status.checks).every(
      check => check.status === 'healthy'
    )

    if (!allHealthy) {
      status.status = 'degraded'
    }

    return NextResponse.json(status, {
      status: status.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  }
}
