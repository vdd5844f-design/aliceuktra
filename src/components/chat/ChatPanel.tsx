import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { type Emotion } from '../../types'

const alice = () => (window as unknown as Record<string, unknown>)['alice'] as Record<string, Record<string, (...args: unknown[]) => unknown>>

const EMOTION_KEYWORDS: Record<string, Emotion> = {
  mutlu: 'happy', sevinç: 'happy', harika: 'happy', sevindim: 'happy',
  üzgün: 'sad', üzüldüm: 'sad', kötü: 'sad',
  kızgın: 'angry', sinirli: 'angry',
  korktu: 'fear', korktum: 'fear', korku: 'fear',
  uyku: 'sleep', yorgun: 'sleep',
}

function detectEmotion(text: string): Emotion {
  const lower = text.toLowerCase()
  for (const [kw, em] of Object.entries(EMOTION_KEYWORDS)) {
    if (lower.includes(kw)) return em
  }
  return 'idle'
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#8b5cf6' }}
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  )
}

export default function ChatPanel() {
  const {
    messages, addMessage, clearMessages, isStreaming, setIsStreaming,
    isTalking, setIsTalking, appendToLastAssistant, settings, setActiveEmotion,
    activeCharacterId, activeOutfitId,
  } = useAppStore()

  const [inputText, setInputText] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const sendMessage = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isStreaming) return
    setInputText('')
    addMessage({ id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() })
    setIsStreaming(true)
    setIsTalking(true)
    setActiveEmotion('talk')

    try {
      const a = alice()
      if (unsubRef.current) unsubRef.current()
      const unsub = a.ai.onToken((token: string) => {
        appendToLastAssistant(token)
      }) as () => void
      unsubRef.current = unsub

      const payload = {
        provider: settings.provider,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        messages: [
          { role: 'system', content: settings.systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: text },
        ],
      }
      await a.ai.chat(payload)
    } catch (err) {
      addMessage({ id: Date.now().toString(), role: 'assistant', content: 'Hata olustu. Baglanti kontrol edin.', timestamp: Date.now() })
    } finally {
      setIsStreaming(false)
      setIsTalking(false)
      setActiveEmotion(detectEmotion(messages[messages.length - 1]?.content ?? ''))
    }
  }, [inputText, isStreaming, settings, messages, addMessage, setIsStreaming, setIsTalking, setActiveEmotion, appendToLastAssistant])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.12)', background: 'rgba(14,22,45,0.4)' }}>
        <div className="flex items-center gap-2">
          <motion.div className="w-2 h-2 rounded-full"
            style={{ background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }}
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
          <span className="text-xs font-semibold uppercase tracking-widest"
            style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f1f5f9', letterSpacing: '0.1em' }}>
            Sohbet
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: '#475569' }}>{messages.length} mesaj</span>
          <button onClick={clearMessages}
            className="p-1 rounded-lg cursor-pointer transition-all hover:bg-red-900/20"
            style={{ color: '#475569' }}
            title="Sohbeti temizle">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.2) transparent' }}>
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <Bot size={30} style={{ color: '#8b5cf6' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: '#e2e8f0' }}>Merhaba!</p>
                <p className="text-xs" style={{ color: '#475569' }}>Bir mesaj yazin ve baslayın</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          const time = new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          return (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
                style={{
                  background: isUser ? 'rgba(6,182,212,0.12)' : 'rgba(139,92,246,0.12)',
                  border: `1px solid ${isUser ? 'rgba(6,182,212,0.3)' : 'rgba(139,92,246,0.3)'}`,
                }}>
                {isUser ? <User size={13} style={{ color: '#06b6d4' }} /> : <Bot size={13} style={{ color: '#8b5cf6' }} />}
              </div>
              <div className="max-w-[74%]">
                <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isUser ? 'rgba(6,182,212,0.1)' : 'rgba(139,92,246,0.1)',
                    border: `1px solid ${isUser ? 'rgba(6,182,212,0.2)' : 'rgba(139,92,246,0.2)'}`,
                    color: '#f1f5f9',
                    borderBottomRightRadius: isUser ? 4 : undefined,
                    borderBottomLeftRadius: !isUser ? 4 : undefined,
                    wordBreak: 'break-word',
                  }}>
                  {msg.content}
                </div>
                <div className={`text-[10px] mt-1 ${isUser ? 'text-right' : 'text-left'}`}
                  style={{ color: '#374151' }}>
                  {time}
                </div>
              </div>
            </motion.div>
          )
        })}

        {isStreaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)' }}>
              <Bot size={13} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="px-3 py-1 rounded-2xl rounded-bl-sm"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <TypingDots />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="flex items-end gap-2 rounded-2xl p-1"
          style={{ background: 'rgba(20,32,70,0.5)', border: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 0 20px rgba(139,92,246,0.06)' }}>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Alice'e mesaj yaz..."
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none px-4 py-3 text-sm"
            style={{ color: '#f1f5f9', lineHeight: 1.5, maxHeight: 120, minHeight: 44, fontFamily: 'Inter, sans-serif' }}
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={sendMessage}
            disabled={!inputText.trim() || isStreaming}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer mb-0.5 mr-0.5"
            style={{
              background: inputText.trim() && !isStreaming ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'rgba(139,92,246,0.07)',
              border: '1px solid rgba(139,92,246,0.2)',
              opacity: !inputText.trim() || isStreaming ? 0.4 : 1,
              boxShadow: inputText.trim() && !isStreaming ? '0 0 16px rgba(139,92,246,0.3)' : 'none',
            }}>
            <Send size={16} style={{ color: '#fff' }} />
          </motion.button>
        </div>
        <p className="text-center text-[10px] mt-1.5" style={{ color: '#374151' }}>
          Enter ile gonder &bull; Shift+Enter yeni satir
        </p>
      </div>
    </div>
  )
}
