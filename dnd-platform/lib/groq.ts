import Groq from 'groq-sdk'
import type { AIRequest, AIResponse } from './aiTypes'

export type { AIMessage, AIRequest, AIResponse } from './aiTypes'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY!
})

// Configuration from environment or defaults
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const FAST_MODEL = process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant'
const DEFAULT_MAX_TOKENS = parseInt(process.env.GROQ_MAX_TOKENS || '800', 10)

async function callGroqModel(model: string, defaultTokens: number, req: AIRequest, fallbackModel?: string): Promise<AIResponse> {
  try {
    const response = await client.chat.completions.create({
      model: req.model || model,
      max_tokens: req.maxTokens || defaultTokens,
      messages: [
        { role: 'system', content: req.system },
        ...req.messages.map(m => ({ role: m.role, content: m.content }))
      ]
    })

    const content = response.choices[0]?.message?.content || ''

    return {
      content,
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      status: 200
    }
  } catch (error: any) {
    console.error('Groq API Error:', error)

    if (error.status === 429) {
      if (fallbackModel) {
        console.warn(`Rate limited on ${model}, falling back to ${fallbackModel}`)
        return callGroqModel(fallbackModel, defaultTokens, req)
      }

      const retryAfter = error.headers?.['retry-after']
        ? parseInt(error.headers['retry-after'], 10)
        : undefined

      return {
        content: '',
        inputTokens: 0,
        outputTokens: 0,
        error: 'AI rate limit exceeded. Please wait a moment.',
        status: 429,
        retryAfter
      }
    }

    return {
      content: '',
      inputTokens: 0,
      outputTokens: 0,
      error: error.message || 'Unknown AI error',
      status: error.status || 500
    }
  }
}

export const callGroq     = (req: AIRequest) => callGroqModel(DEFAULT_MODEL, DEFAULT_MAX_TOKENS, req, FAST_MODEL)
export const callGroqFast = (req: AIRequest) => callGroqModel(FAST_MODEL, 500, req)