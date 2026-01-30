'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Plus, Trash2, Send, ChevronDown, X, MessageSquare, Sparkles, Zap, Brain, Code, PenTool } from 'lucide-react'
import { cn } from '@/lib/utils'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import { Message, Conversation, OllamaModel, ThinkingState, Language } from '@/types'
import { t, detectLanguage, saveLanguage } from '@/lib/i18n'
import {
  generateId,
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  addMessage,
  formatBytes,
} from '@/lib/storage'

const suggestions = {
  en: [
    { icon: <Zap className="w-4 h-4" />, text: 'Explain quantum computing simply' },
    { icon: <PenTool className="w-4 h-4" />, text: 'Write a creative short story' },
    { icon: <Code className="w-4 h-4" />, text: 'Help me debug my code' },
    { icon: <Brain className="w-4 h-4" />, text: 'What are the latest tech trends?' },
  ],
  zh: [
    { icon: <Zap className="w-4 h-4" />, text: '用简单的话解释量子计算' },
    { icon: <PenTool className="w-4 h-4" />, text: '写一个创意小故事' },
    { icon: <Code className="w-4 h-4" />, text: '帮我调试代码' },
    { icon: <Brain className="w-4 h-4" />, text: '最新的科技趋势是什么？' },
  ],
}

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
  const [modelOpen, setModelOpen] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [konamiProgress, setKonamiProgress] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentConversation = conversations.find(c => c.id === currentConversationId)
  const messages = currentConversation?.messages || []

  // Konami code easter egg
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === konamiCode[konamiProgress]) {
        const next = konamiProgress + 1
        setKonamiProgress(next)
        if (next === konamiCode.length) {
          setConfetti(true)
          setTimeout(() => setConfetti(false), 4000)
          setKonamiProgress(0)
        }
      } else {
        setKonamiProgress(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [konamiProgress])

  useEffect(() => {
    setLanguage(detectLanguage())
    setConversations(getConversations())
    fetchModels()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models')
      const data = await res.json()
      setModels(data)
      if (data.length > 0) setSelectedModel(data[0].name)
    } catch (e) {
      console.error(e)
    } finally {
      setModelsLoading(false)
    }
  }

  const handleNewChat = useCallback(() => {
    const welcomeMsg = t('welcomeMessage', language)
    const conv = createConversation(selectedModel || 'llama2', welcomeMsg)
    setConversations(getConversations())
    setCurrentConversationId(conv.id)
    setSidebarOpen(false)
  }, [selectedModel, language])

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id)
    const conv = conversations.find(c => c.id === id)
    if (conv) setSelectedModel(conv.model)
    setSidebarOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteConversation(id)
    setConversations(getConversations())
    if (currentConversationId === id) setCurrentConversationId(null)
  }

  const handleSuggestionClick = (text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || thinkingState !== 'idle') return

    let convId = currentConversationId
    if (!convId) {
      const conv = createConversation(selectedModel || 'llama2')
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

    try {
      const conv = getConversations().find(c => c.id === convId)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conv?.messages.map(m => ({ role: m.role, content: m.content })) || [],
          model: selectedModel,
          language,
        }),
      })

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      setThinkingState('streaming')
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += new TextDecoder().decode(value)
        setStreamingContent(content)
      }

      addMessage(convId, { id: generateId(), role: 'assistant', content, timestamp: Date.now() })
      setConversations(getConversations())
      setStreamingContent('')
    } catch (e) {
      addMessage(convId, { id: generateId(), role: 'assistant', content: t('errorOccurred', language), timestamp: Date.now() })
      setConversations(getConversations())
    } finally {
      setThinkingState('idle')
      setStreamingContent('')
    }
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Confetti Easter Egg */}
      <AnimatePresence>
        {confetti && (
          <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), opacity: 1, rotate: 0 }}
                animate={{ y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 20, rotate: 720 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5 }}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#22c55e', '#eab308', '#3b82f6'][Math.floor(Math.random() * 7)],
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-muted border-r border-border z-50 flex flex-col"
            >
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('conversations', language)}</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-border rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleNewChat}
                className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-border/50 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('newChat', language)}
              </button>

              <div className="flex-1 overflow-auto px-3 space-y-1">
                {conversations.map((conv) => (
                  <motion.div
                    key={conv.id}
                    layoutId={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
                      currentConversationId === conv.id ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-border/50"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(conv.id) }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 flex items-center justify-between px-3 border-b border-border shrink-0">
          <div className="flex items-center gap-1">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg">
              <Menu className="w-4 h-4" />
            </button>
            <button onClick={handleNewChat} className="p-2 hover:bg-muted rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-muted hover:bg-border rounded-lg transition-colors"
              >
                <span className="max-w-20 truncate">{selectedModel?.split(':')[0] || '...'}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", modelOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {modelOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setModelOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-muted border border-border rounded-lg shadow-xl z-50 overflow-hidden"
                    >
                      {models.map((m) => (
                        <button
                          key={m.name}
                          onClick={() => { setSelectedModel(m.name); setModelOpen(false) }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-xs hover:bg-border/50 flex justify-between",
                            selectedModel === m.name && "bg-accent/10 text-accent"
                          )}
                        >
                          <span className="truncate">{m.name}</span>
                          <span className="text-muted-foreground shrink-0 ml-2">{formatBytes(m.size)}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Language */}
            <button
              onClick={() => { const l = language === 'en' ? 'zh' : 'en'; setLanguage(l); saveLanguage(l) }}
              className="p-2 hover:bg-muted rounded-lg text-xs"
            >
              {language === 'en' ? 'EN' : '中'}
            </button>

            {messages.length > 0 && (
              <button
                onClick={() => { if (currentConversationId) { updateConversation(currentConversationId, { messages: [] }); setConversations(getConversations()) }}}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {messages.length === 0 && !streamingContent ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                {/* Logo */}
                <motion.div 
                  className="relative mb-6"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                    <Sparkles className="w-8 h-8 text-accent" />
                  </div>
                </motion.div>

                <h1 className="text-xl font-medium mb-2">{t('title', language)}</h1>
                <p className="text-sm text-muted-foreground mb-8">
                  {language === 'en' ? 'Your private AI assistant' : '你的私人AI助手'}
                </p>

                {/* Suggestions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                  {suggestions[language].map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleSuggestionClick(s.text)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-muted hover:border-accent/30 transition-all text-left group"
                    >
                      <span className="text-muted-foreground group-hover:text-accent transition-colors">{s.icon}</span>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{s.text}</span>
                    </motion.button>
                  ))}
                </div>

                <p className="mt-8 text-xs text-muted-foreground/50">
                  {language === 'en' ? '↑↑↓↓←→←→BA for a surprise 🎮' : '↑↑↓↓←→←→BA 有惊喜 🎮'}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-3", msg.role === 'user' && "justify-end")}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] px-4 py-3 rounded-2xl text-sm",
                        msg.role === 'user' 
                          ? "bg-accent text-accent-foreground rounded-br-md" 
                          : "bg-muted rounded-bl-md"
                      )}>
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <MarkdownRenderer content={msg.content} uiLanguage={language} />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {streamingContent && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-muted text-sm">
                      <MarkdownRenderer content={streamingContent} uiLanguage={language} />
                    </div>
                  </motion.div>
                )}
                
                {thinkingState === 'thinking' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-muted">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-accent rounded-full"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border shrink-0">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }}}
              placeholder={t('typeMessage', language)}
              disabled={thinkingState !== 'idle'}
              rows={1}
              className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 disabled:opacity-50 placeholder:text-muted-foreground"
              style={{ minHeight: 44, maxHeight: 120 }}
            />
            <motion.button
              type="submit"
              disabled={thinkingState !== 'idle' || !input.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-3 bg-accent text-accent-foreground rounded-xl disabled:opacity-30 transition-colors"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  )
}
