'use client'

import { ChevronDown } from 'lucide-react'
import { OllamaModel, Language } from '@/types'
import { t } from '@/lib/i18n'
import { formatBytes } from '@/lib/storage'
import clsx from 'clsx'

interface ModelSelectorProps {
  models: OllamaModel[]
  selectedModel: string
  onSelect: (model: string) => void
  isLoading: boolean
  language: Language
  isOpen: boolean
  onToggle: () => void
}

export default function ModelSelector({
  models,
  selectedModel,
  onSelect,
  isLoading,
  language,
  isOpen,
  onToggle,
}: ModelSelectorProps) {
  const currentModel = models.find(m => m.name === selectedModel)
  const displayName = currentModel?.name?.split(':')[0] || t('selectModel', language)

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={isLoading}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm",
          "bg-white/5 border border-white/10",
          "hover:bg-white/10 transition-colors",
          "disabled:opacity-50"
        )}
      >
        <span className="text-white/70 max-w-[100px] truncate">
          {isLoading ? '...' : displayName}
        </span>
        <ChevronDown className={clsx(
          "w-3.5 h-3.5 text-white/40 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 max-h-64 overflow-auto rounded-lg bg-black/95 border border-white/10 shadow-xl z-50">
          {models.length === 0 ? (
            <div className="px-3 py-2 text-white/40 text-sm">
              {t('noModels', language)}
            </div>
          ) : (
            models.map((model) => (
              <button
                key={model.name}
                onClick={() => {
                  onSelect(model.name)
                  onToggle()
                }}
                className={clsx(
                  "w-full px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors",
                  "border-b border-white/5 last:border-0",
                  selectedModel === model.name && "bg-indigo-500/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white/80 truncate">{model.name}</span>
                  <span className="text-xs text-white/30 flex-shrink-0">
                    {formatBytes(model.size)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
