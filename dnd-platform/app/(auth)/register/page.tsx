'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleRegister() {
    if (!email || !password || !name) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">Create account</h1>

        <div className="space-y-3 mb-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 dark:bg-black/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-highlight"
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 dark:bg-black/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-highlight"
          />
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 dark:bg-black/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-highlight"
          />
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleRegister}
          disabled={loading || !email || !password || !name}
          className="w-full btn-amber disabled:opacity-50 font-medium rounded-xl py-3 transition-colors mb-3"
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>

        <p className="text-sm text-center text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-amber-highlight hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}