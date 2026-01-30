import { Language } from '@/types'

export const translations = {
  en: {
    title: 'Ollama Chat',
    newChat: 'New Chat',
    clearChat: 'Clear Chat',
    typeMessage: 'Type a message...',
    thinking: 'Thinking',
    streaming: 'Responding',
    selectModel: 'Select Model',
    noModels: 'No models found',
    loadingModels: 'Loading models...',
    modelSize: 'Size',
    conversations: 'Conversations',
    noConversations: 'No conversations yet',
    deleteConversation: 'Delete',
    confirmDelete: 'Delete this conversation?',
    errorOccurred: 'Sorry, an error occurred while processing your request.',
    send: 'Send',
    language: 'Language',
    english: 'English',
    chinese: '中文',
    copyCode: 'Copy',
    copied: 'Copied!',
  },
  zh: {
    title: 'Ollama 聊天',
    newChat: '新对话',
    clearChat: '清除对话',
    typeMessage: '输入消息...',
    thinking: '思考中',
    streaming: '回复中',
    selectModel: '选择模型',
    noModels: '未找到模型',
    loadingModels: '加载模型中...',
    modelSize: '大小',
    conversations: '对话历史',
    noConversations: '暂无对话',
    deleteConversation: '删除',
    confirmDelete: '确定删除此对话？',
    errorOccurred: '抱歉，处理您的请求时出现错误。',
    send: '发送',
    language: '语言',
    english: 'English',
    chinese: '中文',
    copyCode: '复制',
    copied: '已复制！',
  },
}

export function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language || 'en'
  return lang.startsWith('zh') ? 'zh' : 'en'
}

export function t(key: keyof typeof translations.en, lang: Language): string {
  return translations[lang][key] || translations.en[key]
}
