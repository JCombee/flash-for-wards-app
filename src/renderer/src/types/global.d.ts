import type {
  StoredRunePage,
  AppSettings,
  LcuRunePage,
  LcuStatus,
  ChampSelectPhase,
  ChampSelectQueue,
  ApplyResult,
  RunePageData,
  UpdateStatus,
  InGameSnapshot
} from './index'
import type {
  DecodeResult,
  PreviewSize,
  SharePagePayload,
  ShareImageRequest,
  ShareImageResult
} from './share'

declare global {
  interface Window {
    api: {
      // Rune pages CRUD
      getRunePages: () => Promise<StoredRunePage[]>
      createRunePage: (
        page: Omit<StoredRunePage, 'id' | 'createdAt' | 'updatedAt'>
      ) => Promise<StoredRunePage>
      updateRunePage: (
        id: string,
        page: Partial<Omit<StoredRunePage, 'id' | 'createdAt'>>
      ) => Promise<StoredRunePage>
      deleteRunePage: (id: string) => Promise<void>
      importFromLcu: (lcuPageId: number) => Promise<StoredRunePage>

      // Settings
      getSettings: () => Promise<AppSettings>
      setSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
      findReservedPage: () => Promise<{
        found: boolean
        pageId?: number
        pageName?: string
        error?: string
        message?: string
      }>

      // LCU operations
      getLcuPages: () => Promise<LcuRunePage[]>
      applyRunePage: (storedPageId: string) => Promise<ApplyResult>
      applyRunePageData: (page: RunePageData) => Promise<ApplyResult>
      getLcuStatus: () => Promise<LcuStatus>
      getInGameSnapshot: () => Promise<InGameSnapshot>

      // Sharing
      sharePageImage: (req: ShareImageRequest) => Promise<ShareImageResult>
      encodePageCode: (page: SharePagePayload) => Promise<string>
      decodePageCode: (code: string) => Promise<DecodeResult>
      previewPayload: () => Promise<SharePagePayload | null>
      previewSize: (size: PreviewSize) => void

      // Updates
      getAppVersion: () => Promise<string>
      installUpdate: () => Promise<void>

      // Push subscriptions (return cleanup fn)
      onLcuStatus: (cb: (status: LcuStatus) => void) => () => void
      onChampSelectPhase: (cb: (phase: ChampSelectPhase) => void) => () => void
      onChampSelectSession: (cb: (session: unknown) => void) => () => void
      onChampSelectQueue: (cb: (queue: ChampSelectQueue) => void) => () => void
      onInGameSnapshot: (cb: (snapshot: InGameSnapshot) => void) => () => void
      onRunePagesChanged: (cb: () => void) => () => void
      onUpdateStatus: (cb: (status: UpdateStatus) => void) => () => void
    }
  }
}
