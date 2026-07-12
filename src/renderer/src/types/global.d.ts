import type {
  StoredRunePage,
  AppSettings,
  LcuRunePage,
  LcuStatus,
  ChampSelectPhase,
  ApplyResult
} from './index'

declare global {
  interface Window {
    api: {
      // Rune pages CRUD
      getRunePages: () => Promise<StoredRunePage[]>
      createRunePage: (page: Omit<StoredRunePage, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StoredRunePage>
      updateRunePage: (id: string, page: Partial<Omit<StoredRunePage, 'id' | 'createdAt'>>) => Promise<StoredRunePage>
      deleteRunePage: (id: string) => Promise<void>
      importFromLcu: (lcuPageId: number) => Promise<StoredRunePage>

      // Settings
      getSettings: () => Promise<AppSettings>
      setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
      findReservedPage: () => Promise<{ found: boolean; pageId?: number; pageName?: string; error?: string; message?: string }>

      // LCU operations
      getLcuPages: () => Promise<LcuRunePage[]>
      applyRunePage: (storedPageId: string) => Promise<ApplyResult>
      getLcuStatus: () => Promise<LcuStatus>

      // Push subscriptions (return cleanup fn)
      onLcuStatus: (cb: (status: LcuStatus) => void) => () => void
      onChampSelectPhase: (cb: (phase: ChampSelectPhase) => void) => () => void
      onChampSelectSession: (cb: (session: unknown) => void) => () => void
    }
  }
}
