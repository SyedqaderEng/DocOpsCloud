/**
 * Image Processing Type Definitions
 */

// Supported image formats
export type ImageFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'gif' | 'avif' | 'tiff' | 'bmp'

// Image quality (1-100)
export type ImageQuality = number

// Resize modes
export type ResizeMode = 'cover' | 'contain' | 'fill' | 'inside' | 'outside'

// Fit options
export type FitOption = 'cover' | 'contain' | 'fill' | 'inside' | 'outside'

// Position for cropping
export type Position =
  | 'top'
  | 'right top'
  | 'right'
  | 'right bottom'
  | 'bottom'
  | 'left bottom'
  | 'left'
  | 'left top'
  | 'center'

/**
 * Image Resize Options
 */
export interface ImageResizeOptions {
  width?: number
  height?: number
  fit?: FitOption
  position?: Position
  background?: string
  withoutEnlargement?: boolean
  withoutReduction?: boolean
}

/**
 * Image Compression Options
 */
export interface ImageCompressOptions {
  quality?: ImageQuality
  format?: ImageFormat
  progressive?: boolean
  optimizeScans?: boolean
  chromaSubsampling?: string
}

/**
 * Image Format Conversion Options
 */
export interface ImageConvertOptions {
  format: ImageFormat
  quality?: ImageQuality
  progressive?: boolean
  lossless?: boolean
  effort?: number // 0-9 for webp/avif
}

/**
 * Image Crop Options
 */
export interface ImageCropOptions {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Image Rotate Options
 */
export interface ImageRotateOptions {
  angle: number
  background?: string
}

/**
 * Image Flip Options
 */
export interface ImageFlipOptions {
  horizontal?: boolean
  vertical?: boolean
}

/**
 * Watermark Options
 */
export interface WatermarkOptions {
  text?: string
  imagePath?: string
  position?: Position
  opacity?: number
  fontSize?: number
  fontColor?: string
  marginX?: number
  marginY?: number
}

/**
 * Image Filter Options
 */
export interface ImageFilterOptions {
  grayscale?: boolean
  blur?: number
  sharpen?: number
  brightness?: number
  contrast?: number
  saturation?: number
  hue?: number
  tint?: string
  negate?: boolean
  normalize?: boolean
}

/**
 * Image Metadata
 */
export interface ImageMetadata {
  format?: string
  width?: number
  height?: number
  space?: string
  channels?: number
  depth?: string
  density?: number
  hasAlpha?: boolean
  orientation?: number
  size?: number
  aspectRatio?: number
  exif?: Record<string, any>
  icc?: boolean
  iptc?: Record<string, any>
  xmp?: Record<string, any>
}

/**
 * Image Processing Result
 */
export interface ImageProcessingResult {
  buffer: Buffer
  metadata: ImageMetadata
  size: number
  format: string
}

/**
 * Batch Processing Options
 */
export interface BatchImageOptions {
  resize?: ImageResizeOptions
  compress?: ImageCompressOptions
  convert?: ImageConvertOptions
  filters?: ImageFilterOptions
  watermark?: WatermarkOptions
}

/**
 * Image Analysis Result
 */
export interface ImageAnalysisResult {
  dominant_color?: string
  colors?: Array<{ color: string; percentage: number }>
  brightness?: number
  contrast?: number
  sharpness?: number
  faces?: number
  objects?: Array<{ label: string; confidence: number }>
}

/**
 * Thumbnail Options
 */
export interface ThumbnailOptions {
  width: number
  height: number
  fit?: FitOption
  quality?: ImageQuality
  format?: ImageFormat
}

/**
 * Image Optimization Options
 */
export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: ImageQuality
  format?: ImageFormat
  progressive?: boolean
  stripMetadata?: boolean
}

/**
 * Image Border Options
 */
export interface ImageBorderOptions {
  width: number
  color: string
}

/**
 * Image Padding Options
 */
export interface ImagePaddingOptions {
  top: number
  right: number
  bottom: number
  left: number
  color?: string
}
