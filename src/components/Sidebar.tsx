'use client'

import { Plus, MessageSquare, Trash2, X } from 'lucide-react'
import { Conversation, Language } from '@/types'
import { t } from '@/lib/i18n'
import clsx from 'clsx'

interface SidebarProps {
  conversations: Conversation[]
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  language: Language
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  language,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col",
        "bg-gray-900/95 backdrop-blur-xl border-r border-white/10",
        "transform transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">
            {t('conversations', language)}
          </h2>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNew()
              onClose()
            }}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{t('newChat', language)}</span>
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              {t('noConversations', language)}
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={clsx(
                  "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                  currentId === conv.id
                    ? "bg-white/20 text-white"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => {
                  onSelect(conv.id)
                  onClose()
                }}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate text-sm">{conv.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(t('confirmDelete', language))) {
                      onDelete(conv.id)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
