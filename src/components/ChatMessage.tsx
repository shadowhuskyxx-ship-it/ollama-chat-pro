'use client'

import { User, Bot } from 'lucide-react'
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
      "flex gap-4 px-4 py-6",
      isUser ? "bg-transparent" : "bg-white/30"
    )}>
      <div className={clsx(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        isUser 
          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white" 
          : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
      )}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={clsx(
          "prose prose-gray max-w-none",
          isUser && "text-gray-800"
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} uiLanguage={uiLanguage} />
          )}
        </div>
      </div>
    </div>
  )
}
