/**
 * Image Job Queue Functions
 */

import { imageQueue } from '../client'
import type {
  ImageResizeOptions,
  ImageCompressOptions,
  ImageConvertOptions,
  ImageOptimizationOptions,
} from '@/modules/image/types'

export interface ImageResizeJobData {
  jobId: string
  userId: string
  inputS3Key: string
  options: ImageResizeOptions
}

export interface ImageCompressJobData {
  jobId: string
  userId: string
  inputS3Key: string
  options: ImageCompressOptions
}

export interface ImageConvertJobData {
  jobId: string
  userId: string
  inputS3Key: string
  options: ImageConvertOptions
}

export interface ImageOptimizeJobData {
  jobId: string
  userId: string
  inputS3Key: string
  options: ImageOptimizationOptions
}

/**
 * Add image resize job
 */
export async function addImageResizeJob(data: ImageResizeJobData) {
  return await imageQueue.add('image_resize', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}

/**
 * Add image compress job
 */
export async function addImageCompressJob(data: ImageCompressJobData) {
  return await imageQueue.add('image_compress', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}

/**
 * Add image convert job
 */
export async function addImageConvertJob(data: ImageConvertJobData) {
  return await imageQueue.add('image_convert', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}

/**
 * Add image optimize job
 */
export async function addImageOptimizeJob(data: ImageOptimizeJobData) {
  return await imageQueue.add('image_optimize', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
}
