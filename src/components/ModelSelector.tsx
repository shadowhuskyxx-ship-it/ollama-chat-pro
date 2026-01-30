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
        <span className="text-white/70 max-w-[80px] sm:max-w-[100px] truncate">
          {isLoading ? '...' : displayName}
        </span>
        <ChevronDown className={clsx(
          "w-3.5 h-3.5 text-white/40 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 sm:hidden" 
            onClick={onToggle}
          />
          
          {/* Dropdown - fixed position on mobile, absolute on desktop */}
          <div className={clsx(
            "z-50 w-64 max-h-64 overflow-auto rounded-xl bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl",
            // Mobile: fixed at bottom
            "fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-auto sm:left-auto",
            // Desktop: positioned below button
            "sm:top-full sm:right-0 sm:mt-1 sm:w-56",
            // Mobile: full width with rounded top corners
            "rounded-b-none sm:rounded-xl"
          )}>
            {/* Mobile drag handle */}
            <div className="flex justify-center py-2 sm:hidden">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>
            
            {models.length === 0 ? (
              <div className="px-4 py-3 text-white/40 text-sm text-center">
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
                    "w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors",
                    "border-b border-white/5 last:border-0",
                    selectedModel === model.name && "bg-indigo-500/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/90 truncate">{model.name}</span>
                    <span className="text-xs text-white/40 flex-shrink-0">
                      {formatBytes(model.size)}
                    </span>
                  </div>
                  {model.details && (
                    <div className="text-xs text-white/30 mt-0.5">
                      {model.details.parameter_size} • {model.details.quantization_level}
                    </div>
                  )}
                </button>
              ))
            )}
            
            {/* Safe area padding for mobile */}
            <div className="h-6 sm:hidden" />
          </div>
        </>
      )}
    </div>
  )
}
