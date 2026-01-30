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
    <div className={clsx(
      "flex gap-3",
      isUser ? "message-user" : "message-assistant"
    )}>
      <div className={clsx(
        "w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-transform hover:scale-110",
        isUser 
          ? "bg-white/10 text-white/60 hover:bg-white/20" 
          : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white glow"
      )}>
        {isUser ? <User className="w-4 h-4" /> : '⚡'}
      </div>
      <div className={clsx(
        "flex-1 min-w-0 text-sm leading-relaxed glass-card rounded-2xl px-4 py-3",
        isUser 
          ? "text-white/80 bg-white/5" 
          : "text-white/90 bg-indigo-500/5 border-indigo-500/10"
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
