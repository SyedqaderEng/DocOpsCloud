// OpenAI Provider Implementation

import { BaseAIProvider, AIMessage, AICompletionOptions, AICompletionResult, AIEmbeddingResult, AIVisionOptions } from './base'

export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey?: string) {
    super(
      apiKey || process.env.OPENAI_API_KEY || '',
      'https://api.openai.com/v1'
    )
  }

  async complete(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResult> {
    const model = options?.model || 'gpt-4-turbo-preview'

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature ?? 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const choice = data.choices[0]

    return {
      content: choice.message.content,
      tokensUsed: {
        input: data.usage.prompt_tokens,
        output: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      model: data.model,
      finishReason: choice.finish_reason,
    }
  }

  async completeWithVision(prompt: string, options: AIVisionOptions): Promise<AICompletionResult> {
    const model = options?.model || 'gpt-4-vision-preview'

    const content: any[] = [{ type: 'text', text: prompt }]

    if (options.imageUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: options.imageUrl },
      })
    } else if (options.imageBase64) {
      content.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${options.imageBase64}` },
      })
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        max_tokens: options?.maxTokens || 4096,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI Vision API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    const choice = data.choices[0]

    return {
      content: choice.message.content,
      tokensUsed: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      },
      model: data.model,
      finishReason: choice.finish_reason,
    }
  }

  async embed(texts: string[]): Promise<AIEmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: texts,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI Embeddings API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()

    return {
      embeddings: data.data.map((d: any) => d.embedding),
      tokensUsed: data.usage.total_tokens,
      model: data.model,
    }
  }

  // Specialized methods
  async transcribe(audioBuffer: Buffer, language?: string): Promise<{ text: string; duration: number }> {
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer]), 'audio.mp3')
    formData.append('model', 'whisper-1')
    if (language) formData.append('language', language)

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI Whisper API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return { text: data.text, duration: data.duration || 0 }
  }
}

export const openai = new OpenAIProvider()
