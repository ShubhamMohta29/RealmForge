'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">⚔️</p>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-gray-300 mt-1">Sign in to continue your adventure</p>
        </div>

        <div className="space-y-3 mb-4">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            type="email"
            className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 dark:bg-black/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-highlight"
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            type="password"
            className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 dark:bg-black/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-highlight"
          />
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="w-full btn-amber disabled:opacity-50 font-medium rounded-xl py-3 transition-colors mb-3"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-sm text-center text-gray-400">
          No account?{' '}
          <Link href="/register" className="text-amber-highlight hover:underline">Create one</Link>
        </p>

        <p className="text-[10px] text-center text-gray-600 mt-6">
          By signing in you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-400">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-gray-400">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}