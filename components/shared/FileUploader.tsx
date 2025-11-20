'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileWithProgress {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'complete' | 'error'
  error?: string
  fileId?: string
}

interface FileUploaderProps {
  maxSize?: number
  maxFiles?: number
  accept?: Record<string, string[]>
  onUploadComplete?: (fileId: string, file: File) => void
  onUploadError?: (error: string, file: File) => void
  className?: string
}

export function FileUploader({
  maxSize = 100 * 1024 * 1024, // 100MB default
  maxFiles = 5,
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  },
  onUploadComplete,
  onUploadError,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])

  const uploadFile = async (file: File) => {
    const fileWithProgress: FileWithProgress = {
      file,
      id: Math.random().toString(36).substring(7),
      progress: 0,
      status: 'uploading',
    }

    setFiles((prev) => [...prev, fileWithProgress])

    try {
      // Step 1: Request pre-signed upload URL
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      })

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json()
        throw new Error(error.error || 'Failed to get upload URL')
      }

      const { data } = await presignedResponse.json()
      const { uploadUrl, key, fileId } = data

      // Step 2: Upload file to S3 using pre-signed URL
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileWithProgress.id ? { ...f, progress } : f
              )
            )
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'))
        })

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      // Step 3: Notify backend that upload is complete
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          key,
          success: true,
        }),
      })

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload')
      }

      // Mark as complete
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, status: 'complete', progress: 100, fileId }
            : f
        )
      )

      onUploadComplete?.(fileId, file)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      )

      onUploadError?.(errorMessage, file)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Limit number of files
      const filesToUpload = acceptedFiles.slice(0, maxFiles - files.length)

      // Upload each file
      filesToUpload.forEach((file) => {
        uploadFile(file)
      })
    },
    [files.length, maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    maxFiles,
    accept,
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary/50',
          files.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={files.length >= maxFiles} />

        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Max {maxFiles} files, up to {Math.round(maxSize / 1024 / 1024)}MB each
            </p>
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((fileItem) => (
            <div
              key={fileItem.id}
              className="flex items-center gap-3 p-4 border rounded-lg bg-white"
            >
              <File className="h-8 w-8 text-gray-400 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                {/* Progress Bar */}
                {fileItem.status === 'uploading' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${fileItem.progress}%` }}
                    />
                  </div>
                )}

                {/* Error Message */}
                {fileItem.status === 'error' && (
                  <p className="mt-1 text-xs text-red-500">{fileItem.error}</p>
                )}
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {fileItem.status === 'uploading' && (
                  <span className="text-xs text-gray-500">{fileItem.progress}%</span>
                )}
                {fileItem.status === 'complete' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {fileItem.status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>

              {/* Remove Button */}
              {(fileItem.status === 'complete' || fileItem.status === 'error') && (
                <button
                  onClick={() => removeFile(fileItem.id)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
