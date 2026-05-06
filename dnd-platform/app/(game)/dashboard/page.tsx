'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  name: string
  setting: string
  dm_mode: string
  status: string
  session_count: number
  invite_code: string
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: members } = await supabase
        .from('campaign_members')
        .select('campaign_id')
        .eq('user_id', user.id)

      if (members && members.length > 0) {
        const ids = members.map(m => m.campaign_id)
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .in('id', ids)
        setCampaigns(data || [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleJoin() {
    const code = joinCode.trim()
    if (!code) return

    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('invite_code', code)
      .single()

    if (!campaign) { alert('Campaign not found'); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('campaign_members').upsert({
      campaign_id: campaign.id,
      user_id: user.id
    })

    router.push(`/campaign/${campaign.id}/create-character`)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Your Campaigns
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Pick up where you left off or start a new adventure
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm px-4 py-2 bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg backdrop-blur-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center mb-6">
            <p className="text-4xl mb-4">⚔️</p>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No campaigns yet</p>
            <p className="text-sm text-gray-400">Create one or join with an invite code</p>
          </div>
        ) : (
          <div className="grid gap-4 mb-6">
            {campaigns.map(campaign => (
  <div
    key={campaign.id}
    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
  >
    <div
      className="flex-1 cursor-pointer"
      onClick={() => router.push(`/campaign/${campaign.id}/play`)}
    >
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {campaign.name}
        </h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          campaign.dm_mode === 'ai'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
            : 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
        }`}>
          {campaign.dm_mode === 'ai' ? 'AI DM' : 'Human DM'}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{campaign.setting}</p>
      <p className="text-xs text-gray-400 mt-1">
        {campaign.session_count} sessions · Invite: {campaign.invite_code}
      </p>
    </div>
    <div className="flex flex-col gap-2 ml-4">
      <button
        onClick={() => router.push(`/campaign/${campaign.id}/play`)}
        className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Play →
      </button>
      {campaign.dm_mode === 'human' && (
        <button
          onClick={() => router.push(`/campaign/${campaign.id}/dm-console`)}
          className="text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          DM Console
        </button>
      )}
    </div>
  </div>
))}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/create-campaign')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-6 text-left transition-colors"
          >
            <p className="text-2xl mb-2">+</p>
            <p className="font-semibold">New campaign</p>
            <p className="text-sm text-emerald-200 mt-1">Start a fresh adventure</p>
          </button>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Join campaign</p>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Invite code"
              className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-900 dark:text-gray-100 mb-2 focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={handleJoin}
              className="w-full text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg py-2 hover:opacity-80 transition-opacity"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}