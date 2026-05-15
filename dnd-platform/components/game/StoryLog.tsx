'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Message } from '@/types/message'

function MessageBubble({ message }: { message: Message }) {
  if (message.type === 'narration') {
    const cleanContent = (message.content || '')
      .replace(/<[^>]+\/>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    return (
      <div className="flex justify-center my-8 animate-fadeIn">
        <div
          className="glass max-w-2xl w-full p-6 rounded-2xl border-l-2 border-l-amber-main/40"
        >
          <p className="text-[10px] text-amber-highlight font-semibold uppercase tracking-wider mb-3">
            Dungeon Master
          </p>
          <p className="leading-relaxed text-sm text-foreground"
             style={{ fontFamily: '"Ibarra Real Nova", serif', lineHeight: '1.75' }}>
            {cleanContent}
          </p>
        </div>
      </div>
    )
  }

  if (message.type === 'player_action') {
    return (
      <div className="flex justify-end mb-4 animate-fadeIn px-4">
        <div className="glass px-5 py-3 rounded-2xl border-l-2 border-l-white/20 max-w-md">
          <p className="text-sm text-foreground/80 italic">
            &quot;{message.content}&quot;
          </p>
        </div>
      </div>
    )
  }

  if (message.type === 'system') {
    return (
      <div className="mb-4 animate-fadeIn px-4">
        <p className="text-xs text-amber-main/60 italic text-center uppercase tracking-widest">
          ─── {message.content} ───
        </p>
      </div>
    )
  }

  if (message.type === 'combat_log' as any) {
    return (
      <div className="mb-3 animate-fadeIn px-4">
        <div className="rounded-lg p-3 border-l-2 border-l-red-500/40 bg-red-500/5">
          <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Combat</p>
          <p className="text-xs text-gray-300 font-mono">{message.content}</p>
        </div>
      </div>
    )
  }

  return null
}

export function StoryLog() {
  const { messages, isDMThinking, campaign } = useGameStore()
  const showThinking = isDMThinking && campaign?.dm_mode !== 'human'
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showJumpButton, setShowJumpButton] = useState(false)
  const userScrolledUp = useRef(false)

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
    userScrolledUp.current = false
    setShowJumpButton(false)
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom > 200) {
      userScrolledUp.current = true
      setShowJumpButton(true)
    } else {
      userScrolledUp.current = false
      setShowJumpButton(false)
    }
  }, [])

  useEffect(() => {
    if (!userScrolledUp.current) {
      scrollToBottom()
    }
  }, [messages, showThinking, scrollToBottom])

  return (
    <div className="relative h-full flex flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar"
      >
        {messages.length === 0 && !showThinking && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
            <p className="text-gray-400 text-sm text-center">Your adventure is beginning...</p>
            <div className="w-6 h-6 border-2 border-amber-main/30 border-t-amber-highlight rounded-full animate-spin" />
          </div>
        )}

        {messages.filter(m => m.type !== 'dice_roll').map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {showThinking && (
          <div className="flex justify-center my-8 animate-fadeIn">
            <div className="glass max-w-2xl w-full p-6 rounded-2xl border-l-2 border-l-amber-main/40">
              <p className="text-[10px] text-amber-highlight font-semibold uppercase tracking-wider mb-3">
                Dungeon Master
              </p>
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-main animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-main animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-main animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Jump to latest button */}
      {showJumpButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full text-xs font-semibold text-amber-highlight border border-amber-main/30 hover:border-amber-main/60 transition-all shadow-lg z-10"
        >
          ↓ Jump to latest
        </button>
      )}
    </div>
  )
}
