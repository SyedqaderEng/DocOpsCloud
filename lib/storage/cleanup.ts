import { prisma } from '@/lib/db/prisma'
import { deleteFileFromS3 } from './s3'
import { UploadStatus } from '@prisma/client'

/**
 * Clean up expired files from database and S3
 */
export async function cleanupExpiredFiles(): Promise<{
  deletedCount: number
  errors: string[]
}> {
  const errors: string[] = []
  let deletedCount = 0

  try {
    // Find all expired files
    const expiredFiles = await prisma.file.findMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    })

    console.log(`Found ${expiredFiles.length} expired files to clean up`)

    // Delete each file from S3 and database
    for (const file of expiredFiles) {
      try {
        // Delete from S3
        if (file.stored_name) {
          await deleteFileFromS3(file.stored_name)
        }

        // Delete from database
        await prisma.file.delete({
          where: { id: file.id },
        })

        deletedCount++
      } catch (error) {
        const errorMsg = `Failed to delete file ${file.id}: ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    console.log(`Successfully deleted ${deletedCount} expired files`)

    return { deletedCount, errors }
  } catch (error) {
    const errorMsg = `Cleanup job failed: ${error}`
    console.error(errorMsg)
    return { deletedCount, errors: [errorMsg] }
  }
}

/**
 * Clean up failed uploads older than 1 hour
 */
export async function cleanupFailedUploads(): Promise<{
  deletedCount: number
  errors: string[]
}> {
  const errors: string[] = []
  let deletedCount = 0

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Find failed uploads older than 1 hour
    const failedUploads = await prisma.file.findMany({
      where: {
        upload_status: UploadStatus.FAILED,
        created_at: {
          lt: oneHourAgo,
        },
      },
    })

    console.log(`Found ${failedUploads.length} failed uploads to clean up`)

    for (const file of failedUploads) {
      try {
        // Try to delete from S3 (may not exist)
        if (file.stored_name) {
          try {
            await deleteFileFromS3(file.stored_name)
          } catch (s3Error) {
            // S3 file may not exist, that's okay
            console.warn(`S3 file not found for ${file.id}, continuing...`)
          }
        }

        // Delete from database
        await prisma.file.delete({
          where: { id: file.id },
        })

        deletedCount++
      } catch (error) {
        const errorMsg = `Failed to delete failed upload ${file.id}: ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    console.log(`Successfully deleted ${deletedCount} failed uploads`)

    return { deletedCount, errors }
  } catch (error) {
    const errorMsg = `Failed upload cleanup job failed: ${error}`
    console.error(errorMsg)
    return { deletedCount, errors: [errorMsg] }
  }
}

/**
 * Clean up orphaned files (in S3 but not in database)
 * This is a more expensive operation and should run less frequently
 */
export async function cleanupOrphanedFiles(): Promise<{
  deletedCount: number
  errors: string[]
}> {
  // TODO: Implement S3 bucket listing and comparison with database
  // This requires listing all objects in S3 bucket and comparing with database
  // Can be implemented in Phase 2 if needed
  return { deletedCount: 0, errors: [] }
}

/**
 * Run all cleanup jobs
 */
export async function runCleanupJobs() {
  console.log('Starting cleanup jobs...')

  const expiredResult = await cleanupExpiredFiles()
  const failedResult = await cleanupFailedUploads()

  const totalDeleted = expiredResult.deletedCount + failedResult.deletedCount
  const allErrors = [...expiredResult.errors, ...failedResult.errors]

  console.log(`Cleanup complete: ${totalDeleted} files deleted, ${allErrors.length} errors`)

  return {
    totalDeleted,
    errors: allErrors,
    details: {
      expired: expiredResult.deletedCount,
      failed: failedResult.deletedCount,
    },
  }
}
