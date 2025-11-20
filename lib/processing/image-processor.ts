/**
 * Image Processing Module
 *
 * Handles image operations with S3 integration
 * Supports: resize, compress, convert, crop, rotate, flip, filters, thumbnails, optimization
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { imageConversionService } from '@/modules/image/services/conversion'
import type {
  ImageResizeOptions,
  ImageCompressOptions,
  ImageConvertOptions,
  ImageCropOptions,
  ImageRotateOptions,
  ImageFlipOptions,
  ImageFilterOptions,
  ImageMetadata,
  ImageProcessingResult,
  ThumbnailOptions,
  ImageOptimizationOptions,
  ImageBorderOptions,
  ImagePaddingOptions,
} from '@/modules/image/types'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || ''

export class ImageProcessor {
  /**
   * Download file from S3
   */
  private async downloadFromS3(s3Key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    const response = await s3Client.send(command)
    const chunks: Uint8Array[] = []

    if (!response.Body) {
      throw new Error('Empty response from S3')
    }

    // @ts-ignore - Body is a readable stream
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    buffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    const s3Key = `processed/${Date.now()}-${fileName}`

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    })

    await s3Client.send(command)
    return s3Key
  }

  /**
   * Resize image
   */
  async resize(
    inputS3Key: string,
    options: ImageResizeOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.resize(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `resized-${options.width}x${options.height}.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Compress image
   */
  async compress(
    inputS3Key: string,
    options: ImageCompressOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.compress(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `compressed.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Convert image format
   */
  async convert(
    inputS3Key: string,
    options: ImageConvertOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.convert(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `converted.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Crop image
   */
  async crop(
    inputS3Key: string,
    options: ImageCropOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.crop(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `cropped.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Rotate image
   */
  async rotate(
    inputS3Key: string,
    options: ImageRotateOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.rotate(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `rotated.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Flip image
   */
  async flip(
    inputS3Key: string,
    options: ImageFlipOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.flip(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `flipped.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Apply filters
   */
  async applyFilters(
    inputS3Key: string,
    options: ImageFilterOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.applyFilters(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `filtered.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(
    inputS3Key: string,
    options: ThumbnailOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.createThumbnail(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `thumbnail-${options.width}x${options.height}.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Optimize image
   */
  async optimize(
    inputS3Key: string,
    options: ImageOptimizationOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.optimize(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `optimized.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Add border
   */
  async addBorder(
    inputS3Key: string,
    options: ImageBorderOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.addBorder(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `bordered.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Add padding
   */
  async addPadding(
    inputS3Key: string,
    options: ImagePaddingOptions
  ): Promise<{
    outputS3Key: string
    result: ImageProcessingResult
  }> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    const result = await imageConversionService.addPadding(imageBuffer, options)

    const contentType = `image/${result.format}`
    const fileName = `padded.${result.format}`
    const outputS3Key = await this.uploadToS3(result.buffer, fileName, contentType)

    return { outputS3Key, result }
  }

  /**
   * Get image metadata
   */
  async getMetadata(inputS3Key: string): Promise<ImageMetadata> {
    const imageBuffer = await this.downloadFromS3(inputS3Key)
    return await imageConversionService.getMetadata(imageBuffer)
  }

  /**
   * Get file size
   */
  async getFileSize(inputS3Key: string): Promise<{
    bytes: number
    kilobytes: number
    megabytes: number
    formatted: string
  }> {
    const buffer = await this.downloadFromS3(inputS3Key)
    return await imageConversionService.getFileSize(buffer)
  }
}

export const imageProcessor = new ImageProcessor()
