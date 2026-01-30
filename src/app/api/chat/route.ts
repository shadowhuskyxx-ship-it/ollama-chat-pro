import { NextRequest } from 'next/server'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

export async function POST(req: NextRequest) {
  try {
    const { messages, model, language } = await req.json()

    const systemPrompt = language === 'zh'
      ? '你是一个有帮助的AI助手。请用中文回复用户的问题，保持回答清晰、准确、有条理。'
      : 'You are a helpful AI assistant. Respond clearly and accurately to user questions.'

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
