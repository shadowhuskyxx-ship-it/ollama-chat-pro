export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export type Conversation = {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: number
  updatedAt: number
}

export type OllamaModel = {
  name: string
  size: number
  digest: string
  modified_at: string
  details?: {
    family: string
    parameter_size: string
    quantization_level: string
  }
}

export type ThinkingState = 'idle' | 'thinking' | 'streaming'

export type Language = 'en' | 'zh'
