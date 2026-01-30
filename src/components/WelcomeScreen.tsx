'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Zap, Brain, MessageSquare } from 'lucide-react'
import { Language } from '@/types'
import { t } from '@/lib/i18n'

interface WelcomeScreenProps {
  language: Language
  onSuggestionClick: (text: string) => void
}

const suggestions = {
  en: [
    { icon: '💡', text: 'Explain quantum computing simply' },
    { icon: '🎨', text: 'Write a creative short story' },
    { icon: '💻', text: 'Help me debug my code' },
    { icon: '🌍', text: 'What are the latest tech trends?' },
  ],
  zh: [
    { icon: '💡', text: '用简单的话解释量子计算' },
    { icon: '🎨', text: '写一个创意小故事' },
    { icon: '💻', text: '帮我调试代码' },
    { icon: '🌍', text: '最新的科技趋势是什么？' },
  ],
}

export default function WelcomeScreen({ language, onSuggestionClick }: WelcomeScreenProps) {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const features = [
    { icon: <Zap className="w-5 h-5" />, text: language === 'en' ? 'Lightning fast' : '极速响应' },
    { icon: <Brain className="w-5 h-5" />, text: language === 'en' ? 'Smart & capable' : '智能强大' },
    { icon: <MessageSquare className="w-5 h-5" />, text: language === 'en' ? 'Natural chat' : '自然对话' },
  ]

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [features.length])

  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[60vh] px-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated logo */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 blur-xl opacity-50 animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center glow-strong">
          <span className="text-4xl animate-bounce">⚡</span>
        </div>
        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
      </div>

      {/* Title with glow */}
      <h1 className="text-2xl font-bold text-white mb-2 glow-text">
        {t('title', language)}
      </h1>

      {/* Rotating features */}
      <div className="h-8 mb-8 overflow-hidden">
        <div 
          className="transition-transform duration-500 ease-out"
          style={{ transform: `translateY(-${currentFeature * 2}rem)` }}
        >
          {features.map((feature, i) => (
            <div key={i} className="h-8 flex items-center gap-2 text-white/50">
              <span className="text-indigo-400">{feature.icon}</span>
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {suggestions[language].map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all duration-300 group text-left"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <span className="text-lg group-hover:scale-125 transition-transform">{suggestion.icon}</span>
            <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">{suggestion.text}</span>
          </button>
        ))}
      </div>

      {/* Fun hint */}
      <p className="mt-8 text-xs text-white/20">
        {language === 'en' ? '💡 Try the Konami code for a surprise!' : '💡 试试科乐美秘技有惊喜！'}
      </p>
    </div>
  )
}
