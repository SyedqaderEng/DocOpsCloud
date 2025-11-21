// Text Analysis Algorithms

export interface TextAnalysisResult {
  characterCount: number
  characterCountNoSpaces: number
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  averageWordLength: number
  averageSentenceLength: number
  readingTime: number // minutes
  speakingTime: number // minutes
  readabilityScore: number // Flesch-Kincaid
  readabilityGrade: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentScore: number // -1 to 1
  topWords: Array<{ word: string; count: number }>
  uniqueWords: number
  lexicalDensity: number // percentage
}

// Flesch-Kincaid Reading Ease Score
function calculateFleschKincaid(words: number, sentences: number, syllables: number): number {
  if (sentences === 0 || words === 0) return 0
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
}

// Count syllables in a word (approximation)
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '')
  if (word.length <= 3) return 1

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
  word = word.replace(/^y/, '')

  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? matches.length : 1
}

// Simple sentiment analysis based on word lists
const positiveWords = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy',
  'joy', 'beautiful', 'perfect', 'best', 'awesome', 'brilliant', 'success', 'win',
  'helpful', 'positive', 'incredible', 'outstanding', 'superb', 'delightful', 'pleasant'
])

const negativeWords = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'fail', 'poor',
  'worst', 'ugly', 'wrong', 'broken', 'problem', 'error', 'issue', 'difficult',
  'negative', 'disappointing', 'frustrating', 'annoying', 'painful', 'useless'
])

function analyzeSentiment(words: string[]): { sentiment: 'positive' | 'negative' | 'neutral', score: number } {
  let positiveCount = 0
  let negativeCount = 0

  words.forEach(word => {
    const lower = word.toLowerCase()
    if (positiveWords.has(lower)) positiveCount++
    if (negativeWords.has(lower)) negativeCount++
  })

  const total = positiveCount + negativeCount
  if (total === 0) return { sentiment: 'neutral', score: 0 }

  const score = (positiveCount - negativeCount) / total

  if (score > 0.1) return { sentiment: 'positive', score }
  if (score < -0.1) return { sentiment: 'negative', score }
  return { sentiment: 'neutral', score }
}

function getReadabilityGrade(score: number): string {
  if (score >= 90) return '5th Grade (Very Easy)'
  if (score >= 80) return '6th Grade (Easy)'
  if (score >= 70) return '7th Grade (Fairly Easy)'
  if (score >= 60) return '8th-9th Grade (Standard)'
  if (score >= 50) return '10th-12th Grade (Fairly Difficult)'
  if (score >= 30) return 'College (Difficult)'
  return 'College Graduate (Very Difficult)'
}

export function analyzeText(text: string): TextAnalysisResult {
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length

  // Split into words
  const words = text.match(/\b[a-zA-Z]+\b/g) || []
  const wordCount = words.length

  // Count sentences (ends with . ! ?)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length

  // Count paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  const paragraphCount = Math.max(paragraphs.length, 1)

  // Calculate syllables
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0)

  // Average calculations
  const avgWordLength = wordCount > 0 ? words.reduce((sum, w) => sum + w.length, 0) / wordCount : 0
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0

  // Reading/speaking time (avg 200 wpm reading, 150 wpm speaking)
  const readingTime = Math.ceil(wordCount / 200)
  const speakingTime = Math.ceil(wordCount / 150)

  // Readability
  const readabilityScore = Math.max(0, Math.min(100, calculateFleschKincaid(wordCount, sentenceCount, totalSyllables)))
  const readabilityGrade = getReadabilityGrade(readabilityScore)

  // Sentiment
  const { sentiment, score: sentimentScore } = analyzeSentiment(words)

  // Word frequency
  const wordFrequency: Record<string, number> = {}
  words.forEach(word => {
    const lower = word.toLowerCase()
    wordFrequency[lower] = (wordFrequency[lower] || 0) + 1
  })

  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  const uniqueWords = Object.keys(wordFrequency).length
  const lexicalDensity = wordCount > 0 ? (uniqueWords / wordCount) * 100 : 0

  return {
    characterCount: characters,
    characterCountNoSpaces: charactersNoSpaces,
    wordCount,
    sentenceCount,
    paragraphCount,
    averageWordLength: Math.round(avgWordLength * 10) / 10,
    averageSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    readingTime,
    speakingTime,
    readabilityScore: Math.round(readabilityScore * 10) / 10,
    readabilityGrade,
    sentiment,
    sentimentScore: Math.round(sentimentScore * 100) / 100,
    topWords,
    uniqueWords,
    lexicalDensity: Math.round(lexicalDensity * 10) / 10
  }
}

// Hash generation
import { createHash } from 'crypto'

export interface HashResult {
  md5: string
  sha1: string
  sha256: string
  sha512: string
}

export function generateHashes(input: string | Buffer): HashResult {
  return {
    md5: createHash('md5').update(input).digest('hex'),
    sha1: createHash('sha1').update(input).digest('hex'),
    sha256: createHash('sha256').update(input).digest('hex'),
    sha512: createHash('sha512').update(input).digest('hex')
  }
}

// Password generator
export interface PasswordOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeAmbiguous: boolean
}

export function generatePassword(options: PasswordOptions): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const ambiguous = 'Il1O0'

  let chars = ''
  if (options.includeUppercase) chars += uppercase
  if (options.includeLowercase) chars += lowercase
  if (options.includeNumbers) chars += numbers
  if (options.includeSymbols) chars += symbols

  if (options.excludeAmbiguous) {
    chars = chars.split('').filter(c => !ambiguous.includes(c)).join('')
  }

  if (chars.length === 0) chars = lowercase + numbers

  let password = ''
  const array = new Uint32Array(options.length)
  crypto.getRandomValues(array)

  for (let i = 0; i < options.length; i++) {
    password += chars[array[i] % chars.length]
  }

  return password
}

// Diff checker
export interface DiffResult {
  additions: number
  deletions: number
  changes: Array<{
    type: 'add' | 'remove' | 'same'
    line: number
    content: string
  }>
}

export function compareDiff(text1: string, text2: string): DiffResult {
  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')

  const changes: DiffResult['changes'] = []
  let additions = 0
  let deletions = 0

  const maxLen = Math.max(lines1.length, lines2.length)

  for (let i = 0; i < maxLen; i++) {
    const line1 = lines1[i]
    const line2 = lines2[i]

    if (line1 === undefined) {
      changes.push({ type: 'add', line: i + 1, content: line2 })
      additions++
    } else if (line2 === undefined) {
      changes.push({ type: 'remove', line: i + 1, content: line1 })
      deletions++
    } else if (line1 !== line2) {
      changes.push({ type: 'remove', line: i + 1, content: line1 })
      changes.push({ type: 'add', line: i + 1, content: line2 })
      additions++
      deletions++
    } else {
      changes.push({ type: 'same', line: i + 1, content: line1 })
    }
  }

  return { additions, deletions, changes }
}
