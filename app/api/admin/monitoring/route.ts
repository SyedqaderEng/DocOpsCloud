// Admin Monitoring Dashboard API

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { performanceMonitor } from '@/lib/monitoring/performance'
import { cache } from '@/lib/cache/redis-cache'
import { dbOptimizer } from '@/lib/database/optimizer'

export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user is admin
    // For now, allow all authenticated users

    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('hours') || '24', 10)

    // Get performance metrics
    const performanceReport = await performanceMonitor.getReport(period)
    const slowQueries = await performanceMonitor.getSlowQueries(period, 1000)

    // Get cache statistics
    const cacheStats = cache.getStats()

    // Get database metrics
    const dbSize = await dbOptimizer.analyzeDatabaseSize()
    const connectionStats = await dbOptimizer.optimizeConnections()

    // Get health metrics
    const healthMetrics = await performanceMonitor.getHealthMetrics()

    // Compile dashboard data
    const dashboard = {
      overview: {
        status: healthMetrics.database.healthy && healthMetrics.api.healthy
          ? 'healthy'
          : 'degraded',
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '2.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      performance: {
        report: performanceReport,
        slowQueries: slowQueries.slice(0, 10),
        avgResponseTime: healthMetrics.api.avgResponseTime,
      },
      cache: {
        stats: cacheStats,
        enabled: process.env.REDIS_URL !== undefined,
      },
      database: {
        health: healthMetrics.database,
        size: {
          total: dbSize.totalSize,
          largestTables: dbSize.tables.slice(0, 5),
        },
        connections: connectionStats,
        recommendations: dbSize.recommendations,
      },
      memory: {
        heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        external_mb: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: dashboard,
    })
  } catch (error) {
    console.error('Monitoring dashboard error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate monitoring dashboard',
      },
      { status: 500 }
    )
  }
}

// POST endpoint for triggering maintenance tasks
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    let result: any

    switch (action) {
      case 'clear_cache':
        await cache.clear()
        result = { message: 'Cache cleared successfully' }
        break

      case 'run_maintenance':
        result = await dbOptimizer.runMaintenance()
        break

      case 'reset_stats':
        cache.resetStats()
        result = { message: 'Statistics reset successfully' }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Monitoring action error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute action',
      },
      { status: 500 }
    )
  }
}
