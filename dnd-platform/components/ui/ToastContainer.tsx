'use client'
import { useToastStore, type Toast, type ToastType } from '@/store/toastStore'

const ICONS: Record<ToastType, string> = {
  info:    '◆',
  success: '✓',
  error:   '✕',
  xp:      '✦',
  loot:    '◈',
  levelup: '▲',
  quest:   '◉',
}

const COLOURS: Record<ToastType, { border: string; icon: string }> = {
  info:    { border: 'border-white/20',        icon: 'text-gray-300' },
  success: { border: 'border-green-500/30',    icon: 'text-green-400' },
  error:   { border: 'border-red-500/30',      icon: 'text-red-400' },
  xp:      { border: 'border-amber-main/40',   icon: 'text-amber-highlight' },
  loot:    { border: 'border-amber-main/30',   icon: 'text-amber-highlight' },
  levelup: { border: 'border-amber-main/60',   icon: 'text-amber-highlight' },
  quest:   { border: 'border-blue-400/30',     icon: 'text-blue-400' },
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore()
  const { border, icon } = COLOURS[toast.type]

  return (
    <div
      className={`glass rounded-xl px-4 py-3 flex items-start gap-3 min-w-[240px] max-w-xs border ${border} animate-toastIn`}
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
    >
      <span className={`text-base leading-none mt-0.5 flex-shrink-0 ${icon}`}>
        {ICONS[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-gray-600 hover:text-gray-400 transition-colors text-xs flex-shrink-0 mt-0.5"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
