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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
      <span className="text-xs text-white/50">
        {isThinking ? t('thinking', language) : t('streaming', language)}
      </span>
      <span className="flex gap-0.5">
        <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
        <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]" />
        <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
      </span>
    </div>
  )
}
