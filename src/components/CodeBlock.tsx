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
    <div className="relative group my-4 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-sm">
        <span className="font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400">{t('copied', uiLanguage)}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
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
          padding: '1rem',
          fontSize: '0.875rem',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}
