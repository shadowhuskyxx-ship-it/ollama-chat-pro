'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Menu, Trash2 } from 'lucide-react'
import clsx from 'clsx'

import Sidebar from '@/components/Sidebar'
import ChatMessage from '@/components/ChatMessage'
import ModelSelector from '@/components/ModelSelector'
import LanguageToggle from '@/components/LanguageToggle'
import ThinkingIndicator from '@/components/ThinkingIndicator'
import MarkdownRenderer from '@/components/MarkdownRenderer'

import { Message, Conversation, OllamaModel, ThinkingState, Language } from '@/types'
import { t, detectLanguage } from '@/lib/i18n'
import {
  generateId,
  getConversations,
  saveConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  addMessage,
} from '@/lib/storage'

export default function Chat() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [thinkingState, setThinkingState] = useState<ThinkingState>('idle')
  const [streamingContent, setStreamingContent] = useState('')
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [modelsLoading, setModelsLoading] = useState(true)
  const [language, setLanguage] = useState<Language>('en')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === currentConversationId)
  const messages = currentConversation?.messages || []

  // Initialize
  useEffect(() => {
    // Detect language
    setLanguage(detectLanguage())

    // Load conversations
    const saved = getConversations()
    setConversations(saved)

    // Fetch models
    fetchModels()
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Close model selector on outside click
  useEffect(() => {
    const handleClick = () => setModelSelectorOpen(false)
    if (modelSelectorOpen) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [modelSelectorOpen])

  const fetchModels = async () => {
    setModelsLoading(true)
    try {
      const res = await fetch('/api/models')
      const data = await res.json()
      setModels(data)
      if (data.length > 0 && !selectedModel) {
        setSelectedModel(data[0].name)
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setModelsLoading(false)
    }
  }

  const handleNewConversation = useCallback(() => {
    if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].name)
    }
    const conv = createConversation(selectedModel || models[0]?.name || 'llama2')
    setConversations(getConversations())
    setCurrentConversationId(conv.id)
    setStreamingContent('')
    inputRef.current?.focus()
  }, [selectedModel, models])

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id)
    setStreamingContent('')
    const conv = conversations.find(c => c.id === id)
    if (conv) {
      setSelectedModel(conv.model)
    }
  }, [conversations])

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id)
    setConversations(getConversations())
    if (currentConversationId === id) {
      setCurrentConversationId(null)
      setStreamingContent('')
    }
  }, [currentConversationId])

  const handleClearChat = useCallback(() => {
    if (currentConversationId && confirm(t('confirmDelete', language))) {
      updateConversation(currentConversationId, { messages: [], title: 'New Chat' })
      setConversations(getConversations())
      setStreamingContent('')
    }
  }, [currentConversationId, language])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || thinkingState !== 'idle') return

    // Create new conversation if none selected
    let convId = currentConversationId
    if (!convId) {
      const conv = createConversation(selectedModel || models[0]?.name || 'llama2')
      convId = conv.id
      setCurrentConversationId(convId)
      setConversations(getConversations())
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    addMessage(convId, userMessage)
    setConversations(getConversations())
    setInput('')
    setThinkingState('thinking')
    setStreamingContent('')

    try {
      const conv = getConversations().find(c => c.id === convId)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conv?.messages.map(m => ({ role: m.role, content: m.content })) || [],
          model: selectedModel || models[0]?.name || 'llama2',
          language,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      setThinkingState('streaming')
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        fullContent += text
        setStreamingContent(fullContent)
      }

      // Save assistant message
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      }
      addMessage(convId, assistantMessage)
      setConversations(getConversations())
      setStreamingContent('')
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: t('errorOccurred', language),
        timestamp: Date.now(),
      }
      addMessage(convId, errorMessage)
      setConversations(getConversations())
      setStreamingContent('')
    } finally {
      setThinkingState('idle')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentId={currentConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        language={language}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/20 text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {t('title', language)}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
                isLoading={modelsLoading}
                language={language}
                isOpen={modelSelectorOpen}
                onToggle={() => setModelSelectorOpen(!modelSelectorOpen)}
              />
            </div>
            <LanguageToggle
              language={language}
              onToggle={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
            />
            {currentConversationId && messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('clearChat', language)}</span>
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-4xl">🤖</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {t('title', language)}
                  </h2>
                  <p className="text-gray-600">
                    {language === 'en' 
                      ? 'Start a conversation with your local AI'
                      : '开始与本地AI对话'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className="message-enter">
                    <ChatMessage message={message} uiLanguage={language} />
                  </div>
                ))}
                {streamingContent && (
                  <div className="message-enter flex gap-4 px-4 py-6 bg-white/30">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      🤖
                    </div>
                    <div className="flex-1 min-w-0 prose prose-gray max-w-none">
                      <MarkdownRenderer content={streamingContent} uiLanguage={language} />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Thinking indicator */}
        {thinkingState !== 'idle' && (
          <div className="flex justify-center py-3">
            <ThinkingIndicator state={thinkingState} language={language} />
          </div>
        )}

        {/* Input area */}
        <div className="p-4 border-t border-white/10 bg-white/10 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('typeMessage', language)}
                  disabled={thinkingState !== 'idle'}
                  rows={1}
                  className={clsx(
                    "w-full px-4 py-3 rounded-2xl resize-none",
                    "bg-white/60 backdrop-blur-md border border-white/20",
                    "focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50",
                    "placeholder-gray-500 text-gray-800",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all"
                  )}
                  style={{ minHeight: '48px', maxHeight: '200px' }}
                />
              </div>
              <button
                type="submit"
                disabled={thinkingState !== 'idle' || !input.trim()}
                className={clsx(
                  "flex-shrink-0 p-3 rounded-2xl",
                  "bg-gradient-to-r from-purple-500 to-pink-500",
                  "text-white shadow-lg",
                  "hover:from-purple-600 hover:to-pink-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
