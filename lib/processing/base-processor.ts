import { prisma } from '@/lib/db/prisma'
import { generatePresignedDownloadUrl, uploadToS3, generateS3Key } from '@/lib/storage/s3'
import { createFileRecord } from '@/lib/storage/upload'
import { FileType } from '@prisma/client'

export abstract class BaseProcessor {
  /**
   * Download file from S3
   */
  protected async downloadFile(fileId: string): Promise<Buffer> {
    // Get file record
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new Error('File not found')
    }

    // Generate download URL
    const downloadUrl = await generatePresignedDownloadUrl(file.stored_name)

    // Download file
    const response = await fetch(downloadUrl)

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Upload processed file to S3
   */
  protected async uploadFile(
    userId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<{ fileId: string; s3Url: string }> {
    // Generate S3 key
    const key = generateS3Key(userId, fileName)

    // Upload to S3
    const s3Url = await uploadToS3(key, fileBuffer, mimeType)

    // Determine file type
    const fileType = this.getFileTypeFromMime(mimeType)

    // Create file record
    const fileRecord = await createFileRecord({
      userId,
      originalName: fileName,
      storedName: key,
      fileType,
      fileSize: BigInt(fileBuffer.length),
      mimeType,
      s3Url,
    })

    // Mark as complete
    await prisma.file.update({
      where: { id: fileRecord.id },
      data: {
        upload_status: 'COMPLETE',
        processing_status: 'COMPLETE',
      },
    })

    return {
      fileId: fileRecord.id,
      s3Url,
    }
  }

  /**
   * Get file type from MIME type
   */
  protected getFileTypeFromMime(mimeType: string): FileType {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word') || mimeType.includes('docx')) return 'DOCX'
    if (mimeType.includes('excel') || mimeType.includes('xlsx')) return 'XLSX'
    if (mimeType.includes('csv')) return 'CSV'
    if (mimeType.startsWith('image/')) return 'IMAGE'
    return 'OTHER'
  }

  /**
   * Validate input file
   */
  protected async validateInputFile(fileId: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file) {
      throw new Error('Input file not found')
    }

    if (file.upload_status !== 'COMPLETE') {
      throw new Error('Input file upload not complete')
    }
  }

  /**
   * Log processing step
   */
  protected log(message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${message}`, data || '')
  }

  /**
   * Log error
   */
  protected logError(message: string, error: any): void {
    const timestamp = new Date().toISOString()
    console.error(`[${timestamp}] ERROR: ${message}`, error)
  }
}
