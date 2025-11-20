'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUploader } from '@/components/shared/FileUploader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, ArrowRight, CheckCircle } from 'lucide-react'

export default function PdfMergePage() {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; name: string }>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  const handleFileUploaded = (fileId: string, fileName: string) => {
    setUploadedFiles((prev) => [...prev, { id: fileId, name: fileName }])
    setError(null)
  }

  const handleMerge = async () => {
    if (uploadedFiles.length < 2) {
      setError('Please upload at least 2 PDF files to merge')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/process/pdf/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileIds: uploadedFiles.map((f) => f.id),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create merge job')
      }

      const data = await response.json()
      setJobId(data.jobId)

      // Redirect to job status page
      router.push(`/jobs/${data.jobId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Merge PDF Files</h1>
        <p className="text-muted-foreground">
          Combine multiple PDF files into a single document. Files will be merged in the order shown
          below.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload PDF Files</CardTitle>
            <CardDescription>
              Upload 2 or more PDF files to merge them together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              accept=".pdf,application/pdf"
              maxSize={50 * 1024 * 1024} // 50MB
              onUploadComplete={handleFileUploaded}
            />
          </CardContent>
        </Card>

        {uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Files to Merge ({uploadedFiles.length})</CardTitle>
              <CardDescription>
                Files will be merged in this order. You can remove files if needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
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
                onClick={handleMerge}
                disabled={uploadedFiles.length < 2 || isProcessing}
                className="w-full mt-6"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating merge job...
                  </>
                ) : (
                  <>
                    Merge {uploadedFiles.length} PDFs
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">Upload your PDF files</p>
                <p className="text-muted-foreground">
                  Select 2 or more PDF files from your device
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">Arrange the order</p>
                <p className="text-muted-foreground">
                  Files are merged in the order they appear in the list
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">Download merged PDF</p>
                <p className="text-muted-foreground">
                  Your merged PDF will be ready for download in seconds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
