'use client'

import { use } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FileUploader } from '@/components/shared/FileUploader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, ArrowRight, CheckCircle, Lock } from 'lucide-react'
import { getAllTools } from '@/lib/tools-data'
import Link from 'next/link'

interface ToolPageProps {
  params: Promise<{
    toolId: string
  }>
}

export default function ToolPage({ params }: ToolPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<Record<string, any>>({})

  // Find tool from data
  const allTools = getAllTools()
  const tool = allTools.find((t) => t.id === resolvedParams.toolId)

  if (!tool) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>Tool not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleFileUploaded = (fileId: string, fileName: string) => {
    setUploadedFiles((prev) => [...prev, { id: fileId, name: fileName }])
    setError(null)
  }

  const handleProcess = async () => {
    if (status === 'unauthenticated') {
      router.push('/signin?callbackUrl=' + encodeURIComponent(`/tools/${tool.id}`))
      return
    }

    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Determine the API endpoint based on tool ID
      const apiPath = getApiPath(tool.id)

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: uploadedFiles.map((f) => f.id),
          options,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to process file')
      }

      const data = await response.json()

      // Redirect to job status page
      router.push(`/jobs/${data.jobId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const fileAccept = getFileAccept(tool.id)
  const maxSize = 100 * 1024 * 1024 // 100MB

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{tool.icon}</span>
          <h1 className="text-4xl font-bold">{tool.name}</h1>
        </div>
        <p className="text-muted-foreground text-lg">{tool.description}</p>
      </div>

      <div className="grid gap-6">
        {status === 'unauthenticated' && (
          <Alert className="border-purple-200 bg-purple-50">
            <Lock className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-900">
              <strong>Sign in required.</strong> Please{' '}
              <Link href="/signin" className="underline font-semibold">
                sign in
              </Link>{' '}
              to use this tool. Free users get 10 operations per month.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Upload your {getFileTypeName(tool.id)} files to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              accept={fileAccept}
              maxSize={maxSize}
              onUploadComplete={handleFileUploaded}
              disabled={status === 'unauthenticated'}
            />
          </CardContent>
        </Card>

        {tool.id.includes('merge') && uploadedFiles.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Files will be merged in the order shown below. Upload multiple
                files to combine them into one.
              </p>
            </CardContent>
          </Card>
        )}

        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
              <CardDescription>Review and manage your files before processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isProcessing}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleProcess}
                disabled={uploadedFiles.length === 0 || isProcessing}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Process {uploadedFiles.length} {uploadedFiles.length === 1 ? 'File' : 'Files'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Upload your files</p>
                <p className="text-muted-foreground">
                  Select {getFileTypeName(tool.id)} files from your device
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Automatic processing</p>
                <p className="text-muted-foreground">
                  Our servers will process your files using advanced algorithms
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Download results</p>
                <p className="text-muted-foreground">
                  Your processed files will be ready for download instantly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-semibold mb-1">Secure & Private</p>
                <p>
                  Your files are encrypted during upload and automatically deleted after 24 hours. We
                  never store or share your data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper functions
function getApiPath(toolId: string): string {
  // Map tool IDs to API endpoints
  if (toolId.startsWith('pdf-')) {
    const operation = toolId.replace('pdf-', '')
    return `/api/process/pdf/${operation}`
  } else if (toolId.startsWith('word-')) {
    const operation = toolId.replace('word-', '')
    return `/api/process/word/${operation}`
  } else if (toolId.startsWith('excel-')) {
    const operation = toolId.replace('excel-', '')
    return `/api/process/excel/${operation}`
  } else if (toolId.startsWith('image-')) {
    const operation = toolId.replace('image-', '')
    return `/api/process/image/${operation}`
  }
  return '/api/process/generic'
}

function getFileAccept(toolId: string): string {
  if (toolId.startsWith('pdf-')) return '.pdf,application/pdf'
  if (toolId.startsWith('word-')) return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (toolId.startsWith('excel-') || toolId.startsWith('csv-'))
    return '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv'
  if (toolId.startsWith('image-')) return 'image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff'
  return '*/*'
}

function getFileTypeName(toolId: string): string {
  if (toolId.startsWith('pdf-')) return 'PDF'
  if (toolId.startsWith('word-')) return 'Word'
  if (toolId.startsWith('excel-')) return 'Excel'
  if (toolId.startsWith('csv-')) return 'CSV'
  if (toolId.startsWith('image-')) return 'image'
  return 'document'
}
