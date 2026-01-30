'use client'

import { User } from 'lucide-react'
import MarkdownRenderer from './MarkdownRenderer'
import { Message, Language } from '@/types'
import clsx from 'clsx'

interface ChatMessageProps {
  message: Message
  uiLanguage: Language
}

export default function ChatMessage({ message, uiLanguage }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className="flex gap-3">
      <div className={clsx(
        "w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0",
        isUser 
          ? "bg-white/10 text-white/60" 
          : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
      )}>
        {isUser ? <User className="w-3.5 h-3.5" /> : '⚡'}
      </div>
      <div className={clsx(
        "flex-1 min-w-0 text-sm leading-relaxed",
        isUser ? "text-white/70" : "text-white/90"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} uiLanguage={uiLanguage} />
        )}
      </div>
    </div>
  )
}
