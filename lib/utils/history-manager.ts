/**
 * Action History Manager for Undo/Redo functionality
 */

export interface Action {
  id: string
  type: string
  description: string
  timestamp: number
  data: any
  inverse?: any // Data needed to undo the action
}

export class HistoryManager {
  private history: Action[] = []
  private currentIndex: number = -1
  private maxHistory: number = 50 // Keep last 50 actions

  /**
   * Add a new action to history
   */
  addAction(action: Omit<Action, 'id' | 'timestamp'>): void {
    // Remove any actions after current index (when adding new action after undo)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }

    // Create full action with metadata
    const fullAction: Action = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    // Add to history
    this.history.push(fullAction)
    this.currentIndex++

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift()
      this.currentIndex--
    }
  }

  /**
   * Undo the last action
   */
  undo(): Action | null {
    if (!this.canUndo()) {
      return null
    }

    const action = this.history[this.currentIndex]
    this.currentIndex--
    return action
  }

  /**
   * Redo the next action
   */
  redo(): Action | null {
    if (!this.canRedo()) {
      return null
    }

    this.currentIndex++
    const action = this.history[this.currentIndex]
    return action
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex >= 0
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  /**
   * Get current action
   */
  getCurrentAction(): Action | null {
    if (this.currentIndex < 0) {
      return null
    }
    return this.history[this.currentIndex]
  }

  /**
   * Get all history
   */
  getHistory(): Action[] {
    return [...this.history]
  }

  /**
   * Get undo/redo counts
   */
  getCounts(): { undoCount: number; redoCount: number } {
    return {
      undoCount: this.currentIndex + 1,
      redoCount: this.history.length - this.currentIndex - 1,
    }
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = []
    this.currentIndex = -1
  }

  /**
   * Get history at specific index
   */
  getActionAt(index: number): Action | null {
    if (index < 0 || index >= this.history.length) {
      return null
    }
    return this.history[index]
  }

  /**
   * Jump to specific action in history
   */
  jumpTo(index: number): boolean {
    if (index < 0 || index >= this.history.length) {
      return false
    }
    this.currentIndex = index
    return true
  }
}

/**
 * Create action creators for common operations
 */
export const createAction = {
  pageAdd: (pageNumber: number, data: any): Omit<Action, 'id' | 'timestamp'> => ({
    type: 'PAGE_ADD',
    description: `Added page ${pageNumber}`,
    data: { pageNumber, ...data },
    inverse: { pageNumber },
  }),

  pageDelete: (pageNumber: number, data: any): Omit<Action, 'id' | 'timestamp'> => ({
    type: 'PAGE_DELETE',
    description: `Deleted page ${pageNumber}`,
    data: { pageNumber },
    inverse: { pageNumber, ...data }, // Store page data for undo
  }),

  pageRotate: (pageNumber: number, angle: number): Omit<Action, 'id' | 'timestamp'> => ({
    type: 'PAGE_ROTATE',
    description: `Rotated page ${pageNumber} by ${angle}°`,
    data: { pageNumber, angle },
    inverse: { pageNumber, angle: -angle },
  }),

  watermarkAdd: (
    watermarkText: string,
    options: any
  ): Omit<Action, 'id' | 'timestamp'> => ({
    type: 'WATERMARK_ADD',
    description: `Added watermark: "${watermarkText}"`,
    data: { watermarkText, options },
    inverse: { watermarkText, options },
  }),

  annotationAdd: (
    annotation: any
  ): Omit<Action, 'id' | 'timestamp'> => ({
    type: 'ANNOTATION_ADD',
    description: `Added annotation`,
    data: annotation,
    inverse: { id: annotation.id },
  }),

  annotationDelete: (
    annotation: any
  ): Omit<Action, 'id' | 'timestamp'> => ({
    type: 'ANNOTATION_DELETE',
    description: `Deleted annotation`,
    data: { id: annotation.id },
    inverse: annotation,
  }),

  signatureAdd: (
    signature: any
  ): Omit<Action, 'id' | 'timestamp'> => ({
    type: 'SIGNATURE_ADD',
    description: `Added signature`,
    data: signature,
    inverse: { id: signature.id },
  }),

  textEdit: (
    pageNumber: number,
    oldText: string,
    newText: string
  ): Omit<Action, 'id' | 'timestamp'> => ({
    type: 'TEXT_EDIT',
    description: `Edited text on page ${pageNumber}`,
    data: { pageNumber, text: newText },
    inverse: { pageNumber, text: oldText },
  }),
}

/**
 * Export singleton instance
 */
export const historyManager = new HistoryManager()
