'use client'

import { useState, useCallback } from 'react'

export interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map())

  const uploadFile = useCallback(async (file: File) => {
    const tempId = Math.random().toString(36).substring(7)

    // Initialize upload progress
    setUploads((prev) => {
      const next = new Map(prev)
      next.set(tempId, {
        fileId: tempId,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      })
      return next
    })

    try {
      // Get pre-signed URL
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

      // Update with real file ID
      setUploads((prev) => {
        const next = new Map(prev)
        const existing = next.get(tempId)
        if (existing) {
          next.delete(tempId)
          next.set(fileId, { ...existing, fileId, status: 'uploading' })
        }
        return next
      })

      // Upload to S3 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploads((prev) => {
              const next = new Map(prev)
              const existing = next.get(fileId)
              if (existing) {
                next.set(fileId, { ...existing, progress })
              }
              return next
            })
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      // Complete upload
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, key, success: true }),
      })

      if (!completeResponse.ok) {
        throw new Error('Failed to complete upload')
      }

      // Mark as complete
      setUploads((prev) => {
        const next = new Map(prev)
        const existing = next.get(fileId)
        if (existing) {
          next.set(fileId, { ...existing, status: 'complete', progress: 100 })
        }
        return next
      })

      return fileId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'

      setUploads((prev) => {
        const next = new Map(prev)
        const entries = Array.from(next.entries())
        const entry = entries.find(([_, v]) => v.fileName === file.name)
        if (entry) {
          const [id, existing] = entry
          next.set(id, { ...existing, status: 'error', error: errorMessage })
        }
        return next
      })

      throw error
    }
  }, [])

  const clearUpload = useCallback((fileId: string) => {
    setUploads((prev) => {
      const next = new Map(prev)
      next.delete(fileId)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setUploads(new Map())
  }, [])

  return {
    uploads: Array.from(uploads.values()),
    uploadFile,
    clearUpload,
    clearAll,
  }
}
