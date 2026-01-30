# Ollama Chat Pro 🤖

A beautiful, feature-rich AI chat application powered by Ollama with a modern glassmorphism UI.

## Features

- ✨ **Streaming Responses** - Real-time streaming with thinking state display
- 🔄 **Model Switcher** - Automatically detects all local Ollama models with size display
- 🌍 **Bilingual Support** - English/Chinese toggle with auto-detection based on user locale
- 💾 **Conversation History** - Persistent chat history saved to localStorage
- 📝 **Markdown Rendering** - Full markdown support with syntax highlighting for code blocks
- 🗑️ **Clear Chat** - Easy conversation management
- 📱 **Mobile Responsive** - Beautiful glassmorphism UI that works on all devices
- 🎨 **Modern Design** - Gradient backgrounds, glass effects, smooth animations

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai) installed and running locally
- At least one model pulled (e.g., `ollama pull llama2`)

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   cd ollama-chat-pro
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

Create a `.env.local` file to customize the Ollama host:

```env
OLLAMA_HOST=http://localhost:11434
```

## Project Structure

```
ollama-chat-pro/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts      # Chat streaming endpoint
│   │   │   └── models/route.ts    # Models list endpoint
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main chat page
│   ├── components/
│   │   ├── ChatMessage.tsx        # Message bubble component
│   │   ├── CodeBlock.tsx          # Syntax-highlighted code
│   │   ├── LanguageToggle.tsx     # EN/中文 switcher
│   │   ├── MarkdownRenderer.tsx   # Markdown processing
│   │   ├── ModelSelector.tsx      # Model dropdown
│   │   ├── Sidebar.tsx            # Conversation history
│   │   └── ThinkingIndicator.tsx  # Loading states
│   ├── lib/
│   │   ├── i18n.ts                # Translations
│   │   └── storage.ts             # LocalStorage helpers
│   └── types/
│       └── index.ts               # TypeScript types
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Markdown:** react-markdown + react-syntax-highlighter
- **Language:** TypeScript

## License

MIT
