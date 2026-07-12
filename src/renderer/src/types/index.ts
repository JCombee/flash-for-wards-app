export interface StoredRunePage {
  id: string
  name: string
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
  createdAt: number
  updatedAt: number
  lastUsedAt?: number
  pinned?: boolean
  /** Champion IDs that prefer this page — surfaced in champ select. */
  championIds?: number[]
}

/** The rune selection itself, without any of the stored-page bookkeeping. */
export interface RunePageData {
  name: string
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
}

/** Riot's recommended page for a champion, bundled at build time. Not in the DB. */
export interface DefaultRunePage {
  championId: number
  /** Riot's default lane for the champion — TOP / JUNGLE / MIDDLE / BOTTOM / UTILITY. */
  position: string
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
}

export interface AppSettings {
  reservedPageId: number | null
  reservedPageName: string
  onboardingComplete: boolean
  autoFocusOnChampSelect: boolean
  launchOnStartup: boolean
}

export interface LcuRunePage {
  id: number
  name: string
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
  isActive: boolean
  isDeletable: boolean
  isEditable: boolean
  isValid: boolean
  order: number
}

export type LcuConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface LcuStatus {
  status: LcuConnectionStatus
  port?: number
}

export interface ChampSelectPhase {
  active: boolean
  phase: string
}

export interface ApplyResult {
  success: boolean
  error?:
    | 'page_not_found'
    | 'no_reserved_page'
    | 'reserved_page_missing'
    | 'lcu_disconnected'
    | 'not_in_champ_select'
    | 'unknown'
  errorDetail?: string
}

export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'available'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string }
