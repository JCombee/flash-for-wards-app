import { create } from 'zustand'
import type { StoredRunePage, AppSettings, LcuConnectionStatus, ChampSelectPhase } from '../types'

interface AppStore {
  lcuStatus: LcuConnectionStatus
  runePages: StoredRunePage[]
  settings: AppSettings | null
  champSelectActive: boolean
  champSelectPhase: string
  /** Local player's hovered/locked champion during champ select (0 = none). */
  currentChampionId: number
  selectedPageForApply: string | null
  lastApplyStatus: 'idle' | 'success' | 'error'
  lastAppliedName: string | null
  lastApplyError: string | null

  setLcuStatus: (status: LcuConnectionStatus) => void
  setRunePages: (pages: StoredRunePage[]) => void
  setSettings: (settings: AppSettings) => void
  setChampSelectPhase: (phase: ChampSelectPhase) => void
  setCurrentChampionId: (id: number) => void
  setSelectedPageForApply: (id: string | null) => void
  setApplyResult: (status: 'idle' | 'success' | 'error', name?: string, error?: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  lcuStatus: 'disconnected',
  runePages: [],
  settings: null,
  champSelectActive: false,
  champSelectPhase: 'None',
  currentChampionId: 0,
  selectedPageForApply: null,
  lastApplyStatus: 'idle',
  lastAppliedName: null,
  lastApplyError: null,

  setLcuStatus: (status) => set({ lcuStatus: status }),
  setRunePages: (pages) => set({ runePages: pages }),
  setSettings: (settings) => set({ settings }),
  setChampSelectPhase: (phase) =>
    set({
      champSelectActive: phase.active,
      champSelectPhase: phase.phase,
      // Clear the tracked champion when champ select ends.
      ...(phase.active ? {} : { currentChampionId: 0 })
    }),
  setCurrentChampionId: (id) => set({ currentChampionId: id }),
  setSelectedPageForApply: (id) => set({ selectedPageForApply: id }),
  setApplyResult: (status, name, error) =>
    set({ lastApplyStatus: status, lastAppliedName: name ?? null, lastApplyError: error ?? null })
}))
