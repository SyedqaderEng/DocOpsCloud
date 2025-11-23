/**
 * PDF Text Extraction Service
 * Uses pdfjs-dist for text extraction
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'

// Disable worker for Node.js environment
const globalAny: any = global
globalAny.DOMParser = null

export class PdfTextExtractionService {
  /**
   * Extract all text from PDF
   */
  async extractText(pdfBuffer: Buffer): Promise<{
    text: string
    pages: Array<{ pageNumber: number; text: string }>
  }> {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer })
    const pdfDocument = await loadingTask.promise

    const totalPages = pdfDocument.numPages
    const pages: Array<{ pageNumber: number; text: string }> = []
    let fullText = ''

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Extract text items and join them
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim()

      pages.push({
        pageNumber: pageNum,
        text: pageText,
      })

      fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`
    }

    return {
      text: fullText.trim(),
      pages,
    }
  }

  /**
   * Extract text from specific pages
   */
  async extractTextFromPages(
    pdfBuffer: Buffer,
    pageNumbers: number[]
  ): Promise<Array<{ pageNumber: number; text: string }>> {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer })
    const pdfDocument = await loadingTask.promise

    const pages: Array<{ pageNumber: number; text: string }> = []

    for (const pageNum of pageNumbers) {
      if (pageNum < 1 || pageNum > pdfDocument.numPages) {
        continue
      }

      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim()

      pages.push({
        pageNumber: pageNum,
        text: pageText,
      })
    }

    return pages
  }

  /**
   * Search for text in PDF
   */
  async searchText(
    pdfBuffer: Buffer,
    searchQuery: string,
    caseSensitive: boolean = false
  ): Promise<Array<{ pageNumber: number; matches: number; context: string[] }>> {
    const { pages } = await this.extractText(pdfBuffer)
    const results: Array<{ pageNumber: number; matches: number; context: string[] }> = []

    const query = caseSensitive ? searchQuery : searchQuery.toLowerCase()

    for (const page of pages) {
      const text = caseSensitive ? page.text : page.text.toLowerCase()

      // Count matches
      const matches = (text.match(new RegExp(query, 'g')) || []).length

      if (matches > 0) {
        // Extract context around matches
        const contextLength = 100
        const contexts: string[] = []
        let index = text.indexOf(query)

        while (index !== -1 && contexts.length < 5) {
          const start = Math.max(0, index - contextLength)
          const end = Math.min(text.length, index + query.length + contextLength)
          contexts.push(
            (start > 0 ? '...' : '') +
              page.text.substring(start, end) +
              (end < text.length ? '...' : '')
          )
          index = text.indexOf(query, index + 1)
        }

        results.push({
          pageNumber: page.pageNumber,
          matches,
          context: contexts,
        })
      }
    }

    return results
  }

  /**
   * Get word count for PDF
   */
  async getWordCount(pdfBuffer: Buffer): Promise<{
    totalWords: number
    totalCharacters: number
    pages: Array<{ pageNumber: number; words: number; characters: number }>
  }> {
    const { pages } = await this.extractText(pdfBuffer)

    let totalWords = 0
    let totalCharacters = 0

    const pageStats = pages.map((page) => {
      const words = page.text.split(/\s+/).filter((w) => w.length > 0).length
      const characters = page.text.length

      totalWords += words
      totalCharacters += characters

      return {
        pageNumber: page.pageNumber,
        words,
        characters,
      }
    })

    return {
      totalWords,
      totalCharacters,
      pages: pageStats,
    }
  }
}

export const pdfTextExtractionService = new PdfTextExtractionService()
