'use client'

import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { Language } from '@/types'
import { t } from '@/lib/i18n'

interface CodeBlockProps {
  language: string
  value: string
  uiLanguage: Language
}

export default function CodeBlock({ language, value, uiLanguage }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 text-white/40 text-xs">
        <span className="font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-400" />
              <span className="text-green-400">{t('copied', uiLanguage)}</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>{t('copyCode', uiLanguage)}</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          padding: '0.75rem',
          fontSize: '0.8rem',
          background: 'rgba(0,0,0,0.3)',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}
