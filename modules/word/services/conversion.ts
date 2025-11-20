/**
 * Word Conversion Service
 *
 * Handles conversion between DOCX and other formats
 * Uses: mammoth for DOCX parsing, turndown for HTML→Markdown
 */

import mammoth from 'mammoth'
import {
  WordToPdfOptions,
  WordToHtmlOptions,
  WordToMarkdownOptions,
  WordConversionResult,
  WordTextExtractionResult,
} from '../types'

class WordConversionService {
  /**
   * Convert DOCX to HTML
   */
  async docxToHtml(
    docxBuffer: Buffer,
    options: WordToHtmlOptions = {}
  ): Promise<WordConversionResult> {
    const {
      includeStyles = true,
      includeImages = true,
      cleanHtml = false,
    } = options

    try {
      const result = await mammoth.convertToHtml(
        { buffer: docxBuffer },
        {
          includeDefaultStyleMap: includeStyles,
          includeEmbeddedStyleMap: includeStyles,
          ignoreEmptyParagraphs: cleanHtml,
        }
      )

      let html = result.value

      // Optionally clean HTML
      if (cleanHtml) {
        html = this.cleanHtml(html)
      }

      // Handle images
      if (!includeImages) {
        html = html.replace(/<img[^>]*>/g, '')
      }

      return {
        content: html,
        format: 'html',
        size: Buffer.byteLength(html, 'utf8'),
      }
    } catch (error) {
      throw new Error(`Failed to convert DOCX to HTML: ${error}`)
    }
  }

  /**
   * Convert DOCX to Markdown
   */
  async docxToMarkdown(
    docxBuffer: Buffer,
    options: WordToMarkdownOptions = {}
  ): Promise<WordConversionResult> {
    const { preserveFormatting = true, includeImages = true } = options

    try {
      // First convert to HTML
      const htmlResult = await this.docxToHtml(docxBuffer, {
        includeStyles: preserveFormatting,
        includeImages,
      })

      // Convert HTML to Markdown
      const markdown = await this.htmlToMarkdown(htmlResult.content as string, options)

      return {
        content: markdown,
        format: 'markdown',
        size: Buffer.byteLength(markdown, 'utf8'),
      }
    } catch (error) {
      throw new Error(`Failed to convert DOCX to Markdown: ${error}`)
    }
  }

  /**
   * Convert DOCX to plain text
   */
  async docxToText(docxBuffer: Buffer): Promise<WordTextExtractionResult> {
    try {
      const result = await mammoth.extractRawText({ buffer: docxBuffer })
      const text = result.value

      // Calculate statistics
      const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length
      const characterCount = text.length
      const paragraphCount = text.split(/\n\n+/).filter((para) => para.trim().length > 0)
        .length

      return {
        text,
        wordCount,
        characterCount,
        paragraphCount,
      }
    } catch (error) {
      throw new Error(`Failed to extract text from DOCX: ${error}`)
    }
  }

  /**
   * Convert DOCX to PDF
   * Note: This requires additional dependencies like puppeteer or wkhtmltopdf
   * For now, we'll convert to HTML first, then to PDF
   */
  async docxToPdf(
    docxBuffer: Buffer,
    options: WordToPdfOptions = {}
  ): Promise<WordConversionResult> {
    try {
      // First convert to HTML
      const htmlResult = await this.docxToHtml(docxBuffer, {
        includeStyles: true,
        includeImages: true,
      })

      // TODO: Implement HTML to PDF conversion using puppeteer
      // For now, this is a placeholder
      throw new Error(
        'DOCX to PDF conversion requires puppeteer. Please install: npm install puppeteer'
      )

      // Future implementation:
      // const pdfBuffer = await this.htmlToPdf(htmlResult.content as string, options)
      // return {
      //   content: pdfBuffer,
      //   format: 'pdf',
      //   size: pdfBuffer.length,
      // }
    } catch (error) {
      throw new Error(`Failed to convert DOCX to PDF: ${error}`)
    }
  }

  /**
   * Convert HTML to Markdown using turndown
   * Note: Requires turndown package
   */
  private async htmlToMarkdown(
    html: string,
    options: WordToMarkdownOptions
  ): Promise<string> {
    // For now, basic conversion - can be enhanced with turndown library
    // TODO: Install and use turndown for better HTML→Markdown conversion

    // Simple conversion without external library
    let markdown = html

    // Convert headings
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')

    // Convert paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

    // Convert bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

    // Convert lists
    markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
      return (
        items
          .map((item: string) => {
            const text = item.replace(/<\/?li[^>]*>/gi, '').trim()
            return `- ${text}`
          })
          .join('\n') + '\n\n'
      )
    })

    markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || []
      return (
        items
          .map((item: string, index: number) => {
            const text = item.replace(/<\/?li[^>]*>/gi, '').trim()
            return `${index + 1}. ${text}`
          })
          .join('\n') + '\n\n'
      )
    })

    // Convert links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

    // Convert images
    markdown = markdown.replace(
      /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi,
      '![$2]($1)'
    )
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')

    // Convert code blocks
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n')

    // Convert line breaks
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n')

    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '')

    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()

    return markdown
  }

  /**
   * Clean HTML by removing unnecessary attributes and tags
   */
  private cleanHtml(html: string): string {
    // Remove style attributes
    html = html.replace(/\s*style="[^"]*"/gi, '')

    // Remove class attributes
    html = html.replace(/\s*class="[^"]*"/gi, '')

    // Remove id attributes
    html = html.replace(/\s*id="[^"]*"/gi, '')

    // Remove empty paragraphs
    html = html.replace(/<p[^>]*>\s*<\/p>/gi, '')

    // Remove span tags (keep content)
    html = html.replace(/<\/?span[^>]*>/gi, '')

    // Clean up whitespace
    html = html.replace(/\n\s*\n/g, '\n')

    return html
  }

  /**
   * Get file size information
   */
  async getFileSize(buffer: Buffer): Promise<{
    bytes: number
    kilobytes: number
    megabytes: number
    formatted: string
  }> {
    const bytes = buffer.length
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

    return { bytes, kilobytes, megabytes, formatted }
  }
}

export const wordConversionService = new WordConversionService()
