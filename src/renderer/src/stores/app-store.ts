import { create } from 'zustand'
import type { StoredRunePage, AppSettings, LcuConnectionStatus, ChampSelectPhase } from '../types'

interface AppStore {
  lcuStatus: LcuConnectionStatus
  runePages: StoredRunePage[]
  settings: AppSettings | null
  champSelectActive: boolean
  champSelectPhase: string
  selectedPageForApply: string | null
  lastApplyStatus: 'idle' | 'success' | 'error'
  lastAppliedName: string | null
  lastApplyError: string | null

  setLcuStatus: (status: LcuConnectionStatus) => void
  setRunePages: (pages: StoredRunePage[]) => void
  setSettings: (settings: AppSettings) => void
  setChampSelectPhase: (phase: ChampSelectPhase) => void
  setSelectedPageForApply: (id: string | null) => void
  setApplyResult: (status: 'idle' | 'success' | 'error', name?: string, error?: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  lcuStatus: 'disconnected',
  runePages: [],
  settings: null,
  champSelectActive: false,
  champSelectPhase: 'None',
  selectedPageForApply: null,
  lastApplyStatus: 'idle',
  lastAppliedName: null,
  lastApplyError: null,

  setLcuStatus: (status) => set({ lcuStatus: status }),
  setRunePages: (pages) => set({ runePages: pages }),
  setSettings: (settings) => set({ settings }),
  setChampSelectPhase: (phase) => set({ champSelectActive: phase.active, champSelectPhase: phase.phase }),
  setSelectedPageForApply: (id) => set({ selectedPageForApply: id }),
  setApplyResult: (status, name, error) =>
    set({ lastApplyStatus: status, lastAppliedName: name ?? null, lastApplyError: error ?? null })
}))
