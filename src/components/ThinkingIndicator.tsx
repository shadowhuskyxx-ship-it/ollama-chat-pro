'use client'

import { ThinkingState, Language } from '@/types'
import { t } from '@/lib/i18n'

interface ThinkingIndicatorProps {
  state: ThinkingState
  language: Language
}

export default function ThinkingIndicator({ state, language }: ThinkingIndicatorProps) {
  if (state === 'idle') return null

  const isThinking = state === 'thinking'

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 scale-in pulse-glow">
      {/* Animated brain/wave icon */}
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-ping opacity-30" />
        <div className="relative w-full h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
          <span className="text-xs">{isThinking ? '🧠' : '✨'}</span>
        </div>
      </div>
      
      <span className="text-sm text-white/60">
        {isThinking ? t('thinking', language) : t('streaming', language)}
      </span>
      
      {/* Animated dots */}
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full typing-dot" />
        <span className="w-1.5 h-1.5 bg-pink-400 rounded-full typing-dot" />
      </div>
    </div>
  )
}
