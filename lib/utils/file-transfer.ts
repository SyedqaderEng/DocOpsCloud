/**
 * File Transfer Utility
 * Handles transferring File objects between pages using IndexedDB
 */

const DB_NAME = 'DocOpsCloud_FileTransfer'
const STORE_NAME = 'pendingFiles'
const DB_VERSION = 1

interface PendingFileData {
  id: string
  files: File[]
  timestamp: number
  toolId?: string
}

class FileTransferManager {
  private dbPromise: Promise<IDBDatabase> | null = null

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })

    return this.dbPromise
  }

  async storeFiles(files: File[], toolId?: string): Promise<string> {
    const db = await this.getDB()
    const id = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const data: PendingFileData = {
      id,
      files,
      timestamp: Date.now(),
      toolId,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(data)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  async retrieveFiles(id: string): Promise<{ files: File[]; toolId?: string } | null> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        const data = request.result as PendingFileData | undefined
        if (!data) {
          resolve(null)
          return
        }

        // Auto-cleanup old entries (older than 1 hour)
        if (Date.now() - data.timestamp > 60 * 60 * 1000) {
          this.deleteFiles(id)
          resolve(null)
          return
        }

        resolve({ files: data.files, toolId: data.toolId })
      }
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFiles(id: string): Promise<void> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Cleanup old entries (older than 1 hour)
  async cleanup(): Promise<void> {
    const db = await this.getDB()
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          const data = cursor.value as PendingFileData
          if (now - data.timestamp > maxAge) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const fileTransferManager = new FileTransferManager()
