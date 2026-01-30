'use client'

import { Globe } from 'lucide-react'
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
        "flex items-center gap-2 px-4 py-2.5 rounded-xl",
        "bg-white/60 backdrop-blur-md border border-white/20",
        "hover:bg-white/80 transition-all shadow-lg"
      )}
    >
      <Globe className="w-4 h-4 text-gray-600" />
      <span className="font-medium text-gray-700">
        {language === 'en' ? 'EN' : '中'}
      </span>
    </button>
  )
}
