'use client'

import ReactMarkdown from 'react-markdown'
import CodeBlock from './CodeBlock'
import { Language } from '@/types'

interface MarkdownRendererProps {
  content: string
  uiLanguage: Language
}

export default function MarkdownRenderer({ content, uiLanguage }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match && !className
          
          if (isInline) {
            return (
              <code
                className="px-1 py-0.5 rounded bg-white/10 text-indigo-300 text-[0.85em] font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <CodeBlock
              language={match ? match[1] : ''}
              value={String(children).replace(/\n$/, '')}
              uiLanguage={uiLanguage}
            />
          )
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-0.5 text-white/80">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-0.5 text-white/80">{children}</ol>
        },
        h1({ children }) {
          return <h1 className="text-lg font-semibold mb-2 mt-4 text-white">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-base font-semibold mb-2 mt-3 text-white">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-sm font-semibold mb-1.5 mt-2 text-white">{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-indigo-500/50 pl-3 my-2 text-white/60 italic">
              {children}
            </blockquote>
          )
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
