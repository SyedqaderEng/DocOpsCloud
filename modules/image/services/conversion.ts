/**
 * Image Conversion Service
 *
 * Handles image format conversion, resizing, compression, and manipulation
 * Uses sharp library for high-performance image processing
 */

import sharp from 'sharp'
import type {
  ImageFormat,
  ImageResizeOptions,
  ImageCompressOptions,
  ImageConvertOptions,
  ImageCropOptions,
  ImageRotateOptions,
  ImageFlipOptions,
  WatermarkOptions,
  ImageFilterOptions,
  ImageMetadata,
  ImageProcessingResult,
  ThumbnailOptions,
  ImageOptimizationOptions,
  ImageBorderOptions,
  ImagePaddingOptions,
} from '../types'

class ImageConversionService {
  /**
   * Resize image
   */
  async resize(
    imageBuffer: Buffer,
    options: ImageResizeOptions
  ): Promise<ImageProcessingResult> {
    const image = sharp(imageBuffer)

    const resized = image.resize({
      width: options.width,
      height: options.height,
      fit: options.fit || 'cover',
      position: options.position || 'center',
      background: options.background || { r: 255, g: 255, b: 255, alpha: 0 },
      withoutEnlargement: options.withoutEnlargement || false,
      withoutReduction: options.withoutReduction || false,
    })

    const buffer = await resized.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Compress image
   */
  async compress(
    imageBuffer: Buffer,
    options: ImageCompressOptions
  ): Promise<ImageProcessingResult> {
    let image = sharp(imageBuffer)

    // Apply format-specific compression
    switch (options.format) {
      case 'jpeg':
      case 'jpg':
        image = image.jpeg({
          quality: options.quality || 80,
          progressive: options.progressive || false,
          optimizeScans: options.optimizeScans || false,
          chromaSubsampling: options.chromaSubsampling || '4:2:0',
        })
        break

      case 'png':
        image = image.png({
          quality: options.quality || 80,
          progressive: options.progressive || false,
          compressionLevel: 9,
        })
        break

      case 'webp':
        image = image.webp({
          quality: options.quality || 80,
        })
        break

      case 'avif':
        image = image.avif({
          quality: options.quality || 80,
        })
        break

      default:
        // Keep original format
        break
    }

    const buffer = await image.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Convert image format
   */
  async convert(
    imageBuffer: Buffer,
    options: ImageConvertOptions
  ): Promise<ImageProcessingResult> {
    let image = sharp(imageBuffer)

    switch (options.format) {
      case 'jpeg':
      case 'jpg':
        image = image.jpeg({
          quality: options.quality || 90,
          progressive: options.progressive || false,
        })
        break

      case 'png':
        image = image.png({
          quality: options.quality || 90,
          progressive: options.progressive || false,
        })
        break

      case 'webp':
        image = image.webp({
          quality: options.quality || 90,
          lossless: options.lossless || false,
          effort: options.effort || 4,
        })
        break

      case 'avif':
        image = image.avif({
          quality: options.quality || 90,
          lossless: options.lossless || false,
          effort: options.effort || 4,
        })
        break

      case 'tiff':
        image = image.tiff({
          quality: options.quality || 90,
        })
        break

      case 'gif':
        image = image.gif()
        break

      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }

    const buffer = await image.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Crop image
   */
  async crop(
    imageBuffer: Buffer,
    options: ImageCropOptions
  ): Promise<ImageProcessingResult> {
    const image = sharp(imageBuffer)

    const cropped = image.extract({
      left: options.left,
      top: options.top,
      width: options.width,
      height: options.height,
    })

    const buffer = await cropped.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Rotate image
   */
  async rotate(
    imageBuffer: Buffer,
    options: ImageRotateOptions
  ): Promise<ImageProcessingResult> {
    const image = sharp(imageBuffer)

    const rotated = image.rotate(options.angle, {
      background: options.background || { r: 255, g: 255, b: 255, alpha: 0 },
    })

    const buffer = await rotated.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Flip image
   */
  async flip(
    imageBuffer: Buffer,
    options: ImageFlipOptions
  ): Promise<ImageProcessingResult> {
    let image = sharp(imageBuffer)

    if (options.horizontal) {
      image = image.flop()
    }

    if (options.vertical) {
      image = image.flip()
    }

    const buffer = await image.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Apply filters
   */
  async applyFilters(
    imageBuffer: Buffer,
    options: ImageFilterOptions
  ): Promise<ImageProcessingResult> {
    let image = sharp(imageBuffer)

    if (options.grayscale) {
      image = image.grayscale()
    }

    if (options.blur !== undefined && options.blur > 0) {
      image = image.blur(options.blur)
    }

    if (options.sharpen !== undefined && options.sharpen > 0) {
      image = image.sharpen(options.sharpen)
    }

    if (options.brightness !== undefined) {
      image = image.modulate({ brightness: options.brightness })
    }

    if (options.saturation !== undefined) {
      image = image.modulate({ saturation: options.saturation })
    }

    if (options.hue !== undefined) {
      image = image.modulate({ hue: options.hue })
    }

    if (options.tint) {
      image = image.tint(options.tint)
    }

    if (options.negate) {
      image = image.negate()
    }

    if (options.normalize) {
      image = image.normalize()
    }

    const buffer = await image.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Create thumbnail
   */
  async createThumbnail(
    imageBuffer: Buffer,
    options: ThumbnailOptions
  ): Promise<ImageProcessingResult> {
    let image = sharp(imageBuffer)

    image = image.resize({
      width: options.width,
      height: options.height,
      fit: options.fit || 'cover',
      position: 'center',
    })

    // Apply format and quality
    if (options.format) {
      switch (options.format) {
        case 'jpeg':
        case 'jpg':
          image = image.jpeg({ quality: options.quality || 80 })
          break
        case 'png':
          image = image.png({ quality: options.quality || 80 })
          break
        case 'webp':
          image = image.webp({ quality: options.quality || 80 })
          break
      }
    }

    const buffer = await image.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Optimize image
   */
  async optimize(
    imageBuffer: Buffer,
    options: ImageOptimizationOptions
  ): Promise<ImageProcessingResult> {
    let image = sharp(imageBuffer)
    const metadata = await image.metadata()

    // Resize if needed
    if (options.maxWidth || options.maxHeight) {
      const width = options.maxWidth && metadata.width && metadata.width > options.maxWidth
        ? options.maxWidth
        : metadata.width

      const height = options.maxHeight && metadata.height && metadata.height > options.maxHeight
        ? options.maxHeight
        : metadata.height

      image = image.resize({
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    // Strip metadata if requested
    if (options.stripMetadata) {
      image = image.withMetadata({
        orientation: metadata.orientation,
      })
    }

    // Apply format and quality
    const format = options.format || (metadata.format as ImageFormat)
    const quality = options.quality || 80

    switch (format) {
      case 'jpeg':
      case 'jpg':
        image = image.jpeg({
          quality,
          progressive: options.progressive || true,
        })
        break

      case 'png':
        image = image.png({
          quality,
          progressive: options.progressive || false,
          compressionLevel: 9,
        })
        break

      case 'webp':
        image = image.webp({
          quality,
        })
        break

      case 'avif':
        image = image.avif({
          quality,
        })
        break
    }

    const buffer = await image.toBuffer()
    const newMetadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(newMetadata),
      size: buffer.length,
      format: newMetadata.format || 'unknown',
    }
  }

  /**
   * Add border
   */
  async addBorder(
    imageBuffer: Buffer,
    options: ImageBorderOptions
  ): Promise<ImageProcessingResult> {
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    const bordered = image.extend({
      top: options.width,
      bottom: options.width,
      left: options.width,
      right: options.width,
      background: options.color,
    })

    const buffer = await bordered.toBuffer()
    const newMetadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(newMetadata),
      size: buffer.length,
      format: newMetadata.format || 'unknown',
    }
  }

  /**
   * Add padding
   */
  async addPadding(
    imageBuffer: Buffer,
    options: ImagePaddingOptions
  ): Promise<ImageProcessingResult> {
    const image = sharp(imageBuffer)

    const padded = image.extend({
      top: options.top,
      bottom: options.bottom,
      left: options.left,
      right: options.right,
      background: options.color || { r: 255, g: 255, b: 255, alpha: 0 },
    })

    const buffer = await padded.toBuffer()
    const metadata = await sharp(buffer).metadata()

    return {
      buffer,
      metadata: this.formatMetadata(metadata),
      size: buffer.length,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(imageBuffer: Buffer): Promise<ImageMetadata> {
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    return this.formatMetadata(metadata)
  }

  /**
   * Format metadata
   */
  private formatMetadata(metadata: sharp.Metadata): ImageMetadata {
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: metadata.size,
      aspectRatio:
        metadata.width && metadata.height ? metadata.width / metadata.height : undefined,
      exif: metadata.exif,
      icc: metadata.icc !== undefined,
      iptc: metadata.iptc,
      xmp: metadata.xmp,
    }
  }

  /**
   * Get file size information
   */
  async getFileSize(imageBuffer: Buffer): Promise<{
    bytes: number
    kilobytes: number
    megabytes: number
    formatted: string
  }> {
    const bytes = imageBuffer.length
    const kilobytes = bytes / 1024
    const megabytes = kilobytes / 1024

    let formatted: string
    if (megabytes >= 1) {
      formatted = `${megabytes.toFixed(2)} MB`
    } else if (kilobytes >= 1) {
      formatted = `${kilobytes.toFixed(2)} KB`
    } else {
      formatted = `${bytes} bytes`
    }

    return {
      bytes,
      kilobytes,
      megabytes,
      formatted,
    }
  }
}

export const imageConversionService = new ImageConversionService()
