'use client'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'

function DMFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 glass rounded-2xl border border-red-500/30 bg-red-500/5 text-center">
      <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">
        The DM has gone quiet
      </p>
      <p className="text-sm text-foreground/70 max-w-xs">
        Something went wrong with the AI. Your session is safe — try again in a moment.
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className="text-[10px] text-red-400/60 font-mono max-w-xs break-words">
          {error instanceof Error ? error.message : String(error)}
        </p>
      )}
      <button
        onClick={resetErrorBoundary}
        className="btn-amber px-6 py-2 rounded-xl text-sm font-bold shadow-lg"
      >
        Try again
      </button>
    </div>
  )
}

interface Props {
  children: React.ReactNode
}

export function DMErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundary
      FallbackComponent={DMFallback}
      onError={(error: unknown) => {
        // In production this will be picked up by Sentry's automatic instrumentation.
        // Keep the console.error so it surfaces in Vercel function logs too.
        console.error('[DMErrorBoundary]', error)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
