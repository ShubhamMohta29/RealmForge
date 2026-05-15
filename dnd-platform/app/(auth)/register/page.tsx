'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [name, setName]             = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [emailSent, setEmailSent]   = useState(false)
  const router = useRouter()

  async function handleRegister() {
    if (!email || !password || !name || !dateOfBirth) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, date_of_birth: dateOfBirth },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setEmailSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        {emailSent ? (
          <>
            <h1 className="text-2xl font-bold text-white mb-6">Check your email</h1>
            <p className="text-sm text-gray-300 mb-6">Check your email to confirm your account before signing in.</p>
            <p className="text-sm text-center text-gray-400">
              Already signed in?{' '}
              <Link href="/dashboard" className="text-amber-highlight hover:underline">Go to dashboard</Link>
            </p>
          </>
        ) : (
          <>
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
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date of birth</label>
                <input
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 dark:bg-black/20 text-white focus:outline-none focus:border-amber-highlight [color-scheme:dark]"
                />
                <p className="text-xs text-gray-500 mt-1">Used to set appropriate content for your age group.</p>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <button
              onClick={handleRegister}
              disabled={loading || !email || !password || !name || !dateOfBirth}
              className="w-full btn-amber disabled:opacity-50 font-medium rounded-xl py-3 transition-colors mb-3"
            >
              {loading ? 'Creating...' : 'Create account'}
            </button>

            <p className="text-sm text-center text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-amber-highlight hover:underline">Sign in</Link>
            </p>

            <p className="text-[10px] text-center text-gray-600 mt-4">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="underline hover:text-gray-400">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="underline hover:text-gray-400">Privacy Policy</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}