'use client'
import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Message } from '@/types/message'

function MessageBubble({ message }: { message: Message }) {
  if (message.type === 'narration') {
    const cleanContent = message.content
      .replace(/<[^>]+\/>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    return (
      <div className="mb-4 animate-fadeIn">
        <p className="text-gray-900 dark:text-gray-100 leading-relaxed text-base"
           style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
          {cleanContent}
        </p>
      </div>
    )
  }

  if (message.type === 'player_action') {
    return (
      <div className="mb-3 pl-3 border-l-2 border-gray-300 dark:border-gray-600 animate-fadeIn">
        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
          {message.content}
        </p>
      </div>
    )
  }

  if (message.type === 'dice_roll') {
    return (
      <div className="mb-2 animate-fadeIn">
        <p className="text-sm font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-3 py-1.5 rounded-lg inline-block">
          🎲 {message.content}
        </p>
      </div>
    )
  }

  if (message.type === 'system') {
    return (
      <div className="mb-2 animate-fadeIn">
        <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center">
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

      {messages.map(message => (
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