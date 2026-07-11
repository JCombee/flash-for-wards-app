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
}

export interface AppSettings {
  reservedPageId: number | null
  reservedPageName: string
  onboardingComplete: boolean
  autoFocusOnChampSelect: boolean
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
  error?: 'page_not_found' | 'no_reserved_page' | 'reserved_page_missing' | 'lcu_disconnected' | 'unknown'
  errorDetail?: string
}
