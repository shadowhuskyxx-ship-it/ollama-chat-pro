'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

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
      // Update selected if it exists
      if (selected) {
        const updated = data.find((c: Conversation) => c.id === selected.id)
        if (updated) setSelected(updated)
      }
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
                      lineHeight: 1.6,
                      color: '#eee',
                    }}>
                      {msg.role === 'user' ? (
                        <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{msg.content}</pre>
                      ) : (
                        <div className="markdown-content">
                          <ReactMarkdown
                            components={{
                              p: ({children}) => <p style={{margin: '0 0 10px 0'}}>{children}</p>,
                              strong: ({children}) => <strong style={{color: '#0f0'}}>{children}</strong>,
                              code: ({children}) => <code style={{background: '#222', padding: '2px 6px', borderRadius: 4, fontSize: 12}}>{children}</code>,
                              pre: ({children}) => <pre style={{background: '#0a0a0a', padding: 10, borderRadius: 4, overflow: 'auto', margin: '10px 0'}}>{children}</pre>,
                              ul: ({children}) => <ul style={{margin: '10px 0', paddingLeft: 20}}>{children}</ul>,
                              ol: ({children}) => <ol style={{margin: '10px 0', paddingLeft: 20}}>{children}</ol>,
                              li: ({children}) => <li style={{margin: '4px 0'}}>{children}</li>,
                              h1: ({children}) => <h1 style={{fontSize: 18, margin: '15px 0 10px', color: '#0f0'}}>{children}</h1>,
                              h2: ({children}) => <h2 style={{fontSize: 16, margin: '12px 0 8px', color: '#0f0'}}>{children}</h2>,
                              h3: ({children}) => <h3 style={{fontSize: 14, margin: '10px 0 6px', color: '#0f0'}}>{children}</h3>,
                              blockquote: ({children}) => <blockquote style={{borderLeft: '3px solid #0f0', paddingLeft: 10, margin: '10px 0', color: '#0a0'}}>{children}</blockquote>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
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
