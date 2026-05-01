'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    <div className="min-h-screen bg-transparent flex items-center justify-center p-8">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">⚔️</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to continue your adventure</p>
        </div>

        <div className="space-y-3 mb-4">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            type="email"
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-400"
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            type="password"
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl py-3 transition-colors mb-3"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-sm text-center text-gray-400">
          No account?{' '}
          <a href="/register" className="text-emerald-600 hover:underline">Create one</a>
        </p>
      </div>
    </div>
  )
}