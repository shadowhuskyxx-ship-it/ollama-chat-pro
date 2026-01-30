'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Menu, Trash2, Plus, X } from 'lucide-react'
import clsx from 'clsx'

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

  const currentConversation = conversations.find(c => c.id === currentConversationId)
  const messages = currentConversation?.messages || []

  useEffect(() => {
    setLanguage(detectLanguage())
    const saved = getConversations()
    setConversations(saved)
    fetchModels()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

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
    setSidebarOpen(false)
    inputRef.current?.focus()
  }, [selectedModel, models])

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id)
    setStreamingContent('')
    const conv = conversations.find(c => c.id === id)
    if (conv) setSelectedModel(conv.model)
    setSidebarOpen(false)
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
    if (currentConversationId) {
      updateConversation(currentConversationId, { messages: [], title: 'New Chat' })
      setConversations(getConversations())
      setStreamingContent('')
    }
  }, [currentConversationId])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || thinkingState !== 'idle') return

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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col",
        "bg-black/90 backdrop-blur-xl border-r border-white/5",
        "transform transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm font-medium text-white/60">{t('conversations', language)}</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleNewConversation}
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('newChat', language)}
        </button>

        <div className="flex-1 overflow-auto px-3 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={clsx(
                "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                currentConversationId === conv.id
                  ? "bg-indigo-500/20 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteConversation(conv.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={handleNewConversation}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
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
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4">
            {messages.length === 0 && !streamingContent ? (
              <div className="flex items-center justify-center h-full min-h-[60vh]">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <h2 className="text-xl font-light text-white/90 mb-1 glow-text">
                    {t('title', language)}
                  </h2>
                  <p className="text-sm text-white/40">
                    {language === 'en' ? 'Start a conversation' : '开始对话'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="message-enter">
                    <ChatMessage message={message} uiLanguage={language} />
                  </div>
                ))}
                {streamingContent && (
                  <div className="message-enter">
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs flex-shrink-0">
                        ⚡
                      </div>
                      <div className="flex-1 min-w-0 text-white/90 text-sm leading-relaxed">
                        <MarkdownRenderer content={streamingContent} uiLanguage={language} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Thinking */}
        {thinkingState !== 'idle' && (
          <div className="flex justify-center py-2">
            <ThinkingIndicator state={thinkingState} language={language} />
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-white/5 bg-black/40 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('typeMessage', language)}
                disabled={thinkingState !== 'idle'}
                rows={1}
                className={clsx(
                  "flex-1 px-4 py-3 rounded-xl resize-none text-sm",
                  "bg-white/5 border border-white/10",
                  "focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30",
                  "placeholder-white/30 text-white",
                  "disabled:opacity-50 transition-all"
                )}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                type="submit"
                disabled={thinkingState !== 'idle' || !input.trim()}
                className={clsx(
                  "p-3 rounded-xl flex-shrink-0",
                  "bg-indigo-500 hover:bg-indigo-400",
                  "text-white",
                  "disabled:opacity-30 disabled:hover:bg-indigo-500",
                  "transition-all"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
