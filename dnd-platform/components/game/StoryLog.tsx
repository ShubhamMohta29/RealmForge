'use client'
import { useEffect, useRef } from 'react'
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
        <div className="glass max-w-2xl p-8 rounded-3xl">
          <p className="leading-relaxed text-lg italic"
             style={{ fontFamily: 'var(--font-serif, "Ibarra Real Nova", serif)' }}>
            {cleanContent}
          </p>
        </div>
      </div>
    )
  }

  if (message.type === 'player_action') {
    return (
      <div className="flex justify-end mb-6 animate-fadeIn">
        <div className="glass px-6 py-3 rounded-2xl shadow-lg border-none">
          <p className="text-sm text-amber-main font-medium italic">
            &quot;{message.content}&quot;
          </p>
        </div>
      </div>
    )
  }

  if (message.type === 'system') {
    return (
      <div className="mb-4 animate-fadeIn">
        <p className="text-xs text-foreground/40 italic text-center uppercase tracking-widest">
          {message.content}
        </p>
      </div>
    )
  }

  return null
}

export function StoryLog() {
  const { messages, isDMThinking } = useGameStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isDMThinking])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      {messages.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-center text-sm mt-8">
          Your adventure begins...
        </p>
      )}

      {messages.filter(m => m.type !== 'dice_roll').map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isDMThinking && (
        <div className="mb-4 animate-fadeIn">
          <p className="text-gray-400 dark:text-gray-500 italic text-sm">
            The Dungeon Master considers...
            <span className="inline-block ml-1 animate-pulse">▊</span>
          </p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}