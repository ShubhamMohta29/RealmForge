'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Button } from '@/components/ui/Button'

interface DiceRollModalProps {
  onRollComplete: (result: number, success: boolean) => void
}

export function DiceRollModal({ onRollComplete }: DiceRollModalProps) {
  const { pendingRollRequest, setPendingRollRequest } = useGameStore()
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<{ roll: number; total: number; success: boolean } | null>(null)

  if (!pendingRollRequest) return null

  async function handleRoll() {
    setRolling(true)
    try {
      const response = await fetch('/api/dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notation: '1d20' })
      })
      const data = await response.json()
      const roll = data.rolls[0]
      const total = roll + 3 // TODO: use actual modifier
      const success = pendingRollRequest?.dc ? total >= pendingRollRequest.dc : true

      setResult({ roll, total, success })
    } catch {
      setResult({ roll: 10, total: 13, success: true })
    }
    setRolling(false)
  }

  function handleConfirm() {
    if (!result) return
    onRollComplete(result.total, result.success)
    setResult(null)
    setPendingRollRequest(null)
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 w-full max-w-sm text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
          {pendingRollRequest.type.replace('_', ' ')}
        </p>
        <h2 className="text-xl font-semibold text-white mb-1">
          {pendingRollRequest.skill || pendingRollRequest.ability || 'Roll'}
        </h2>
        {pendingRollRequest.dc && (
          <p className="text-sm text-gray-400 mb-6">DC {pendingRollRequest.dc}</p>
        )}

        {!result ? (
          <button
            onClick={handleRoll}
            disabled={rolling}
            className="w-24 h-24 rounded-2xl bg-amber-main/20 text-amber-highlight text-4xl mx-auto flex items-center justify-center hover:bg-amber-main/30 transition-colors disabled:animate-pulse border border-amber-main/30"
          >
            🎲
          </button>
        ) : (
          <div className="space-y-4">
            <div className={`w-24 h-24 rounded-2xl mx-auto flex items-center justify-center text-4xl font-bold ${
              result.success
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300'
            }`}>
              {result.roll}
            </div>
            <p className="text-sm text-gray-300">
              Roll {result.roll} + modifier = <strong className="text-white">{result.total}</strong>
              {pendingRollRequest.dc && ` vs DC ${pendingRollRequest.dc}`}
            </p>
            <p className={`text-lg font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success ? 'Success!' : 'Failure'}
            </p>
            <Button onClick={handleConfirm} variant="primary" className="w-full">
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}