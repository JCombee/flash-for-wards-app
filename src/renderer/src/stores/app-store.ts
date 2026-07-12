import { create } from 'zustand'
import type {
  StoredRunePage,
  AppSettings,
  LcuConnectionStatus,
  ChampSelectPhase,
  UpdateStatus
} from '../types'

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
  appVersion: string
  updateStatus: UpdateStatus

  setLcuStatus: (status: LcuConnectionStatus) => void
  setAppVersion: (version: string) => void
  setUpdateStatus: (status: UpdateStatus) => void
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
  appVersion: '',
  updateStatus: { state: 'idle' },

  setLcuStatus: (status) => set({ lcuStatus: status }),
  setAppVersion: (version) => set({ appVersion: version }),
  setUpdateStatus: (status) => set({ updateStatus: status }),
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
    set({
      lastApplyStatus: status,
      lastAppliedName: name ?? null,
      lastApplyError: error ?? null
    })
}))
