'use client'

import { useState, useEffect } from 'react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type Conversation = {
  id: string
  title: string
  messages: Message[]
  model: string
  userId?: string
  userAgent?: string
  createdAt: number
  updatedAt: number
}

export default function AdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadConversations() {
    try {
      const res = await fetch('/api/conversations')
      const data = await res.json()
      setConversations(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(ts: number) {
    return new Date(ts).toLocaleString()
  }

  function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n) + '...' : s
  }

  return (
    <div style={{
      fontFamily: '"Courier New", monospace',
      background: '#000',
      color: '#0f0',
      minHeight: '100vh',
      padding: 0,
      margin: 0,
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '2px solid #0f0',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <span style={{ fontSize: 20 }}>■ CHAT ADMIN CONSOLE</span>
          <span style={{ marginLeft: 20, color: '#0a0' }}>
            [{conversations.length} conversations]
          </span>
        </div>
        <div style={{ color: '#0a0', fontSize: 12 }}>
          {new Date().toLocaleString()}
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 50px)' }}>
        {/* Sidebar */}
        <div style={{
          width: 350,
          borderRight: '1px solid #0f0',
          overflow: 'auto',
        }}>
          <div style={{ padding: '10px', borderBottom: '1px solid #030', color: '#0a0', fontSize: 12 }}>
            ▼ ALL CONVERSATIONS
          </div>
          {loading ? (
            <div style={{ padding: 20, color: '#0a0' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 20, color: '#0a0' }}>No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelected(conv)}
                style={{
                  padding: '12px 15px',
                  borderBottom: '1px solid #030',
                  cursor: 'pointer',
                  background: selected?.id === conv.id ? '#0f02' : 'transparent',
                }}
              >
                <div style={{ fontSize: 13, marginBottom: 4 }}>
                  {truncate(conv.title, 35)}
                </div>
                <div style={{ fontSize: 10, color: '#0a0' }}>
                  {conv.messages.length} msgs • {conv.model?.split(':')[0]}
                </div>
                <div style={{ fontSize: 10, color: '#080' }}>
                  {formatDate(conv.updatedAt)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selected ? (
            <>
              {/* Conv header */}
              <div style={{
                padding: '12px 20px',
                borderBottom: '1px solid #0f0',
                background: '#010',
              }}>
                <div style={{ fontSize: 14 }}>{selected.title}</div>
                <div style={{ fontSize: 11, color: '#0a0', marginTop: 4 }}>
                  ID: {selected.id} • Model: {selected.model} • Created: {formatDate(selected.createdAt)}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                {selected.messages.map((msg, i) => (
                  <div key={msg.id || i} style={{ marginBottom: 20 }}>
                    <div style={{
                      fontSize: 11,
                      color: msg.role === 'user' ? '#ff0' : '#0ff',
                      marginBottom: 4,
                    }}>
                      [{formatDate(msg.timestamp)}] {msg.role === 'user' ? '► USER' : '◄ ASSISTANT'}
                    </div>
                    <div style={{
                      background: '#111',
                      border: `1px solid ${msg.role === 'user' ? '#ff03' : '#0ff3'}`,
                      padding: '10px 12px',
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5,
                      color: '#eee',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0a0',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>▣</div>
                <div>Select a conversation to view</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
