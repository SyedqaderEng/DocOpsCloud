'use client'

import { CheckCircle2, Loader2, Circle } from 'lucide-react'

export interface ProcessingStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
}

interface ProcessingStepsProps {
  steps: ProcessingStep[]
  currentStep?: number
}

export default function ProcessingSteps({ steps, currentStep }: ProcessingStepsProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isActive = currentStep !== undefined && index === currentStep
        const isCompleted = step.status === 'completed'
        const isProcessing = step.status === 'processing' || isActive
        const isError = step.status === 'error'

        return (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition ${
              isProcessing ? 'glass-card border border-[#00d4ff]' :
              isCompleted ? 'bg-[rgba(0,255,136,0.05)]' :
              isError ? 'bg-[rgba(255,0,85,0.05)]' :
              'opacity-50'
            }`}
          >
            {/* Step Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {isProcessing && (
                <Loader2 className="w-5 h-5 text-[#00d4ff] animate-spin" />
              )}
              {isCompleted && (
                <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
              )}
              {!isProcessing && !isCompleted && !isError && (
                <Circle className="w-5 h-5 text-gray-500" />
              )}
              {isError && (
                <Circle className="w-5 h-5 text-[#ff0055]" />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold mb-1 ${
                isProcessing ? 'text-[#00d4ff]' :
                isCompleted ? 'text-[#00ff88]' :
                isError ? 'text-[#ff0055]' :
                'text-gray-400'
              }`}>
                {step.label}
              </div>
              {step.message && (
                <div className="text-xs text-gray-400">
                  {step.message}
                </div>
              )}
              {isProcessing && (
                <div className="mt-2">
                  <div className="w-full bg-[rgba(0,0,0,0.3)] rounded-full h-1">
                    <div className="bg-gradient-to-r from-[#00d4ff] to-[#a855f7] h-1 rounded-full animate-pulse" style={{ width: '70%' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Get processing steps for different operations
 */
export function getProcessingSteps(operation: string): ProcessingStep[] {
  const commonSteps = {
    pdf_compress: [
      { id: '1', label: 'Loading PDF', status: 'pending' as const },
      { id: '2', label: 'Analyzing document structure', status: 'pending' as const },
      { id: '3', label: 'Compressing images', status: 'pending' as const, message: 'Optimizing embedded images' },
      { id: '4', label: 'Optimizing fonts', status: 'pending' as const },
      { id: '5', label: 'Generating output', status: 'pending' as const },
      { id: '6', label: 'Finishing', status: 'pending' as const, message: 'Preparing download' },
    ],
    pdf_merge: [
      { id: '1', label: 'Loading PDFs', status: 'pending' as const },
      { id: '2', label: 'Extracting pages', status: 'pending' as const },
      { id: '3', label: 'Merging documents', status: 'pending' as const, message: 'Combining all pages' },
      { id: '4', label: 'Optimizing output', status: 'pending' as const },
      { id: '5', label: 'Finishing', status: 'pending' as const },
    ],
    pdf_split: [
      { id: '1', label: 'Loading PDF', status: 'pending' as const },
      { id: '2', label: 'Analyzing pages', status: 'pending' as const },
      { id: '3', label: 'Splitting document', status: 'pending' as const },
      { id: '4', label: 'Generating files', status: 'pending' as const },
      { id: '5', label: 'Finishing', status: 'pending' as const },
    ],
    pdf_to_word: [
      { id: '1', label: 'Loading PDF', status: 'pending' as const },
      { id: '2', label: 'Extracting text and formatting', status: 'pending' as const },
      { id: '3', label: 'Converting to Word format', status: 'pending' as const },
      { id: '4', label: 'Preserving layout', status: 'pending' as const, message: 'Maintaining original structure' },
      { id: '5', label: 'Finishing', status: 'pending' as const },
    ],
    default: [
      { id: '1', label: 'Loading file', status: 'pending' as const },
      { id: '2', label: 'Processing', status: 'pending' as const },
      { id: '3', label: 'Generating output', status: 'pending' as const },
      { id: '4', label: 'Finishing', status: 'pending' as const },
    ]
  }

  return commonSteps[operation as keyof typeof commonSteps] || commonSteps.default
}
