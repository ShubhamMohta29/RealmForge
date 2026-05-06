import { create } from 'zustand'
import type { Campaign } from '@/types/campaign'
import type { Character } from '@/types/character'
import type { Message } from '@/types/message'
import type { CombatEncounter } from '@/types/combat'

interface GameStore {
  campaign: Campaign | null
  characters: Character[]
  myCharacter: Character | null
  messages: Message[]
  encounter: CombatEncounter | null
  isLoading: boolean
  isDMThinking: boolean
  pendingRollRequest: RollRequest | null

  setCampaign: (campaign: Campaign) => void
  setCharacters: (characters: Character[]) => void
  setMyCharacter: (character: Character) => void
  addMessage: (message: Message) => void
  setMessages: (messages: Message[]) => void
  setEncounter: (encounter: CombatEncounter | null) => void
  updateCharacterHp: (characterId: string, hp: number) => void
  setLoading: (loading: boolean) => void
  setDMThinking: (thinking: boolean) => void
  setPendingRollRequest: (roll: RollRequest | null) => void
}

export interface RollRequest {
  character: string
  type: 'skill' | 'saving_throw' | 'attack' | 'ability'
  skill?: string
  ability?: string
  dc?: number
  target?: string
}

export const useGameStore = create<GameStore>((set) => ({
  campaign: null,
  characters: [],
  myCharacter: null,
  messages: [],
  encounter: null,
  isLoading: false,
  isDMThinking: false,
  pendingRollRequest: null,

  setCampaign: (campaign) => set({ campaign }),
  setCharacters: (characters) => set({ characters }),
  setMyCharacter: (character) => set({ myCharacter: character }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  setMessages: (messages) => set({ messages }),
  setEncounter: (encounter) => set({ encounter }),
  updateCharacterHp: (characterId, hp) => set((state) => ({
    characters: state.characters.map(c => c.id === characterId ? { ...c, hp } : c),
    myCharacter: state.myCharacter?.id === characterId
      ? { ...state.myCharacter, hp }
      : state.myCharacter
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setDMThinking: (isDMThinking) => set({ isDMThinking }),
  setPendingRollRequest: (pendingRollRequest) => set({ pendingRollRequest })
}))