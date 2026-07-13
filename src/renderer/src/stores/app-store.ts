import { create } from 'zustand'
import type {
  StoredRunePage,
  AppSettings,
  LcuConnectionStatus,
  ChampSelectPhase,
  ChampSelectQueue,
  InGameSnapshot,
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
  /** Assigned position, uppercase. Empty in blind pick / ARAM, where Riot reports none. */
  currentPosition: string
  /** Game mode of the current queue (CLASSIC / ARAM / …). Empty when not known. */
  currentGameMode: string
  currentQueueId: number
  selectedPageForApply: string | null
  lastApplyStatus: 'idle' | 'success' | 'error'
  lastAppliedId: string | null
  lastAppliedName: string | null
  lastApplyError: string | null
  /** Both teams for the current champ select or game. Inactive when neither is running. */
  inGameSnapshot: InGameSnapshot
  appVersion: string
  updateStatus: UpdateStatus

  setInGameSnapshot: (snapshot: InGameSnapshot) => void
  setLcuStatus: (status: LcuConnectionStatus) => void
  setAppVersion: (version: string) => void
  setUpdateStatus: (status: UpdateStatus) => void
  setRunePages: (pages: StoredRunePage[]) => void
  setSettings: (settings: AppSettings) => void
  setChampSelectPhase: (phase: ChampSelectPhase) => void
  setCurrentChampionId: (id: number) => void
  setCurrentPosition: (position: string) => void
  setCurrentQueue: (queue: ChampSelectQueue) => void
  setSelectedPageForApply: (id: string | null) => void
  setApplyResult: (
    status: 'idle' | 'success' | 'error',
    applied?: { id: string; name: string },
    error?: string
  ) => void
}

export const useAppStore = create<AppStore>((set) => ({
  lcuStatus: 'disconnected',
  runePages: [],
  settings: null,
  champSelectActive: false,
  champSelectPhase: 'None',
  currentChampionId: 0,
  currentPosition: '',
  currentGameMode: '',
  currentQueueId: 0,
  selectedPageForApply: null,
  lastApplyStatus: 'idle',
  lastAppliedId: null,
  lastAppliedName: null,
  lastApplyError: null,
  inGameSnapshot: {
    active: false,
    phase: '',
    source: '',
    region: '',
    allyTeam: [],
    enemyTeam: []
  },
  appVersion: '',
  updateStatus: { state: 'idle' },

  setInGameSnapshot: (snapshot) => set({ inGameSnapshot: snapshot }),
  setLcuStatus: (status) => set({ lcuStatus: status }),
  setAppVersion: (version) => set({ appVersion: version }),
  setUpdateStatus: (status) => set({ updateStatus: status }),
  setRunePages: (pages) => set({ runePages: pages }),
  setSettings: (settings) => set({ settings }),
  setChampSelectPhase: (phase) =>
    set({
      champSelectActive: phase.active,
      champSelectPhase: phase.phase,
      // Clear the tracked champ-select context and any stale apply result when it ends.
      ...(phase.active
        ? {}
        : {
            currentChampionId: 0,
            currentPosition: '',
            currentGameMode: '',
            currentQueueId: 0,
            lastApplyStatus: 'idle' as const,
            lastAppliedId: null,
            lastAppliedName: null,
            lastApplyError: null
          })
    }),
  setCurrentChampionId: (id) => set({ currentChampionId: id }),
  setCurrentPosition: (position) => set({ currentPosition: position }),
  setCurrentQueue: (queue) =>
    set({ currentGameMode: queue.gameMode, currentQueueId: queue.queueId }),
  setSelectedPageForApply: (id) => set({ selectedPageForApply: id }),
  setApplyResult: (status, applied, error) =>
    set({
      lastApplyStatus: status,
      lastAppliedId: applied?.id ?? null,
      lastAppliedName: applied?.name ?? null,
      lastApplyError: error ?? null
    })
}))
