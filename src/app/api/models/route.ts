import { NextResponse } from 'next/server'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }

    const data = await response.json()
    return NextResponse.json(data.models || [])
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json([], { status: 500 })
  }
}
