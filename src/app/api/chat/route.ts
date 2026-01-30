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
    /\b(near me|nearby|around here)\b/i,
    /\b(2024|2025|2026)\b/,
  ]
  return patterns.some(p => p.test(query))
}

// Scrape Google search results via headless fetch (no API key needed)
async function scrapeGoogleSearch(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`
    
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    
    if (!res.ok) return null
    
    const html = await res.text()
    
    // Extract search result snippets using regex (simple parsing)
    const results: string[] = []
    
    // Match result blocks - look for common patterns in Google's HTML
    // This extracts titles and snippets from search results
    const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/gi
    const snippetRegex = /<span[^>]*class="[^"]*"[^>]*>([^<]{50,300})<\/span>/gi
    
    let titleMatch
    const titles: string[] = []
    while ((titleMatch = titleRegex.exec(html)) !== null && titles.length < 5) {
      const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      if (title.length > 10 && !title.includes('...')) {
        titles.push(title)
      }
    }
    
    // Extract snippets
    const snippets: string[] = []
    let snippetMatch
    while ((snippetMatch = snippetRegex.exec(html)) !== null && snippets.length < 5) {
      const snippet = snippetMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim()
      if (snippet.length > 50 && !snippets.includes(snippet)) {
        snippets.push(snippet)
      }
    }
    
    // Combine titles and snippets
    for (let i = 0; i < Math.min(titles.length, 5); i++) {
      results.push(`[${i + 1}] ${titles[i]}\n${snippets[i] || 'No description available'}`)
    }
    
    return results.length > 0 ? results.join('\n\n') : null
  } catch (e) {
    console.error('Google scrape error:', e)
    return null
  }
}

// Scrape DuckDuckGo (more scrape-friendly)
async function scrapeDuckDuckGo(query: string): Promise<string | null> {
  try {
    // DuckDuckGo HTML version
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    })
    
    if (!res.ok) return null
    
    const html = await res.text()
    
    // DuckDuckGo HTML has cleaner structure
    const results: string[] = []
    
    // Match result links and snippets
    const resultRegex = /<a[^>]*class="result__a"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([^<]+)<\/a>/gi
    
    let match
    let i = 1
    while ((match = resultRegex.exec(html)) !== null && i <= 5) {
      const title = match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
      const snippet = match[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
      if (title && snippet) {
        results.push(`[${i}] ${title}\n${snippet}`)
        i++
      }
    }
    
    // Alternative pattern for DDG
    if (results.length === 0) {
      const altRegex = /<a class="result__a"[^>]*>([^<]+)<\/a>/gi
      const snippetRegex = /<a class="result__snippet"[^>]*>([^<]+)<\/a>/gi
      
      const titles: string[] = []
      const snippets: string[] = []
      
      let m
      while ((m = altRegex.exec(html)) !== null && titles.length < 5) {
        titles.push(m[1].replace(/&amp;/g, '&').trim())
      }
      while ((m = snippetRegex.exec(html)) !== null && snippets.length < 5) {
        snippets.push(m[1].replace(/&amp;/g, '&').trim())
      }
      
      for (let j = 0; j < Math.min(titles.length, snippets.length, 5); j++) {
        results.push(`[${j + 1}] ${titles[j]}\n${snippets[j]}`)
      }
    }
    
    return results.length > 0 ? results.join('\n\n') : null
  } catch (e) {
    console.error('DuckDuckGo scrape error:', e)
    return null
  }
}

// Perform web search - try Brave API first, then fallback to scraping
async function searchWeb(query: string, location?: { lat: number; lon: number; city?: string }): Promise<string | null> {
  // Enhance query with location if available
  let searchQuery = query
  if (location?.city) {
    if (/weather|forecast|near me|nearby|local|restaurants?|shops?/i.test(query)) {
      searchQuery = `${query} in ${location.city}`
    }
  }
  
  // Try Brave API first if key available
  if (BRAVE_API_KEY) {
    try {
      const res = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=5`,
        {
          headers: {
            'X-Subscription-Token': BRAVE_API_KEY,
            'Accept': 'application/json',
          },
        }
      )
      
      if (res.ok) {
        const data = await res.json()
        const results = data.web?.results || []
        
        if (results.length > 0) {
          console.log('[Search] Using Brave API')
          return results.map((r: any, i: number) => 
            `[${i + 1}] ${r.title}\n${r.description}\nSource: ${r.url}`
          ).join('\n\n')
        }
      }
    } catch (e) {
      console.error('Brave API error:', e)
    }
  }
  
  // Fallback to DuckDuckGo scraping
  console.log('[Search] Falling back to DuckDuckGo scrape')
  const ddgResults = await scrapeDuckDuckGo(searchQuery)
  if (ddgResults) return ddgResults
  
  // Last resort: Google scraping
  console.log('[Search] Falling back to Google scrape')
  return await scrapeGoogleSearch(searchQuery)
}

export async function POST(req: NextRequest) {
  try {
    const { messages, model, language, location } = await req.json()

    // Get last user message for search decision
    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
    
    // Build system prompt
    let systemPrompt = language === 'zh'
      ? '你是一个有帮助的AI助手。请用中文回复用户的问题，保持回答清晰、准确、有条理。'
      : 'You are a helpful AI assistant. Respond clearly and accurately to user questions.'

    // Add location context if provided
    if (location) {
      const locationStr = location.city 
        ? `${location.city} (${location.lat.toFixed(2)}, ${location.lon.toFixed(2)})`
        : `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`
      systemPrompt += `\n\n📍 User's Location: ${locationStr}`
    }

    // Add web search context if needed
    if (needsWebSearch(lastUserMsg)) {
      const searchResults = await searchWeb(lastUserMsg, location)
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
