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
    welcomeMessage: `Hey there! 👋 I'm your local AI buddy, powered by Ollama.

**What I can do:**
- 💬 Chat naturally in English or 中文
- 💻 Help with code, debugging & tech stuff
- ✍️ Write stories, emails, or creative content
- 🧠 Explain complex topics simply
- 🔒 100% private — I run locally on your machine!

**Pro tips:**
- Switch models anytime using the dropdown
- Try the Konami code for a surprise 🎮
- Your chats are saved locally

So... what's on your mind? 😊`,
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
    welcomeMessage: `嗨！👋 我是你的本地AI助手，由Ollama驱动。

**我能做什么：**
- 💬 自然地用中文或English聊天
- 💻 帮你写代码、调试和解决技术问题
- ✍️ 写故事、邮件或创意内容
- 🧠 用简单的方式解释复杂概念
- 🔒 100%隐私安全 — 完全在本地运行！

**小技巧：**
- 随时用下拉菜单切换模型
- 试试科乐美秘技有惊喜 🎮
- 聊天记录自动保存在本地

那么...想聊点什么？😊`,
  },
}

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  
  // Check localStorage first for user preference
  const saved = localStorage.getItem('ollama-chat-language')
  if (saved === 'zh' || saved === 'en') return saved
  
  // Fall back to browser language
  const lang = navigator.language || 'en'
  return lang.startsWith('zh') ? 'zh' : 'en'
}

export function saveLanguage(lang: Language): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('ollama-chat-language', lang)
}

export function t(key: keyof typeof translations.en, lang: Language): string {
  return translations[lang][key] || translations.en[key]
}
