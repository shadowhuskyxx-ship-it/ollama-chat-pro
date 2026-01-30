'use client'

import { Brain, MessageSquare } from 'lucide-react'
import { ThinkingState, Language } from '@/types'
import { t } from '@/lib/i18n'
import clsx from 'clsx'

interface ThinkingIndicatorProps {
  state: ThinkingState
  language: Language
}

export default function ThinkingIndicator({ state, language }: ThinkingIndicatorProps) {
  if (state === 'idle') return null

  const isThinking = state === 'thinking'

  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-lg">
      <div className={clsx(
        "p-2 rounded-full",
        isThinking ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
      )}>
        {isThinking ? (
          <Brain className="w-5 h-5 animate-pulse" />
        ) : (
          <MessageSquare className="w-5 h-5" />
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium text-gray-700">
          {isThinking ? t('thinking', language) : t('streaming', language)}
        </span>
        <span className="flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        </span>
      </div>
    </div>
  )
}
