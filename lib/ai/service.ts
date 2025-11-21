// Main AI Service - Orchestrates all AI operations

import { OpenAIProvider } from './providers/openai'
import { AICache, AIRateLimiter } from './providers/base'
import prisma from '@/lib/db/prisma'

// Initialize providers and utilities
const openai = new OpenAIProvider()
const cache = new AICache()
const rateLimiter = new AIRateLimiter(100, 60000) // 100 requests per minute

// Cost tracking
const COST_PER_1K_TOKENS = {
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4-vision-preview': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'text-embedding-3-small': { input: 0.00002, output: 0 },
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = COST_PER_1K_TOKENS[model as keyof typeof COST_PER_1K_TOKENS] || { input: 0.01, output: 0.03 }
  return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output
}

async function logAIUsage(
  userId: string,
  operation: string,
  model: string,
  tokensInput: number,
  tokensOutput: number,
  cached: boolean,
  latencyMs: number
) {
  const cost = calculateCost(model, tokensInput, tokensOutput)

  await prisma.aIUsage.create({
    data: {
      user_id: userId,
      operation,
      model,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      cost,
      cached,
      latency_ms: latencyMs,
    },
  })
}

// ==================== AI OPERATIONS ====================

export interface SummarizeOptions {
  length?: 'short' | 'medium' | 'long'
  language?: string
  format?: 'bullets' | 'paragraph'
}

export async function summarizeDocument(
  userId: string,
  text: string,
  options: SummarizeOptions = {}
): Promise<{ summary: string; cached: boolean }> {
  // Check rate limit
  if (!rateLimiter.canMakeRequest(userId)) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }

  // Check cache
  const cacheKey = cache.generateKey('summarize', `${text.substring(0, 500)}:${JSON.stringify(options)}`)
  const cached = cache.get(cacheKey)
  if (cached) {
    return { summary: cached, cached: true }
  }

  const lengthInstructions = {
    short: '2-3 sentences',
    medium: '1 paragraph (4-6 sentences)',
    long: '2-3 paragraphs',
  }

  const formatInstructions = options.format === 'bullets'
    ? 'Use bullet points.'
    : 'Write in paragraph form.'

  const prompt = `Summarize the following text in ${lengthInstructions[options.length || 'medium']}. ${formatInstructions}
${options.language ? `Write the summary in ${options.language}.` : ''}

TEXT:
${text.substring(0, 15000)}`

  const startTime = Date.now()
  rateLimiter.recordRequest(userId)

  const result = await openai.complete([
    { role: 'system', content: 'You are a helpful assistant that creates clear, accurate summaries.' },
    { role: 'user', content: prompt },
  ])

  const latency = Date.now() - startTime

  // Log usage
  await logAIUsage(userId, 'summarize', result.model, result.tokensUsed.input, result.tokensUsed.output, false, latency)

  // Cache result
  cache.set(cacheKey, result.content)

  return { summary: result.content, cached: false }
}

export interface TranslateOptions {
  sourceLanguage?: string
  targetLanguage: string
  preserveFormatting?: boolean
}

export async function translateText(
  userId: string,
  text: string,
  options: TranslateOptions
): Promise<{ translation: string; cached: boolean }> {
  if (!rateLimiter.canMakeRequest(userId)) {
    throw new Error('Rate limit exceeded.')
  }

  const cacheKey = cache.generateKey('translate', `${text.substring(0, 500)}:${options.targetLanguage}`)
  const cached = cache.get(cacheKey)
  if (cached) {
    return { translation: cached, cached: true }
  }

  const prompt = `Translate the following text to ${options.targetLanguage}.
${options.sourceLanguage ? `The source language is ${options.sourceLanguage}.` : ''}
${options.preserveFormatting ? 'Preserve the original formatting and structure.' : ''}

TEXT:
${text.substring(0, 15000)}`

  const startTime = Date.now()
  rateLimiter.recordRequest(userId)

  const result = await openai.complete([
    { role: 'system', content: 'You are a professional translator. Translate accurately while maintaining the original meaning and tone.' },
    { role: 'user', content: prompt },
  ])

  const latency = Date.now() - startTime
  await logAIUsage(userId, 'translate', result.model, result.tokensUsed.input, result.tokensUsed.output, false, latency)

  cache.set(cacheKey, result.content)

  return { translation: result.content, cached: false }
}

export interface ExtractOptions {
  fields?: string[]
  format?: 'json' | 'text'
}

export async function extractData(
  userId: string,
  text: string,
  documentType: 'invoice' | 'contract' | 'resume' | 'receipt' | 'general',
  options: ExtractOptions = {}
): Promise<{ data: any; cached: boolean }> {
  if (!rateLimiter.canMakeRequest(userId)) {
    throw new Error('Rate limit exceeded.')
  }

  const fieldPrompts = {
    invoice: 'vendor name, invoice number, date, due date, line items (description, quantity, unit price, total), subtotal, tax, total amount, payment terms',
    contract: 'parties involved, effective date, termination date, key terms, obligations, payment terms, governing law, signatures',
    resume: 'name, email, phone, address, summary, work experience (company, title, dates, responsibilities), education, skills, certifications',
    receipt: 'merchant name, date, items purchased, subtotal, tax, total, payment method',
    general: options.fields?.join(', ') || 'all relevant information',
  }

  const prompt = `Extract the following information from this ${documentType}: ${fieldPrompts[documentType]}

Return the data as a JSON object with clear field names.

DOCUMENT:
${text.substring(0, 15000)}`

  const startTime = Date.now()
  rateLimiter.recordRequest(userId)

  const result = await openai.complete([
    { role: 'system', content: 'You are a data extraction specialist. Extract information accurately and return valid JSON.' },
    { role: 'user', content: prompt },
  ], { temperature: 0.1 })

  const latency = Date.now() - startTime
  await logAIUsage(userId, `extract_${documentType}`, result.model, result.tokensUsed.input, result.tokensUsed.output, false, latency)

  // Parse JSON from response
  let data
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    data = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.content }
  } catch {
    data = { raw: result.content }
  }

  return { data, cached: false }
}

export async function analyzeContract(
  userId: string,
  text: string
): Promise<{ analysis: any; cached: boolean }> {
  if (!rateLimiter.canMakeRequest(userId)) {
    throw new Error('Rate limit exceeded.')
  }

  const prompt = `Analyze this contract and provide:
1. Summary (2-3 sentences)
2. Key parties and their roles
3. Important dates (effective date, termination, renewal)
4. Key obligations for each party
5. Payment terms
6. Potential risks or concerns
7. Non-standard or unusual clauses
8. Recommended review points

CONTRACT:
${text.substring(0, 15000)}`

  const startTime = Date.now()
  rateLimiter.recordRequest(userId)

  const result = await openai.complete([
    { role: 'system', content: 'You are a legal document analyst. Provide thorough, accurate analysis of contracts.' },
    { role: 'user', content: prompt },
  ], { temperature: 0.2 })

  const latency = Date.now() - startTime
  await logAIUsage(userId, 'analyze_contract', result.model, result.tokensUsed.input, result.tokensUsed.output, false, latency)

  return { analysis: { content: result.content }, cached: false }
}

export async function chatWithDocument(
  userId: string,
  documentText: string,
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{ answer: string; cached: boolean }> {
  if (!rateLimiter.canMakeRequest(userId)) {
    throw new Error('Rate limit exceeded.')
  }

  const systemPrompt = `You are a helpful assistant answering questions about a document. Base your answers only on the document content provided. If the answer is not in the document, say so.

DOCUMENT:
${documentText.substring(0, 12000)}`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    { role: 'user' as const, content: question },
  ]

  const startTime = Date.now()
  rateLimiter.recordRequest(userId)

  const result = await openai.complete(messages, { temperature: 0.3 })

  const latency = Date.now() - startTime
  await logAIUsage(userId, 'document_chat', result.model, result.tokensUsed.input, result.tokensUsed.output, false, latency)

  return { answer: result.content, cached: false }
}

export async function ocrImage(
  userId: string,
  imageBase64: string
): Promise<{ text: string; cached: boolean }> {
  if (!rateLimiter.canMakeRequest(userId)) {
    throw new Error('Rate limit exceeded.')
  }

  const prompt = `Extract all text from this image. Maintain the original structure and formatting as much as possible. If there are tables, represent them clearly. Include all visible text.`

  const startTime = Date.now()
  rateLimiter.recordRequest(userId)

  const result = await openai.completeWithVision(prompt, { imageBase64 })

  const latency = Date.now() - startTime
  await logAIUsage(userId, 'ocr', result.model, result.tokensUsed.input, result.tokensUsed.output, false, latency)

  return { text: result.content, cached: false }
}

export async function rewriteText(
  userId: string,
  text: string,
  style: 'professional' | 'casual' | 'formal' | 'simple' | 'concise'
): Promise<{ rewritten: string; cached: boolean }> {
  if (!rateLimiter.canMakeRequest(userId)) {
    throw new Error('Rate limit exceeded.')
  }

  const styleInstructions = {
    professional: 'Rewrite in a professional business tone.',
    casual: 'Rewrite in a friendly, casual tone.',
    formal: 'Rewrite in a formal, academic tone.',
    simple: 'Simplify the language for easier understanding.',
    concise: 'Make the text more concise while keeping the meaning.',
  }

  const prompt = `${styleInstructions[style]}

Original text:
${text.substring(0, 10000)}`

  const startTime = Date.now()
  rateLimiter.recordRequest(userId)

  const result = await openai.complete([
    { role: 'system', content: 'You are a skilled editor who rewrites text while preserving meaning.' },
    { role: 'user', content: prompt },
  ])

  const latency = Date.now() - startTime
  await logAIUsage(userId, 'rewrite', result.model, result.tokensUsed.input, result.tokensUsed.output, false, latency)

  return { rewritten: result.content, cached: false }
}

// Get AI usage statistics
export async function getAIUsageStats(userId: string, days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const usage = await prisma.aIUsage.findMany({
    where: {
      user_id: userId,
      created_at: { gte: startDate },
    },
    orderBy: { created_at: 'desc' },
  })

  const totalCost = usage.reduce((sum, u) => sum + Number(u.cost), 0)
  const totalTokens = usage.reduce((sum, u) => sum + u.tokens_input + u.tokens_output, 0)

  const byOperation: Record<string, { count: number; cost: number }> = {}
  usage.forEach(u => {
    if (!byOperation[u.operation]) {
      byOperation[u.operation] = { count: 0, cost: 0 }
    }
    byOperation[u.operation].count++
    byOperation[u.operation].cost += Number(u.cost)
  })

  return {
    totalRequests: usage.length,
    totalCost: Math.round(totalCost * 100) / 100,
    totalTokens,
    byOperation,
    recentUsage: usage.slice(0, 20),
  }
}
