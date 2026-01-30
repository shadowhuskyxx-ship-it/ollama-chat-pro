import { NextRequest } from 'next/server'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const BRAVE_API_KEY = process.env.BRAVE_API_KEY

// Check if query needs real-time information
function needsWebSearch(query: string): boolean {
  const patterns = [
    /\b(weather|forecast)\b/i,
    /\b(news|headlines|latest|recent|today|current)\b/i,
    /\b(price|stock|market|crypto|bitcoin)\b/i,
    /\b(who is|what is|when did|where is)\b/i,
    /\b(search|look up|find out|google)\b/i,
    /\b(happening|events?|schedule)\b/i,
    /\b(2024|2025|2026)\b/,
  ]
  return patterns.some(p => p.test(query))
}

// Perform web search via Brave API
async function searchWeb(query: string): Promise<string | null> {
  if (!BRAVE_API_KEY) return null
  
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          'X-Subscription-Token': BRAVE_API_KEY,
          'Accept': 'application/json',
        },
      }
    )
    
    if (!res.ok) return null
    
    const data = await res.json()
    const results = data.web?.results || []
    
    if (results.length === 0) return null
    
    return results.map((r: any, i: number) => 
      `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.url}`
    ).join('\n\n')
  } catch (e) {
    console.error('Search error:', e)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, language } = await req.json()

    // Get last user message for search decision
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
    
    // Build system prompt
    let systemPrompt = language === 'zh'
      ? '你是一个有帮助的AI助手。请用中文回复用户的问题，保持回答清晰、准确、有条理。'
      : 'You are a helpful AI assistant. Respond clearly and accurately to user questions.'

    // Add web search context if needed
    if (needsWebSearch(lastUserMsg)) {
      const searchResults = await searchWeb(lastUserMsg)
      if (searchResults) {
        const dateStr = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
        systemPrompt += `\n\n📅 Today's Date: ${dateStr}\n\n🔍 WEB SEARCH RESULTS:\n${searchResults}\n\nUse the above search results to provide accurate, up-to-date information. Cite sources when relevant using [1], [2], etc.`
      }
    }

    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama2',
        messages: ollamaMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(Boolean)

            for (const line of lines) {
              try {
                const json = JSON.parse(line)
                if (json.message?.content) {
                  controller.enqueue(encoder.encode(json.message.content))
                }
                if (json.done) {
                  break
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Error processing request', { status: 500 })
  }
}
