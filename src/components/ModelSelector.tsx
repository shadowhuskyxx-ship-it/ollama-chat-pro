'use client'

import { ChevronDown, HardDrive } from 'lucide-react'
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

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        disabled={isLoading}
        className={clsx(
          "flex items-center gap-2 px-4 py-2.5 rounded-xl",
          "bg-white/60 backdrop-blur-md border border-white/20",
          "hover:bg-white/80 transition-all shadow-lg",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <HardDrive className="w-4 h-4 text-gray-600" />
        <span className="font-medium text-gray-700">
          {isLoading ? t('loadingModels', language) : (currentModel?.name || t('selectModel', language))}
        </span>
        {currentModel && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {formatBytes(currentModel.size)}
          </span>
        )}
        <ChevronDown className={clsx(
          "w-4 h-4 text-gray-500 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 max-h-80 overflow-auto rounded-xl bg-white/90 backdrop-blur-md border border-white/20 shadow-xl z-50">
          {models.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-center">
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
                  "w-full px-4 py-3 text-left hover:bg-gray-100/80 transition-colors",
                  "border-b border-gray-100 last:border-0",
                  selectedModel === model.name && "bg-blue-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{model.name}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {formatBytes(model.size)}
                  </span>
                </div>
                {model.details && (
                  <div className="text-xs text-gray-500 mt-1">
                    {model.details.parameter_size} • {model.details.quantization_level}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
