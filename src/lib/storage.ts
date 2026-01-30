import { Conversation, Message } from '@/types'

const STORAGE_KEY = 'ollama-chat-conversations'

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
}

export function getConversation(id: string): Conversation | undefined {
  const conversations = getConversations()
  return conversations.find(c => c.id === id)
}

export function createConversation(model: string): Conversation {
  const conversation: Conversation = {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    model,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const conversations = getConversations()
  conversations.unshift(conversation)
  saveConversations(conversations)
  return conversation
}

export function updateConversation(id: string, updates: Partial<Conversation>): void {
  const conversations = getConversations()
  const index = conversations.findIndex(c => c.id === id)
  if (index !== -1) {
    conversations[index] = { 
      ...conversations[index], 
      ...updates, 
      updatedAt: Date.now() 
    }
    saveConversations(conversations)
  }
}

export function deleteConversation(id: string): void {
  const conversations = getConversations()
  const filtered = conversations.filter(c => c.id !== id)
  saveConversations(filtered)
}

export function addMessage(conversationId: string, message: Message): void {
  const conversations = getConversations()
  const index = conversations.findIndex(c => c.id === conversationId)
  if (index !== -1) {
    conversations[index].messages.push(message)
    conversations[index].updatedAt = Date.now()
    
    // Update title from first user message
    if (message.role === 'user' && conversations[index].messages.filter(m => m.role === 'user').length === 1) {
      conversations[index].title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
    }
    
    saveConversations(conversations)
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
