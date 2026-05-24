import React, { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import type { ChatMessage } from '@/types'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: '#8b5cf6', animationDelay: `${i * 0.2}s` }}
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  const time = new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-3`}>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{
          background: isUser ? 'rgba(6,182,212,0.15)' : 'rgba(139,92,246,0.15)',
          border: `1px solid ${isUser ? 'rgba(6,182,212,0.35)' : 'rgba(139,92,246,0.35)'}`,
        }}>
        {isUser ? <User size={14} style={{ color: '#06b6d4' }} /> : <Bot size={14} style={{ color: '#8b5cf6' }} />}
      </div>

      {/* Bubble */}
      <div className="max-w-[72%]">
        <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed backdrop-blur-sm"
          style={{
            background: isUser ? 'rgba(6,182,212,0.12)' : 'rgba(139,92,246,0.12)',
            border: `1px solid ${isUser ? 'rgba(6,182,212,0.25)' : 'rgba(139,92,246,0.25)'}`,
            color: '#f1f5f9',
            borderBottomRightRadius: isUser ? 4 : undefined,
            borderBottomLeftRadius: !isUser ? 4 : undefined,
          }}>
          {msg.content}
        </div>
        <div className={`text-[10px] mt-1 ${isUser ? 'text-right' : 'text-left'}`}
          style={{ color: '#64748b' }}>
          {time}
        </div>
      </div>
    </motion.div>
  )
}

export default function ChatPanel() {
  const { messages, isStreaming, inputText, settings, setInputText, addMessage, setIsStreaming, setEmotion, setIsTalking } = useAppStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isComposing, setIsComposing] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  async function sendMessage() {
    const text = inputText.trim()
    if (!text || isStreaming || !window.alice) return

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() }
    addMessage(userMsg)
    setInputText('')
    setIsStreaming(true)

    const chatMessages = [
      { role: 'system', content: settings.persona },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ]

    try {
      const res = await window.alice.ai.chat({
        provider: settings.provider,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        messages: chatMessages,
      })

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.content || (res.success ? '...' : `Hata: ${res.content}`),
        timestamp: Date.now(),
      }
      addMessage(assistantMsg)

      if (res.success && res.content && settings.voice.autoSpeak) {
        setEmotion('talk')
        setIsTalking(true)
        window.alice.voice.speak({
          text: res.content,
          voice: settings.voice.voiceName,
          rate: settings.voice.rate,
          pitch: settings.voice.pitch,
          volume: settings.voice.volume,
        })
      }
    } catch (err) {
      addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: 'Bağlantı hatası oluştu.', timestamp: Date.now() })
    } finally {
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden"
      style={{ borderRight: '1px solid rgba(124,58,237,0.2)' }}>

      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(139,92,246,0.15)', background: 'rgba(20,30,60,0.3)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-neon-pulse" style={{ background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif', color: '#f1f5f9', letterSpacing: '0.08em' }}>
            Sohbet
          </span>
        </div>
        <span className="text-xs" style={{ color: '#64748b' }}>{messages.length} msg</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-4 py-16"
              style={{ color: '#64748b' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center glow-purple"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Bot size={32} style={{ color: '#8b5cf6' }} />
              </div>
              <p className="text-sm text-center max-w-xs">
                <span className="block font-semibold text-base mb-2" style={{ color: '#f1f5f9' }}>Merhaba! 👋</span>
                Alice ile harika bir sohbet başlayın.<br />
                <span className="text-xs mt-2 block" style={{ color: '#64748b' }}>Bir mesaj yazıp Enter&apos;a basın</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}

        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-end gap-2 mb-3">
            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)' }}>
              <Bot size={14} style={{ color: '#8b5cf6' }} />
            </div>
            <div className="px-3 py-1 rounded-2xl rounded-bl-sm backdrop-blur-sm"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="flex items-end gap-2 rounded-2xl p-1 backdrop-blur-sm"
          style={{ background: 'rgba(26,40,84,0.5)', border: '1px solid rgba(139,92,246,0.2)', boxShadow: '0 0 20px rgba(139,92,246,0.08)' }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Alice'e mesaj yaz..."
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none px-4 py-2.5 text-sm placeholder-gray-600"
            style={{ color: '#f1f5f9', lineHeight: 1.5, maxHeight: 120, minHeight: 44, fontFamily: 'Inter, sans-serif' }}
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={sendMessage}
            disabled={!inputText.trim() || isStreaming}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all mr-1 mb-1"
            style={{
              background: inputText.trim() && !isStreaming ? 'linear-gradient(135deg, #8b5cf6, #06b6d4)' : 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.25)',
              opacity: !inputText.trim() || isStreaming ? 0.4 : 1,
              boxShadow: inputText.trim() && !isStreaming ? '0 0 16px rgba(139,92,246,0.3)' : 'none',
            }}>
            <Send size={16} style={{ color: '#fff' }} />
          </motion.button>
        </div>
        <p className="text-center text-[10px] mt-2" style={{ color: '#475569' }}>
          Enter ⏎ gönder &bull; Shift+Enter ↵ satır
        </p>
      </div>
    </div>
  )
}
