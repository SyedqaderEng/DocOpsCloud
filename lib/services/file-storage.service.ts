/**
 * File Storage Service
 * Handles file upload/download from S3/MinIO with TTL management
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import { Readable } from 'stream'
import { prisma } from '@/lib/db/prisma'
import { UploadResult, StorageFile } from '../engines/base.engine'

export class FileStorageService {
  private s3Client: S3Client
  private bucketName: string
  private useLocalStorage: boolean
  private localStoragePath: string

  constructor() {
    // Check if we should use local storage (for development)
    this.useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true'
    this.localStoragePath = process.env.LOCAL_STORAGE_PATH || './storage'

    if (!this.useLocalStorage) {
      // Initialize S3/MinIO client
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT, // For MinIO
        credentials: process.env.AWS_ACCESS_KEY_ID
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            }
          : undefined,
        forcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
      })
      this.bucketName = process.env.S3_BUCKET_NAME || 'docops-files'
    } else {
      // Placeholder for local storage
      this.s3Client = null as any
      this.bucketName = ''
    }
  }

  /**
   * Upload file from buffer
   */
  async uploadFromBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    userId?: string,
    metadata?: any
  ): Promise<UploadResult> {
    const fileId = uuidv4()
    const storageKey = this.generateStorageKey(fileId, filename)

    if (this.useLocalStorage) {
      await this.uploadToLocal(storageKey, buffer)
    } else {
      await this.uploadToS3(storageKey, buffer, mimeType)
    }

    // Store in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours TTL

    await prisma.file.create({
      data: {
        fileId,
        userId: userId || 'anonymous',
        storageKey,
        filename,
        mimeType,
        sizeBytes: buffer.length,
        metadata: metadata || {},
        uploadedAt: new Date(),
        expiresAt,
      },
    })

    return {
      fileId,
      filename,
      size: buffer.length,
      mimeType,
      metadata: metadata || {},
    }
  }

  /**
   * Upload file from file path
   */
  async uploadFromPath(
    filePath: string,
    userId?: string,
    metadata?: any
  ): Promise<UploadResult> {
    const buffer = await fs.readFile(filePath)
    const filename = path.basename(filePath)
    const mimeType = this.getMimeType(filename)

    return await this.uploadFromBuffer(buffer, filename, mimeType, userId, metadata)
  }

  /**
   * Download file to buffer
   */
  async downloadToBuffer(fileId: string): Promise<Buffer> {
    const file = await prisma.file.findUnique({
      where: { fileId },
    })

    if (!file) {
      throw new Error(`File not found: ${fileId}`)
    }

    if (file.expiresAt < new Date()) {
      throw new Error(`File expired: ${fileId}`)
    }

    if (this.useLocalStorage) {
      return await this.downloadFromLocal(file.storageKey)
    } else {
      return await this.downloadFromS3(file.storageKey)
    }
  }

  /**
   * Download file to local path
   */
  async downloadToPath(fileId: string, destinationPath: string): Promise<string> {
    const buffer = await this.downloadToBuffer(fileId)
    await fs.writeFile(destinationPath, buffer)
    return destinationPath
  }

  /**
   * Get download stream for large files
   */
  async getDownloadStream(fileId: string): Promise<Readable> {
    const file = await prisma.file.findUnique({
      where: { fileId },
    })

    if (!file) {
      throw new Error(`File not found: ${fileId}`)
    }

    if (file.expiresAt < new Date()) {
      throw new Error(`File expired: ${fileId}`)
    }

    if (this.useLocalStorage) {
      const localPath = path.join(this.localStoragePath, file.storageKey)
      return require('fs').createReadStream(localPath)
    } else {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: file.storageKey,
      })

      const response = await this.s3Client.send(command)
      return response.Body as Readable
    }
  }

  /**
   * Get signed download URL
   */
  async getSignedDownloadUrl(fileId: string, expiresIn: number = 3600): Promise<string> {
    const file = await prisma.file.findUnique({
      where: { fileId },
    })

    if (!file) {
      throw new Error(`File not found: ${fileId}`)
    }

    if (this.useLocalStorage) {
      // For local storage, return API URL
      return `/api/v2/files/${fileId}/download`
    } else {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: file.storageKey,
      })

      return await getSignedUrl(this.s3Client, command, { expiresIn })
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { fileId },
    })

    if (!file) {
      return // Already deleted
    }

    // Delete from storage
    if (this.useLocalStorage) {
      await this.deleteFromLocal(file.storageKey)
    } else {
      await this.deleteFromS3(file.storageKey)
    }

    // Delete from database
    await prisma.file.delete({
      where: { fileId },
    })
  }

  /**
   * Cleanup expired files
   */
  async cleanupExpiredFiles(): Promise<number> {
    const expiredFiles = await prisma.file.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    for (const file of expiredFiles) {
      try {
        await this.deleteFile(file.fileId)
      } catch (error) {
        console.error(`Failed to delete expired file ${file.fileId}:`, error)
      }
    }

    return expiredFiles.length
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<StorageFile> {
    const file = await prisma.file.findUnique({
      where: { fileId },
    })

    if (!file) {
      throw new Error(`File not found: ${fileId}`)
    }

    return {
      fileId: file.fileId,
      filename: file.filename,
      size: Number(file.sizeBytes),
      mimeType: file.mimeType,
      storageKey: file.storageKey,
      metadata: file.metadata as any,
      uploadedAt: file.uploadedAt,
      expiresAt: file.expiresAt,
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateStorageKey(fileId: string, filename: string): string {
    const ext = path.extname(filename)
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    return `uploads/${date}/${fileId}${ext}`
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.txt': 'text/plain',
    }

    return mimeTypes[ext] || 'application/octet-stream'
  }

  // S3 Operations
  private async uploadToS3(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })

    await this.s3Client.send(command)
  }

  private async downloadFromS3(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    const response = await this.s3Client.send(command)
    const stream = response.Body as Readable

    return await this.streamToBuffer(stream)
  }

  private async deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    })

    await this.s3Client.send(command)
  }

  // Local Storage Operations
  private async uploadToLocal(key: string, buffer: Buffer): Promise<void> {
    const localPath = path.join(this.localStoragePath, key)
    const dir = path.dirname(localPath)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(localPath, buffer)
  }

  private async downloadFromLocal(key: string): Promise<Buffer> {
    const localPath = path.join(this.localStoragePath, key)
    return await fs.readFile(localPath)
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const localPath = path.join(this.localStoragePath, key)
    await fs.unlink(localPath).catch(() => {
      // Ignore if file doesn't exist
    })
  }

  // Utility
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
}

// Singleton instance
export const fileStorageService = new FileStorageService()
