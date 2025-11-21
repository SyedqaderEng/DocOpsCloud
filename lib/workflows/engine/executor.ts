// Workflow Execution Engine

import prisma from '@/lib/db/prisma'
import { executeAction, ActionResult } from '../actions'

export interface WorkflowStep {
  id: string
  action: string
  config: Record<string, any>
  nextOnSuccess?: string
  nextOnFailure?: string
  conditions?: WorkflowCondition[]
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface ExecutionContext {
  workflowId: string
  runId: string
  userId: string
  triggerData: Record<string, any>
  variables: Record<string, any>
  stepResults: Record<string, any>
}

export interface ExecutionResult {
  success: boolean
  stepResults: Record<string, any>
  error?: string
  completedSteps: number
  totalSteps: number
}

export class WorkflowExecutor {
  private context: ExecutionContext

  constructor(context: ExecutionContext) {
    this.context = context
  }

  async execute(steps: WorkflowStep[]): Promise<ExecutionResult> {
    const stepResults: Record<string, any> = {}
    let currentStepIndex = 0
    let error: string | undefined

    try {
      // Update run status to RUNNING
      await prisma.workflowRun.update({
        where: { id: this.context.runId },
        data: { status: 'RUNNING' },
      })

      while (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex]

        // Check conditions
        if (step.conditions && !this.evaluateConditions(step.conditions)) {
          currentStepIndex++
          continue
        }

        // Update progress
        await prisma.workflowRun.update({
          where: { id: this.context.runId },
          data: {
            current_step: currentStepIndex,
            step_results: stepResults,
          },
        })

        // Execute step
        const result = await this.executeStep(step)
        stepResults[step.id] = result

        if (!result.success) {
          error = result.error
          if (step.nextOnFailure) {
            // Find the failure step
            const failureIndex = steps.findIndex(s => s.id === step.nextOnFailure)
            if (failureIndex >= 0) {
              currentStepIndex = failureIndex
              continue
            }
          }
          break // Stop on failure if no failure handler
        }

        // Determine next step
        if (step.nextOnSuccess) {
          const nextIndex = steps.findIndex(s => s.id === step.nextOnSuccess)
          if (nextIndex >= 0) {
            currentStepIndex = nextIndex
            continue
          }
        }

        currentStepIndex++
      }

      // Update run with final status
      await prisma.workflowRun.update({
        where: { id: this.context.runId },
        data: {
          status: error ? 'FAILED' : 'COMPLETED',
          step_results: stepResults,
          error,
          completed_at: new Date(),
        },
      })

      return {
        success: !error,
        stepResults,
        error,
        completedSteps: Object.keys(stepResults).length,
        totalSteps: steps.length,
      }
    } catch (err: any) {
      await prisma.workflowRun.update({
        where: { id: this.context.runId },
        data: {
          status: 'FAILED',
          error: err.message,
          completed_at: new Date(),
        },
      })

      return {
        success: false,
        stepResults,
        error: err.message,
        completedSteps: Object.keys(stepResults).length,
        totalSteps: steps.length,
      }
    }
  }

  private async executeStep(step: WorkflowStep): Promise<ActionResult> {
    // Resolve variables in config
    const resolvedConfig = this.resolveVariables(step.config)

    // Execute the action
    return executeAction(step.action, resolvedConfig, this.context)
  }

  private evaluateConditions(conditions: WorkflowCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(condition.field)

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value
        case 'not_equals':
          return fieldValue !== condition.value
        case 'contains':
          return String(fieldValue).includes(String(condition.value))
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value)
        case 'less_than':
          return Number(fieldValue) < Number(condition.value)
        default:
          return true
      }
    })
  }

  private getFieldValue(field: string): any {
    // Support dot notation: triggerData.fileName, stepResults.step1.output
    const parts = field.split('.')
    let value: any = {
      triggerData: this.context.triggerData,
      variables: this.context.variables,
      stepResults: this.context.stepResults,
    }

    for (const part of parts) {
      if (value === undefined || value === null) return undefined
      value = value[part]
    }

    return value
  }

  private resolveVariables(config: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string') {
        // Replace {{variable}} patterns
        resolved[key] = value.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
          return String(this.getFieldValue(path.trim()) || '')
        })
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveVariables(value)
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }
}

// Create and start a workflow run
export async function startWorkflowRun(
  workflowId: string,
  userId: string,
  triggerType: string,
  triggerData: Record<string, any>
): Promise<string> {
  // Get workflow
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  })

  if (!workflow) {
    throw new Error('Workflow not found')
  }

  if (workflow.status !== 'ACTIVE') {
    throw new Error('Workflow is not active')
  }

  // Create run
  const run = await prisma.workflowRun.create({
    data: {
      workflow_id: workflowId,
      triggered_by: userId,
      trigger_type: triggerType,
      trigger_data: triggerData,
      status: 'PENDING',
    },
  })

  // Start execution asynchronously
  const context: ExecutionContext = {
    workflowId,
    runId: run.id,
    userId,
    triggerData,
    variables: (workflow.variables as Record<string, any>) || {},
    stepResults: {},
  }

  const executor = new WorkflowExecutor(context)
  const steps = workflow.steps as WorkflowStep[]

  // Execute in background
  executor.execute(steps).catch(console.error)

  return run.id
}
