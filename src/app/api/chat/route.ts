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

// Use Wikipedia API for factual queries (free, no key)
async function searchWikipedia(query: string): Promise<string | null> {
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&origin=*`
    )
    if (!searchRes.ok) return null
    
    const data = await searchRes.json()
    const results = data.query?.search || []
    
    if (results.length === 0) return null
    
    return results.map((r: any, i: number) => 
      `[${i + 1}] ${r.title}\n${r.snippet.replace(/<[^>]+>/g, '')}`
    ).join('\n\n')
  } catch (e) {
    console.error('Wikipedia search error:', e)
    return null
  }
}

// Use Bing web search (scraping the suggestions/instant answers)
async function searchBing(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
      }
    )
    if (!res.ok) return null
    
    const text = await res.text()
    
    // Extract from RSS
    const items: string[] = []
    const titleRegex = /<title>([^<]+)<\/title>/gi
    const descRegex = /<description>([^<]+)<\/description>/gi
    
    const titles: string[] = []
    const descs: string[] = []
    
    let match
    while ((match = titleRegex.exec(text)) !== null) {
      const t = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      if (t && t !== 'Search Results' && !t.includes('Bing')) {
        titles.push(t)
      }
    }
    while ((match = descRegex.exec(text)) !== null) {
      const d = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '')
      if (d && d.length > 20) {
        descs.push(d)
      }
    }
    
    for (let i = 0; i < Math.min(titles.length, descs.length, 5); i++) {
      items.push(`[${i + 1}] ${titles[i]}\n${descs[i]}`)
    }
    
    return items.length > 0 ? items.join('\n\n') : null
  } catch (e) {
    console.error('Bing search error:', e)
    return null
  }
}

// Use Google's CSE or fallback
async function searchGoogle(query: string): Promise<string | null> {
  try {
    // Google Programmable Search API (free tier: 100 queries/day)
    // If you have API key, uncomment:
    // const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
    // const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID
    // if (GOOGLE_API_KEY && GOOGLE_CSE_ID) { ... }
    
    // Fallback: scrape Google search
    const res = await fetch(
      `https://www.google.com/search?q=${encodeURIComponent(query)}&num=5`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    )
    
    if (!res.ok) return null
    
    const html = await res.text()
    const results: string[] = []
    
    // Look for data-snf blocks or BNeawe class (Google's obfuscated classes)
    const snippetRegex = /class="BNeawe[^"]*"[^>]*>([^<]{30,300})</gi
    const snippets: string[] = []
    
    let match
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
      const text = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
      if (text.length > 30 && !snippets.includes(text)) {
        snippets.push(text)
      }
    }
    
    snippets.forEach((s, i) => {
      results.push(`[${i + 1}] ${s}`)
    })
    
    return results.length > 0 ? results.join('\n\n') : null
  } catch (e) {
    console.error('Google search error:', e)
    return null
  }
}

// Perform web search - try multiple sources
async function searchWeb(query: string, location?: { lat: number; lon: number; city?: string }): Promise<string | null> {
  // Enhance query with location if available
  let searchQuery = query
  if (location?.city) {
    if (/weather|forecast|near me|nearby|local|restaurants?|shops?/i.test(query)) {
      searchQuery = `${query} ${location.city}`
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
  
  // Try Wikipedia for factual queries
  console.log('[Search] Trying Wikipedia')
  const wikiResults = await searchWikipedia(searchQuery)
  if (wikiResults) {
    console.log('[Search] Got Wikipedia results')
    return wikiResults
  }
  
  // Try Google scraping
  console.log('[Search] Trying Google scrape')
  const googleResults = await searchGoogle(searchQuery)
  if (googleResults) {
    console.log('[Search] Got Google results')
    return googleResults
  }
  
  // Try Bing RSS
  console.log('[Search] Trying Bing RSS')
  const bingResults = await searchBing(searchQuery)
  if (bingResults) {
    console.log('[Search] Got Bing results')
    return bingResults
  }
  
  console.log('[Search] No results from any source')
  return null
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
      console.log('[Chat] Query needs web search:', lastUserMsg)
      const searchResults = await searchWeb(lastUserMsg, location)
      if (searchResults) {
        const dateStr = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
        systemPrompt += `\n\n📅 Today's Date: ${dateStr}\n\n🔍 WEB SEARCH RESULTS:\n${searchResults}\n\nUse the above search results to provide accurate, up-to-date information. Cite sources when relevant using [1], [2], etc.`
      } else {
        // No search results - add date context at least
        const dateStr = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
        systemPrompt += `\n\n📅 Today's Date: ${dateStr}\n\nNote: Web search was attempted but no results were found. Answer based on your training data, and note if information might be outdated.`
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
