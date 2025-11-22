import { Worker, Job } from 'bullmq'
import { prisma } from '@/lib/db/prisma'
import { readFile, writeFile, unlink, rm } from 'fs/promises'
import { join } from 'path'
import { PDFDocument } from 'pdf-lib'

interface ProcessingJobData {
  jobId: string
  userId: string
  toolId: string
  files: Array<{
    originalName: string
    filename: string
    filepath: string
    size: number
    type: string
  }>
  uploadDir: string
  tier: string
}

// Redis connection config
const connection = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
    }
  : undefined

// Only create worker if Redis is available
export const createPDFWorker = () => {
  if (!connection) {
    console.log('⚠️  Redis not configured - worker will not be created')
    return null
  }

  const worker = new Worker(
    'pdf-processing',
    async (job: Job<ProcessingJobData>) => {
      console.log(`🔄 Processing job ${job.id}`)

      const { jobId, userId, toolId, files, uploadDir, tier } = job.data

      try {
        // Update job status to PROCESSING
        await prisma.processingJob.update({
          where: { id: jobId },
          data: {
            status: 'PROCESSING',
            started_at: new Date(),
            progress_percentage: 10,
          },
        })

        // Process based on tool type
        let outputPath: string
        let outputFilename: string

        switch (toolId) {
          case 'pdf-merge':
            ({ outputPath, outputFilename } = await mergePDFs(files, uploadDir))
            break

          case 'pdf-split':
            ({ outputPath, outputFilename } = await splitPDF(files[0], uploadDir))
            break

          case 'pdf-compress':
            ({ outputPath, outputFilename } = await compressPDF(files[0], uploadDir))
            break

          default:
            throw new Error(`Unsupported tool: ${toolId}`)
        }

        // Update progress
        await prisma.processingJob.update({
          where: { id: jobId },
          data: { progress_percentage: 80 },
        })

        // TODO: Upload to S3/GCS (for now, just return local path)
        const downloadUrl = `/api/download/${jobId}`

        // Create output file record
        const outputFile = await prisma.file.create({
          data: {
            user_id: userId,
            original_name: outputFilename,
            stored_name: outputFilename,
            file_type: 'PDF',
            file_size: BigInt(0), // Will be updated after upload
            mime_type: 'application/pdf',
            s3_url: downloadUrl,
            upload_status: 'COMPLETE',
            processing_status: 'COMPLETE',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        })

        // Update job as complete
        await prisma.processingJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETE',
            output_file_id: outputFile.id,
            completed_at: new Date(),
            progress_percentage: 100,
          },
        })

        // Cleanup temp files after a delay (optional)
        setTimeout(() => {
          cleanupTempFiles(uploadDir).catch(console.error)
        }, 60000) // 1 minute

        console.log(`✅ Job ${jobId} completed successfully`)

        return {
          success: true,
          outputFileId: outputFile.id,
          downloadUrl,
        }
      } catch (error: any) {
        console.error(`❌ Job ${jobId} failed:`, error)

        // Update job as failed
        await prisma.processingJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error_message: error.message,
            completed_at: new Date(),
          },
        })

        throw error
      }
    },
    {
      connection,
      concurrency: 5, // Process up to 5 jobs concurrently
      limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // Per second
      },
    }
  )

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('Worker error:', err)
  })

  console.log('🚀 PDF Worker started')

  return worker
}

// PDF Processing Functions

async function mergePDFs(
  files: ProcessingJobData['files'],
  uploadDir: string
): Promise<{ outputPath: string; outputFilename: string }> {
  const mergedPdf = await PDFDocument.create()

  for (const file of files) {
    const pdfBytes = await readFile(file.filepath)
    const pdf = await PDFDocument.load(pdfBytes)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }

  const mergedBytes = await mergedPdf.save()
  const outputFilename = `merged-${Date.now()}.pdf`
  const outputPath = join(uploadDir, outputFilename)
  await writeFile(outputPath, mergedBytes)

  return { outputPath, outputFilename }
}

async function splitPDF(
  file: ProcessingJobData['files'][0],
  uploadDir: string
): Promise<{ outputPath: string; outputFilename: string }> {
  // For demo, just copy the first page
  const pdfBytes = await readFile(file.filepath)
  const pdf = await PDFDocument.load(pdfBytes)

  const newPdf = await PDFDocument.create()
  const [firstPage] = await newPdf.copyPages(pdf, [0])
  newPdf.addPage(firstPage)

  const splitBytes = await newPdf.save()
  const outputFilename = `split-${Date.now()}.pdf`
  const outputPath = join(uploadDir, outputFilename)
  await writeFile(outputPath, splitBytes)

  return { outputPath, outputFilename }
}

async function compressPDF(
  file: ProcessingJobData['files'][0],
  uploadDir: string
): Promise<{ outputPath: string; outputFilename: string }> {
  // For demo, just copy the PDF (real compression would use different libraries)
  const pdfBytes = await readFile(file.filepath)
  const pdf = await PDFDocument.load(pdfBytes)

  const compressedBytes = await pdf.save({
    useObjectStreams: false,
  })

  const outputFilename = `compressed-${Date.now()}.pdf`
  const outputPath = join(uploadDir, outputFilename)
  await writeFile(outputPath, compressedBytes)

  return { outputPath, outputFilename }
}

async function cleanupTempFiles(uploadDir: string) {
  try {
    await rm(uploadDir, { recursive: true, force: true })
    console.log(`🧹 Cleaned up temp directory: ${uploadDir}`)
  } catch (error) {
    console.error('Failed to cleanup temp files:', error)
  }
}
