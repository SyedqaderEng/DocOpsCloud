// Queue manager - re-exports queue from client.ts
import { pdfQueue } from './client'

export const queueManager = {
  pdf: pdfQueue,
  // Add other queues as needed
  add: pdfQueue.add.bind(pdfQueue),
  getJob: pdfQueue.getJob?.bind(pdfQueue),
}
