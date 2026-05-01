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
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md rounded-2xl rounded-tl-sm border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm max-w-5xl">
          <p className="text-gray-900 dark:text-gray-100 leading-relaxed text-base"
             style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
            {cleanContent}
          </p>
        </div>
      </div>
    )
  }

  if (message.type === 'player_action') {
    return (
      <div className="mb-3 animate-fadeIn flex justify-end">
        <div className="bg-white/30 dark:bg-gray-800/40 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl rounded-tr-sm px-5 py-3 max-w-2xl shadow-sm text-right">
          <p className="text-sm text-gray-800 dark:text-gray-200 italic font-medium">
            "{message.content}"
          </p>
        </div>
      </div>
    )
  }

  if (message.type === 'dice_roll') {
    return (
      <div className="mb-2 animate-fadeIn flex justify-end">
        <p className="text-sm font-mono text-emerald-800 dark:text-emerald-200 bg-emerald-100/40 dark:bg-emerald-950/40 backdrop-blur-md px-4 py-2 rounded-xl inline-block shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
          🎲 {message.content}
        </p>
      </div>
    )
  }

  if (message.type === 'system') {
    return (
      <div className="mb-2 animate-fadeIn flex justify-center">
        <span className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-sm px-3 py-1 rounded-full">
          {message.content}
        </span>
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