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
          style={{ background: '#a855f7', animationDelay: `${i * 0.2}s` }}
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
          background: isUser ? 'rgba(0,229,255,0.15)' : 'rgba(124,58,237,0.2)',
          border: `1px solid ${isUser ? 'rgba(0,229,255,0.4)' : 'rgba(124,58,237,0.4)'}`,
        }}>
        {isUser ? <User size={14} style={{ color: '#00e5ff' }} /> : <Bot size={14} style={{ color: '#a855f7' }} />}
      </div>

      {/* Bubble */}
      <div className="max-w-[72%]">
        <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
          style={{
            background: isUser ? 'rgba(0,229,255,0.1)' : 'rgba(124,58,237,0.15)',
            border: `1px solid ${isUser ? 'rgba(0,229,255,0.25)' : 'rgba(124,58,237,0.3)'}`,
            color: '#e5e7eb',
            borderBottomRightRadius: isUser ? 4 : undefined,
            borderBottomLeftRadius: !isUser ? 4 : undefined,
          }}>
          {msg.content}
        </div>
        <div className={`text-[10px] mt-1 ${isUser ? 'text-right' : 'text-left'}`}
          style={{ color: '#475569' }}>
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
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(124,58,237,0.2)', background: 'rgba(5,7,10,0.5)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-neon-pulse" style={{ background: '#a855f7', boxShadow: '0 0 4px #a855f7' }} />
          <span className="text-sm font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif', color: '#e5e7eb', letterSpacing: '0.05em' }}>
            SOHBET
          </span>
        </div>
        <span className="text-xs" style={{ color: '#475569' }}>{messages.length} mesaj</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-3 py-16"
              style={{ color: '#475569' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px dashed rgba(124,58,237,0.3)' }}>
                <Bot size={28} style={{ color: '#7c3aed' }} />
              </div>
              <p className="text-sm text-center">
                Merhaba! Alice ile sohbete başlayın.<br />
                <span className="text-xs" style={{ color: '#475569' }}>Bir mesaj yazın ve Enter&apos;a basın.</span>
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
              style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)' }}>
              <Bot size={14} style={{ color: '#a855f7' }} />
            </div>
            <div className="px-3 py-1 rounded-2xl rounded-bl-sm"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="flex items-end gap-2 rounded-xl p-1"
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 16px rgba(124,58,237,0.1)' }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder="Alice'e mesaj yaz..."
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none px-3 py-2.5 text-sm"
            style={{ color: '#e5e7eb', lineHeight: 1.5, maxHeight: 120, minHeight: 42, fontFamily: 'Inter, sans-serif' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!inputText.trim() || isStreaming}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-all mr-1 mb-1"
            style={{
              background: inputText.trim() && !isStreaming ? 'linear-gradient(135deg, #7c3aed, #00e5ff)' : 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.3)',
              opacity: !inputText.trim() || isStreaming ? 0.5 : 1,
              boxShadow: inputText.trim() && !isStreaming ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
            }}>
            <Send size={15} style={{ color: '#fff' }} />
          </motion.button>
        </div>
        <p className="text-center text-[10px] mt-1" style={{ color: '#2d3748' }}>
          Enter ile gönder &bull; Shift+Enter yeni satır
        </p>
      </div>
    </div>
  )
}
