import { contextBridge, ipcRenderer } from 'electron'
import type {
  StoredRunePage,
  AppSettings,
  LcuStatus,
  ChampSelectPhase,
  ChampSelectQueue,
  ApplyResult,
  RunePageData,
  UpdateStatus
} from '../renderer/src/types/index'
import type {
  DecodeResult,
  PreviewSize,
  SharePagePayload,
  ShareImageRequest,
  ShareImageResult
} from '../renderer/src/types/share'

contextBridge.exposeInMainWorld('api', {
  // Rune pages CRUD
  getRunePages: (): Promise<StoredRunePage[]> => ipcRenderer.invoke('db:rune-pages:get'),

  createRunePage: (
    page: Omit<StoredRunePage, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StoredRunePage> => ipcRenderer.invoke('db:rune-pages:create', page),

  updateRunePage: (
    id: string,
    page: Partial<Omit<StoredRunePage, 'id' | 'createdAt'>>
  ): Promise<StoredRunePage> => ipcRenderer.invoke('db:rune-pages:update', id, page),

  deleteRunePage: (id: string): Promise<void> => ipcRenderer.invoke('db:rune-pages:delete', id),

  importFromLcu: (lcuPageId: number): Promise<StoredRunePage> =>
    ipcRenderer.invoke('db:rune-pages:import-from-lcu', lcuPageId),

  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('db:settings:get'),

  setSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('db:settings:set', settings),

  findReservedPage: (): Promise<{
    found: boolean
    pageId?: number
    pageName?: string
  }> => ipcRenderer.invoke('lcu:find-reserved-page'),

  // LCU operations
  getLcuPages: () => ipcRenderer.invoke('lcu:pages:list'),

  applyRunePage: (storedPageId: string): Promise<ApplyResult> =>
    ipcRenderer.invoke('lcu:pages:apply', storedPageId),

  /** Apply a rune selection that has no stored row — e.g. a built-in default page. */
  applyRunePageData: (page: RunePageData): Promise<ApplyResult> =>
    ipcRenderer.invoke('lcu:pages:apply-data', page),

  getLcuStatus: (): Promise<LcuStatus> => ipcRenderer.invoke('lcu:status:get'),

  // Sharing
  sharePageImage: (req: ShareImageRequest): Promise<ShareImageResult> =>
    ipcRenderer.invoke('share:page-image', req),

  encodePageCode: (page: SharePagePayload): Promise<string> =>
    ipcRenderer.invoke('share:encode-code', page),

  decodePageCode: (code: string): Promise<DecodeResult> =>
    ipcRenderer.invoke('share:decode-code', code),

  /** Preview window only: the page this hidden window was opened to render. */
  previewPayload: (): Promise<SharePagePayload | null> => ipcRenderer.invoke('preview:payload'),

  /** Preview window only: painted, and this is the size it drew — capture now. */
  previewSize: (size: PreviewSize): void => ipcRenderer.send('preview:size', size),

  // Updates
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('updater:get-version'),

  installUpdate: (): Promise<void> => ipcRenderer.invoke('updater:install'),

  // Push subscriptions
  onLcuStatus: (cb: (status: LcuStatus) => void) => {
    const handler = (_: Electron.IpcRendererEvent, s: LcuStatus) => cb(s)
    ipcRenderer.on('lcu:status', handler)
    return () => ipcRenderer.removeListener('lcu:status', handler)
  },

  onChampSelectPhase: (cb: (phase: ChampSelectPhase) => void) => {
    const handler = (_: Electron.IpcRendererEvent, d: ChampSelectPhase) => cb(d)
    ipcRenderer.on('champ-select:phase', handler)
    return () => ipcRenderer.removeListener('champ-select:phase', handler)
  },

  onChampSelectSession: (cb: (session: unknown) => void) => {
    const handler = (_: Electron.IpcRendererEvent, d: unknown) => cb(d)
    ipcRenderer.on('champ-select:session', handler)
    return () => ipcRenderer.removeListener('champ-select:session', handler)
  },

  onChampSelectQueue: (cb: (queue: ChampSelectQueue) => void) => {
    const handler = (_: Electron.IpcRendererEvent, q: ChampSelectQueue) => cb(q)
    ipcRenderer.on('champ-select:queue', handler)
    return () => ipcRenderer.removeListener('champ-select:queue', handler)
  },

  /** Fires when a tracked game resolves and the pages' win/loss records change. */
  onRunePagesChanged: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.on('rune-pages:changed', handler)
    return () => ipcRenderer.removeListener('rune-pages:changed', handler)
  },

  onUpdateStatus: (cb: (status: UpdateStatus) => void) => {
    const handler = (_: Electron.IpcRendererEvent, s: UpdateStatus) => cb(s)
    ipcRenderer.on('update:status', handler)
    return () => ipcRenderer.removeListener('update:status', handler)
  }
})
