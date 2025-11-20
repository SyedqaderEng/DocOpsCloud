import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomBytes } from 'crypto'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!
const UPLOAD_URL_EXPIRATION = 15 * 60 // 15 minutes
const DOWNLOAD_URL_EXPIRATION = 60 * 60 // 1 hour

export interface UploadConfig {
  userId: string
  fileName: string
  fileType: string
  fileSize: number
}

export interface PresignedUploadUrl {
  uploadUrl: string
  key: string
  expiresIn: number
}

/**
 * Generate a unique S3 key for a file
 */
export function generateS3Key(userId: string, originalFileName: string): string {
  const timestamp = Date.now()
  const randomId = randomBytes(8).toString('hex')
  const extension = originalFileName.split('.').pop() || 'bin'
  const sanitizedName = originalFileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50)

  return `${userId}/${timestamp}_${randomId}_${sanitizedName}.${extension}`
}

/**
 * Generate pre-signed URL for file upload
 */
export async function generatePresignedUploadUrl(
  config: UploadConfig
): Promise<PresignedUploadUrl> {
  const key = generateS3Key(config.userId, config.fileName)

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: config.fileType,
    ContentLength: config.fileSize,
    Metadata: {
      userId: config.userId,
      originalFileName: config.fileName,
      uploadedAt: new Date().toISOString(),
    },
  })

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_URL_EXPIRATION,
  })

  return {
    uploadUrl,
    key,
    expiresIn: UPLOAD_URL_EXPIRATION,
  }
}

/**
 * Generate pre-signed URL for file download
 */
export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRATION,
  })
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Check if file exists in S3
 */
export async function fileExistsInS3(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(key: string) {
  const command = new HeadObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const response = await s3Client.send(command)

  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType || 'application/octet-stream',
    lastModified: response.LastModified,
    metadata: response.Metadata || {},
  }
}

/**
 * Get public URL for a file (if bucket allows public access)
 */
export function getPublicUrl(key: string): string {
  const endpoint = process.env.S3_ENDPOINT || `https://${BUCKET_NAME}.s3.amazonaws.com`
  return `${endpoint}/${key}`
}

/**
 * Upload file directly to S3 (server-side)
 */
export async function uploadToS3(
  key: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await s3Client.send(command)

  return getPublicUrl(key)
}

export { s3Client }
