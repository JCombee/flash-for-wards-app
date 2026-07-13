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
  /** Positions this page is for. Empty = any position. */
  positions?: Position[]
  /** Game modes this page is for (CLASSIC / ARAM / …). Empty = any mode. */
  gameModes?: string[]
  /** Aggregated from the games this page was applied in. Absent = never used. */
  stats?: RunePageStats
}

export interface RunePageStats {
  /** Games this page was applied in, including remakes and unresolved ones. */
  games: number
  wins: number
  losses: number
  remakes: number
  /** Games whose result hasn't been read back from match history yet. */
  pending: number
  /** wins / (wins + losses); null until there is a decided game. */
  winRate: number | null
}

export type GameOutcome = 'pending' | 'win' | 'loss' | 'remake' | 'unknown'

/** One game a rune page was applied in. */
export interface PageGame {
  gameId: number
  pageId: string
  championId: number
  queueId: number
  gameMode: string
  position: string
  startedAt: number
  outcome: GameOutcome
}

export const POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const
export type Position = (typeof POSITIONS)[number]

/** Game modes worth offering as page filters — the LCU reports many more. */
export const GAME_MODES = ['CLASSIC', 'ARAM', 'CHERRY', 'URF', 'NEXUSBLITZ'] as const

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
  /** Closing the window hides it to the tray instead of quitting. */
  closeToTray: boolean
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

/** The queue the current champ select belongs to. Empty gameMode = not known yet. */
export interface ChampSelectQueue {
  queueId: number
  gameMode: string
  queueName: string
}

/** One queue's ranked standing. Absent (null) when the player has never played it. */
export interface RankedEntry {
  /** IRON … CHALLENGER. Empty when unranked. */
  tier: string
  /** I … IV. Empty above Diamond, where Riot reports 'NA'. */
  division: string
  leaguePoints: number
  wins: number
  losses: number
}

/** One player in the current champ select or game. */
export interface InGamePlayer {
  /** Empty when Riot withholds the identity (enemy team in ranked champ select). */
  puuid: string
  /** 'Name#TAG'. Empty when unknown. */
  riotId: string
  /** 0 when unknown. */
  summonerLevel: number
  /** 0 when not picked yet, or when only the champion's name is known. */
  championId: number
  /** Set by the Live Client fallback, which reports names rather than IDs. */
  championName: string
  soloRank: RankedEntry | null
  flexRank: RankedEntry | null
}

export interface InGameSnapshot {
  active: boolean
  /** 'ChampSelect' | 'InProgress' | '' */
  phase: string
  /** Which path produced the rosters — the Live Client one carries no level or rank. */
  source: 'lcu' | 'live-client' | ''
  /** The client's region, e.g. 'EUW'. Empty when the lookup failed. Needed to link out to profile sites. */
  region: string
  allyTeam: InGamePlayer[]
  enemyTeam: InGamePlayer[]
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
