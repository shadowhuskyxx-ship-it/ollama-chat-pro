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
                className="px-1.5 py-0.5 rounded-md bg-gray-200/80 dark:bg-gray-700/80 text-sm font-mono"
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
          return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-lg font-semibold mb-2 mt-4">{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-600">
              {children}
            </blockquote>
          )
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              className="text-blue-500 hover:text-blue-600 underline"
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
