'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Language } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  content: string
  uiLanguage: Language
}

export default function MarkdownRenderer({ content, uiLanguage }: Props) {
  return (
    <ReactMarkdown
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match && !className
          
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 bg-border rounded text-[0.85em] font-mono" {...props}>
                {children}
              </code>
            )
          }

          return <CodeBlock language={match?.[1] || ''} code={String(children).replace(/\n$/, '')} />
        },
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-muted-foreground">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-muted-foreground">{children}</ol>,
        h1: ({ children }) => <h1 className="text-base font-semibold mb-2 mt-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 mt-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-medium mb-1 mt-2">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-accent/50 pl-3 my-2 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a href={href} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted text-xs text-muted-foreground">
        <span className="font-mono">{language || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-foreground transition-colors">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          padding: '0.75rem 1rem',
          fontSize: '0.8rem',
          background: 'hsl(var(--background))',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
