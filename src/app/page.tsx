'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, Trash2, Plus, X } from 'lucide-react'
import clsx from 'clsx'

import Particles from '@/components/Particles'
import EasterEgg from '@/components/EasterEgg'
import WelcomeScreen from '@/components/WelcomeScreen'
import ChatMessage from '@/components/ChatMessage'
import ModelSelector from '@/components/ModelSelector'
import LanguageToggle from '@/components/LanguageToggle'
import ThinkingIndicator from '@/components/ThinkingIndicator'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import SendButton from '@/components/SendButton'

import { Message, Conversation, OllamaModel, ThinkingState, Language } from '@/types'
import { t, detectLanguage, saveLanguage } from '@/lib/i18n'
import {
  generateId,
  getConversations,
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
    const welcomeMsg = t('welcomeMessage', language)
    const conv = createConversation(selectedModel || models[0]?.name || 'llama2', welcomeMsg)
    setConversations(getConversations())
    setCurrentConversationId(conv.id)
    setStreamingContent('')
    setSidebarOpen(false)
    inputRef.current?.focus()
  }, [selectedModel, models, language])

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

  const handleSuggestionClick = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || thinkingState !== 'idle') return

    let convId = currentConversationId
    if (!convId) {
      // Don't add welcome message when user initiates the chat
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
    <div className="flex h-screen overflow-hidden animated-bg">
      {/* Background effects */}
      <Particles />
      <EasterEgg />

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col",
        "bg-black/90 backdrop-blur-xl border-r border-white/5",
        "transform transition-transform duration-300 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm font-medium text-white/60">{t('conversations', language)}</span>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-1 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleNewConversation}
          className="mx-3 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/20 text-white/80 text-sm transition-all duration-300"
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
                "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200",
                currentConversationId === conv.id
                  ? "bg-indigo-500/20 text-white border border-indigo-500/30"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <span className="flex-1 truncate">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteConversation(conv.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={handleNewConversation}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 transition-colors hover:text-indigo-400"
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
              onToggle={() => {
                const newLang = language === 'en' ? 'zh' : 'en'
                setLanguage(newLang)
                saveLanguage(newLang)
              }}
            />
            {currentConversationId && messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
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
              <WelcomeScreen language={language} onSuggestionClick={handleSuggestionClick} />
            ) : (
              <div className="py-4 space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} uiLanguage={language} />
                ))}
                {streamingContent && (
                  <div className="message-assistant">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm flex-shrink-0 glow">
                        ⚡
                      </div>
                      <div className="flex-1 min-w-0 text-white/90 text-sm leading-relaxed glass-card rounded-2xl px-4 py-3 bg-indigo-500/5 border-indigo-500/10">
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
        <div className="p-3 border-t border-white/5 bg-black/20 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
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
                    "w-full px-4 py-3 rounded-xl resize-none text-sm",
                    "bg-white/5 border border-white/10",
                    "focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20",
                    "placeholder-white/30 text-white",
                    "disabled:opacity-50 transition-all duration-300"
                  )}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                {/* Shimmer effect on focus */}
                <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 focus-within:opacity-100 shimmer" />
              </div>
              <SendButton disabled={thinkingState !== 'idle' || !input.trim()} />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
