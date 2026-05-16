'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Campaign {
  id: string
  name: string
  setting: string
  dm_mode: 'ai' | 'human'
  status: 'active' | 'paused' | 'completed'
  session_count: number
  invite_code: string
  dm_user_id: string | null
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserId(user.id)

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
          .order('updated_at', { ascending: false })
        setCampaigns((data as Campaign[]) || [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function handleJoin() {
    const code = joinCode.trim()
    setJoinError(null)
    if (!code) return

    const res = await fetch('/api/campaign/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
    const data = await res.json()

    if (!res.ok) {
      setJoinError(data.error || "Failed to join campaign.")
      return
    }

    const { campaignId, dmMode, dmUserId } = data
    const { data: { user } } = await supabase.auth.getUser()

    if (dmMode === 'human' && dmUserId === user?.id) {
      router.push(`/campaign/${campaignId}/dm-console`)
    } else if (data.hasCharacter) {
      router.push(`/campaign/${campaignId}/play`)
    } else {
      router.push(`/campaign/${campaignId}/create-character`)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-main/30 border-t-amber-highlight rounded-full animate-spin" />
      </div>
    )
  }

  const active   = campaigns.filter(c => c.status !== 'completed')
  const archived = campaigns.filter(c => c.status === 'completed')

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: '"Ibarra Real Nova", serif' }}>
              RealmForge
            </h1>
            <p className="text-sm text-gray-400 mt-1">Your campaigns await</p>
          </div>
          <button onClick={handleSignOut} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Sign out
          </button>
        </div>

        {/* Empty state */}
        {campaigns.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center mb-8">
            <p className="text-5xl mb-4 opacity-60">⚔</p>
            <p className="text-foreground/60 mb-1">You're not in any campaigns yet.</p>
            <p className="text-sm text-foreground/40">Create one or join with an invite code below.</p>
          </div>
        )}

        {/* Active campaigns */}
        {active.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Active Campaigns</p>
            <div className="space-y-3">
              {active.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  userId={userId}
                  onPlay={() => router.push(`/campaign/${campaign.id}/play`)}
                  onDMConsole={() => router.push(`/campaign/${campaign.id}/dm-console`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived campaigns */}
        {archived.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Archived</p>
            <div className="space-y-3">
              {archived.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  userId={userId}
                  onPlay={() => router.push(`/campaign/${campaign.id}/play`)}
                  onDMConsole={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions row */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => router.push('/create-campaign')}
            className="btn-amber rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5"
          >
            <p className="text-xl font-bold mb-1">+ New Campaign</p>
            <p className="text-sm text-amber-highlight/70">Start a fresh adventure</p>
          </button>

          <div className="glass rounded-2xl p-6">
            <p className="font-semibold text-foreground mb-3 text-sm">Join Campaign</p>
            <input
              value={joinCode}
              onChange={e => { setJoinCode(e.target.value); setJoinError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Invite code"
              className="w-full text-sm px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-gray-600 focus:outline-none focus:border-amber-main/50 mb-2"
            />
            {joinError && <p className="text-xs text-red-400 mb-2">{joinError}</p>}
            <button
              onClick={handleJoin}
              className="w-full btn-amber text-sm rounded-lg py-2 font-semibold"
            >
              Join
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

function CampaignCard({
  campaign, userId, onPlay, onDMConsole
}: {
  campaign: Campaign
  userId: string | null
  onPlay: () => void
  onDMConsole: () => void
}) {
  const isArchived = campaign.status === 'completed'
  const isDM = campaign.dm_mode === 'human' && campaign.dm_user_id === userId

  return (
    <div className={`glass rounded-2xl p-5 flex items-center justify-between hover:border-amber-main/20 transition-colors ${
      isArchived ? 'opacity-60' : ''
    }`}>
      <div className="flex-1 cursor-pointer min-w-0" onClick={isDM && !isArchived ? onDMConsole : onPlay}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h2 className="font-semibold text-foreground truncate">{campaign.name}</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0 ${
            campaign.dm_mode === 'ai'
              ? 'bg-amber-main/20 text-amber-highlight border border-amber-main/30'
              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
          }`}>
            {campaign.dm_mode === 'ai' ? 'AI DM' : 'Human DM'}
          </span>
          {isArchived && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30 font-bold uppercase tracking-wider flex-shrink-0">
              Archived
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{campaign.setting}</p>
        {!isArchived && (
          <p className="text-[10px] text-gray-600 mt-0.5">
            {campaign.session_count} session{campaign.session_count !== 1 ? 's' : ''} · Code: {campaign.invite_code}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 ml-4 flex-shrink-0">
        {isDM && !isArchived ? (
          <button
            onClick={onDMConsole}
            className="text-xs px-4 py-1.5 btn-amber rounded-lg font-semibold transition-colors"
          >
            DM Console
          </button>
        ) : (
          <button
            onClick={onPlay}
            className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition-colors ${
              isArchived
                ? 'border border-white/12 text-gray-400 hover:text-gray-300'
                : 'btn-amber'
            }`}
          >
            {isArchived ? 'Read →' : 'Play →'}
          </button>
        )}
      </div>
    </div>
  )
}
