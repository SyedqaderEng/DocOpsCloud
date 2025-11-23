/**
 * Workflow Service
 * Orchestrates tool execution using engines and job queue
 */

import path from 'path'
import fs from 'fs/promises'
import { UniversalEngine, ToolConfig, JobResult, ProcessParams } from '../engines/base.engine'
import { PDFEngine } from '../engines/pdf.engine'
import { Queue } from 'bullmq'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/db/prisma'

export interface ToolRequest {
  toolName: string
  fileId: string
  params: ProcessParams
  userId?: string
}

export interface ValidationError {
  valid: false
  error: string
  field?: string
}

export interface ValidationSuccess {
  valid: true
}

export type ValidationResult = ValidationSuccess | ValidationError

export class WorkflowService {
  private engines: Map<string, UniversalEngine>
  private toolsConfig: Record<string, ToolConfig> | null = null
  private queue: Queue

  constructor() {
    this.engines = new Map()
    this.initializeEngines()

    // Initialize BullMQ queue
    this.queue = new Queue('file-processing', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    })
  }

  /**
   * Initialize all available engines
   */
  private initializeEngines(): void {
    this.engines.set('PDFEngine', new PDFEngine())
    // Add more engines as they're implemented:
    // this.engines.set('ImageEngine', new ImageEngine())
    // this.engines.set('VideoEngine', new VideoEngine())
    // etc.
  }

  /**
   * Load tools configuration from JSON
   */
  private async loadToolsConfig(): Promise<Record<string, ToolConfig>> {
    if (this.toolsConfig) {
      return this.toolsConfig
    }

    const configPath = path.join(process.cwd(), 'config', 'tools-config.json')
    const configContent = await fs.readFile(configPath, 'utf-8')
    this.toolsConfig = JSON.parse(configContent)

    return this.toolsConfig!
  }

  /**
   * Get a specific tool configuration
   */
  async getToolConfig(toolName: string): Promise<ToolConfig> {
    const allTools = await this.loadToolsConfig()

    if (!allTools[toolName]) {
      throw new Error(`Tool not found: ${toolName}`)
    }

    return allTools[toolName]
  }

  /**
   * Get all available tools
   */
  async getAllTools(): Promise<Record<string, ToolConfig>> {
    return await this.loadToolsConfig()
  }

  /**
   * Get tools by category
   */
  async getToolsByCategory(category: string): Promise<Record<string, ToolConfig>> {
    const allTools = await this.loadToolsConfig()
    const filtered: Record<string, ToolConfig> = {}

    for (const [toolName, config] of Object.entries(allTools)) {
      if (config.category === category) {
        filtered[toolName] = config
      }
    }

    return filtered
  }

  /**
   * Get engine instance
   */
  private getEngine(engineName: string): UniversalEngine {
    const engine = this.engines.get(engineName)

    if (!engine) {
      throw new Error(`Engine not found: ${engineName}. Available: ${Array.from(this.engines.keys()).join(', ')}`)
    }

    return engine
  }

  /**
   * Validate tool parameters against schema
   */
  validateParams(params: ProcessParams, toolConfig: ToolConfig): ValidationResult {
    const schema = toolConfig.params

    // Check required parameters
    for (const [paramName, paramDef] of Object.entries(schema)) {
      if (paramDef.required && !(paramName in params)) {
        return {
          valid: false,
          error: `Missing required parameter: ${paramName}`,
          field: paramName,
        }
      }

      // If parameter provided, validate type and constraints
      if (paramName in params) {
        const value = params[paramName]
        const validation = this.validateParamValue(value, paramDef, paramName)
        if (!validation.valid) {
          return validation
        }
      }
    }

    return { valid: true }
  }

  /**
   * Validate individual parameter value
   */
  private validateParamValue(
    value: any,
    paramDef: any,
    paramName: string
  ): ValidationResult {
    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value

    if (paramDef.type === 'enum') {
      if (!paramDef.values.includes(value)) {
        return {
          valid: false,
          error: `Invalid value for ${paramName}. Must be one of: ${paramDef.values.join(', ')}`,
          field: paramName,
        }
      }
    } else if (actualType !== paramDef.type) {
      return {
        valid: false,
        error: `Invalid type for ${paramName}. Expected ${paramDef.type}, got ${actualType}`,
        field: paramName,
      }
    }

    // Number constraints
    if (paramDef.type === 'number') {
      if (paramDef.min !== undefined && value < paramDef.min) {
        return {
          valid: false,
          error: `${paramName} must be at least ${paramDef.min}`,
          field: paramName,
        }
      }
      if (paramDef.max !== undefined && value > paramDef.max) {
        return {
          valid: false,
          error: `${paramName} must be at most ${paramDef.max}`,
          field: paramName,
        }
      }
    }

    // Array validation
    if (paramDef.type === 'array' && paramDef.items) {
      for (let i = 0; i < value.length; i++) {
        const itemValidation = this.validateParamValue(
          value[i],
          paramDef.items,
          `${paramName}[${i}]`
        )
        if (!itemValidation.valid) {
          return itemValidation
        }
      }
    }

    return { valid: true }
  }

  /**
   * Apply default values to parameters
   */
  private applyDefaults(params: ProcessParams, toolConfig: ToolConfig): ProcessParams {
    const result = { ...params }

    for (const [paramName, paramDef] of Object.entries(toolConfig.params)) {
      if (!(paramName in result) && paramDef.default !== undefined) {
        result[paramName] = paramDef.default
      }
      if (!(paramName in result) && paramDef.value !== undefined) {
        result[paramName] = paramDef.value
      }
    }

    return result
  }

  /**
   * Estimate processing time (in milliseconds)
   */
  private estimateTime(toolConfig: ToolConfig): number {
    // Simple estimation based on operation type
    const estimates: Record<string, number> = {
      split: 2000,
      merge: 3000,
      compress: 5000,
      rotate: 1500,
      watermark: 3000,
      'extract-text': 4000,
      'add-page-numbers': 2500,
      default: 3000,
    }

    return estimates[toolConfig.operation] || estimates.default
  }

  /**
   * Execute tool request (async via queue)
   */
  async executeToolRequest(request: ToolRequest): Promise<JobResult> {
    // 1. Load tool config
    const toolConfig = await this.getToolConfig(request.toolName)

    // 2. Apply defaults
    const params = this.applyDefaults(request.params, toolConfig)

    // 3. Validate parameters
    const validation = this.validateParams(params, toolConfig)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // 4. Validate engine exists
    this.getEngine(toolConfig.engine)

    // 5. Get file info from database
    const file = await prisma.file.findUnique({
      where: { fileId: request.fileId },
    })

    if (!file) {
      throw new Error(`File not found: ${request.fileId}`)
    }

    // 6. Create job in database
    const jobId = uuidv4()

    await prisma.request.create({
      data: {
        requestId: jobId,
        userId: request.userId || 'anonymous',
        fileId: request.fileId,
        pipeline: {
          steps: [
            {
              toolName: request.toolName,
              engine: toolConfig.engine,
              operation: toolConfig.operation,
              params,
            },
          ],
        },
        status: 'queued',
        progress: 0,
        currentStep: 0,
        totalSteps: 1,
        createdAt: new Date(),
      },
    })

    // 7. Queue for processing
    await this.queue.add(
      'process-file',
      {
        jobId,
        fileId: request.fileId,
        engine: toolConfig.engine,
        operation: toolConfig.operation,
        params,
        userId: request.userId,
      },
      {
        jobId,
        removeOnComplete: { age: 3600 }, // Keep for 1 hour
        removeOnFail: { age: 86400 }, // Keep failures for 24 hours
      }
    )

    // 8. Return job result
    return {
      jobId,
      status: 'queued',
      estimatedTime: this.estimateTime(toolConfig),
    }
  }

  /**
   * Execute tool synchronously (for testing or small operations)
   */
  async executeToolSync(
    filePath: string,
    toolName: string,
    params: ProcessParams
  ): Promise<Buffer> {
    // 1. Load tool config
    const toolConfig = await this.getToolConfig(toolName)

    // 2. Apply defaults
    const processParams = this.applyDefaults(params, toolConfig)

    // 3. Validate parameters
    const validation = this.validateParams(processParams, toolConfig)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // 4. Get engine
    const engine = this.getEngine(toolConfig.engine)

    // 5. Execute workflow
    const loaded = await engine.load(filePath)
    const processed = await engine.process(loaded, toolConfig.operation, processParams)
    const exported = await engine.export(processed)

    // 6. Cleanup
    await engine.cleanup([filePath])

    return exported
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobResult> {
    const request = await prisma.request.findUnique({
      where: { requestId: jobId },
    })

    if (!request) {
      throw new Error(`Job not found: ${jobId}`)
    }

    const result: JobResult = {
      jobId,
      status: request.status as any,
      progress: request.progress,
    }

    if (request.status === 'completed' && request.outputToken) {
      result.outputFileId = request.outputToken
      result.downloadUrl = `/api/v2/files/${request.outputToken}/download`
    }

    if (request.status === 'failed' && request.error) {
      result.error = request.error
    }

    return result
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    // Update database
    await prisma.request.update({
      where: { requestId: jobId },
      data: {
        status: 'failed',
        error: 'Cancelled by user',
      },
    })

    // Remove from queue
    const job = await this.queue.getJob(jobId)
    if (job) {
      await job.remove()
    }
  }
}

// Singleton instance
export const workflowService = new WorkflowService()
