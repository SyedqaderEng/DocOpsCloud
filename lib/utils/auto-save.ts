/**
 * Auto-Save Work in Progress System
 * Saves user work to localStorage to prevent data loss
 */

const AUTO_SAVE_KEY_PREFIX = 'docops_autosave_'
const AUTO_SAVE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface AutoSaveData {
  toolId: string
  files: {
    name: string
    size: number
    type: string
  }[]
  settings: Record<string, any>
  timestamp: number
  userId?: string
}

/**
 * Save current work to localStorage
 */
export function autoSave(toolId: string, data: Omit<AutoSaveData, 'toolId' | 'timestamp'>): void {
  try {
    const saveData: AutoSaveData = {
      toolId,
      ...data,
      timestamp: Date.now()
    }

    const key = `${AUTO_SAVE_KEY_PREFIX}${toolId}`
    localStorage.setItem(key, JSON.stringify(saveData))
  } catch (err) {
    console.error('Auto-save failed:', err)
  }
}

/**
 * Load saved work from localStorage
 */
export function loadAutoSave(toolId: string): AutoSaveData | null {
  try {
    const key = `${AUTO_SAVE_KEY_PREFIX}${toolId}`
    const saved = localStorage.getItem(key)

    if (!saved) return null

    const data: AutoSaveData = JSON.parse(saved)

    // Check if expired
    if (Date.now() - data.timestamp > AUTO_SAVE_EXPIRY_MS) {
      clearAutoSave(toolId)
      return null
    }

    return data
  } catch (err) {
    console.error('Failed to load auto-save:', err)
    return null
  }
}

/**
 * Clear saved work
 */
export function clearAutoSave(toolId: string): void {
  try {
    const key = `${AUTO_SAVE_KEY_PREFIX}${toolId}`
    localStorage.removeItem(key)
  } catch (err) {
    console.error('Failed to clear auto-save:', err)
  }
}

/**
 * Check if there is saved work
 */
export function hasAutoSave(toolId: string): boolean {
  const data = loadAutoSave(toolId)
  return data !== null
}

/**
 * Get all auto-saved sessions
 */
export function getAllAutoSaves(): AutoSaveData[] {
  try {
    const saves: AutoSaveData[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(AUTO_SAVE_KEY_PREFIX)) {
        const saved = localStorage.getItem(key)
        if (saved) {
          try {
            const data: AutoSaveData = JSON.parse(saved)
            // Check if not expired
            if (Date.now() - data.timestamp <= AUTO_SAVE_EXPIRY_MS) {
              saves.push(data)
            }
          } catch {
            // Invalid JSON, skip
          }
        }
      }
    }

    return saves.sort((a, b) => b.timestamp - a.timestamp)
  } catch (err) {
    console.error('Failed to get all auto-saves:', err)
    return []
  }
}

/**
 * Clear all expired auto-saves
 */
export function clearExpiredAutoSaves(): void {
  try {
    const keysToDelete: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(AUTO_SAVE_KEY_PREFIX)) {
        const saved = localStorage.getItem(key)
        if (saved) {
          try {
            const data: AutoSaveData = JSON.parse(saved)
            if (Date.now() - data.timestamp > AUTO_SAVE_EXPIRY_MS) {
              keysToDelete.push(key)
            }
          } catch {
            // Invalid JSON, delete it
            keysToDelete.push(key)
          }
        }
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key))
  } catch (err) {
    console.error('Failed to clear expired auto-saves:', err)
  }
}

/**
 * Get time since last save
 */
export function getTimeSinceLastSave(toolId: string): string | null {
  const data = loadAutoSave(toolId)
  if (!data) return null

  const diffMs = Date.now() - data.timestamp
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  return 'More than 24 hours ago'
}
