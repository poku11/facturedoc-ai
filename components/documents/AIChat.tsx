'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'
import type { AIChat as AIChatType, Document } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/formatters'

interface AIChatProps {
    documentId: string
    document: Document
    initialMessages?: AIChatType[]
    onSuggestion?: (suggestion: Partial<Document>) => void
}

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: Date
}

export function AIChat({ documentId, document, initialMessages = [], onSuggestion }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>(
          initialMessages.map(m => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  createdAt: new Date(m.created_at),
          }))
        )
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
        const content = input.trim()
        if (!content || loading) return

                                      const userMsg: Message = {
                                              id: crypto.randomUUID(),
                                              role: 'user',
                                              content,
                                              createdAt: new Date(),
                                      }

                                      setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

                                      try {
                                              const res = await fetch('/api/ai/chat', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                                    documentId,
                                                                    message: content,
                                                                    documentContext: {
                                                                                  type: document.type,
                                                                                  title: document.title,
                                                                                  total: document.total,
                                                                                  status: document.status,
                                                                    },
                                                        }),
                                              })

          const data = await res.json()

          const assistantMsg: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: data.message ?? 'Desolee, une erreur est survenue.',
                    createdAt: new Date(),
          }

          setMessages(prev => [...prev, assistantMsg])

          if (data.suggestion && onSuggestion) {
                    onSuggestion(data.suggestion)
          }
                                      } catch (err) {
                                              setMessages(prev => [...prev, {
                                                        id: crypto.randomUUID(),
                                                        role: 'assistant',
                                                        content: 'Erreur de connexion. Veuillez reessayer.',
                                                        createdAt: new Date(),
                                              }])
                                      } finally {
                                              setLoading(false)
                                      }
  }, [input, loading, documentId, document, onSuggestion])

  const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
        }
  }

  const SUGGESTIONS = [
        'Ajoute une clause de retard de paiement',
        'Reformule la description de facon professionnelle',
        'Propose des conditions de reglement standard',
      ]

  return (
        <div className="flex flex-col h-full">
          {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                                <Sparkles size={14} className="text-purple-600" />
                      </div>div>
                      <div>
                                <p className="text-sm font-medium text-gray-900">Assistant IA</p>p>
                                <p className="text-xs text-gray-500">Propulse par Claude</p>p>
                      </div>div>
              </div>div>
        
          {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                              <Bot size={12} className="text-purple-600" />
                                              </div>div>
                                              <div className="bg-gray-50 rounded-xl rounded-tl-none p-3 text-sm text-gray-700 max-w-[85%]">
                                                              Bonjour ! Je suis votre assistant IA. Je peux vous aider a ameliorer ce document,
                                                              suggerer des clauses, reformuler des passages ou repondre a vos questions.
                                              </div>div>
                                </div>div>
                                <div className="space-y-1.5 pl-8">
                                  {SUGGESTIONS.map(s => (
                                      <button
                                                          key={s}
                                                          onClick={() => { setInput(s); inputRef.current?.focus() }}
                                                          className="block w-full text-left text-xs text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg px-3 py-1.5 transition-colors"
                                                        >
                                        {s}
                                      </button>button>
                                    ))}
                                </div>div>
                    </div>div>
                      )}
                {messages.map(msg => (
                    <div
                                  key={msg.id}
                                  className={cn('flex items-start gap-2', msg.role === 'user' && 'flex-row-reverse')}
                                >
                                <div className={cn(
                                                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                                msg.role === 'user' ? 'bg-primary-100' : 'bg-purple-100'
                                              )}>
                                  {msg.role === 'user' ? (
                                                  <User size={12} className="text-primary-600" />
                                                ) : (
                                                  <Bot size={12} className="text-purple-600" />
                                                )}
                                </div>div>
                                <div className={cn(
                                                'rounded-xl p-3 text-sm max-w-[85%] whitespace-pre-wrap',
                                                msg.role === 'user'
                                                  ? 'bg-primary-500 text-white rounded-tr-none'
                                                  : 'bg-gray-50 text-gray-700 rounded-tl-none'
                                              )}>
                                  {msg.content}
                                </div>div>
                    </div>div>
                  ))}
                {loading && (
                    <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                              <Bot size={12} className="text-purple-600" />
                                </div>div>
                                <div className="bg-gray-50 rounded-xl rounded-tl-none p-3">
                                              <Loader2 size={14} className="animate-spin text-gray-400" />
                                </div>div>
                    </div>div>
                      )}
                      <div ref={messagesEndRef} />
              </div>div>
        
          {/* Input */}
              <div className="p-3 border-t border-gray-100">
                      <div className="flex items-end gap-2 bg-gray-50 rounded-xl p-2">
                                <textarea
                                              ref={inputRef}
                                              value={input}
                                              onChange={e => setInput(e.target.value)}
                                              onKeyDown={handleKeyDown}
                                              placeholder="Posez votre question..."
                                              rows={1}
                                              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-24 min-h-[24px]"
                                            />
                                <button
                                              onClick={sendMessage}
                                              disabled={!input.trim() || loading}
                                              className="p-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                            >
                                            <Send size={14} />
                                </button>button>
                      </div>div>
                      <p className="text-xs text-gray-400 mt-1.5 text-center">Maj+Entree pour sauter une ligne</p>p>
              </div>div>
        </div>div>
      )
}

export default AIChat</div>
