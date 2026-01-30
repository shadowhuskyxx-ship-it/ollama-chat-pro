'use client'

import { Language } from '@/types'
import clsx from 'clsx'

interface LanguageToggleProps {
  language: Language
  onToggle: () => void
}

export default function LanguageToggle({ language, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        "px-3 py-2 rounded-lg text-sm",
        "bg-white/5 border border-white/10",
        "hover:bg-white/10 transition-colors",
        "text-white/70"
      )}
    >
      {language === 'en' ? 'EN' : '中'}
    </button>
  )
}
