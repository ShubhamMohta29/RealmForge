export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIRequest {
  system: string
  messages: AIMessage[]
  maxTokens?: number
  model?: string
}

export interface AIResponse {
  content: string
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
  error?: string
  status?: number
  retryAfter?: number
}
