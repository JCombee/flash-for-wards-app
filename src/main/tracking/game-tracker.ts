import { lcuConnection } from '../lcu/connection'
import {
  getChampSelectSession,
  getCurrentSummoner,
  getGameflowSession,
  getLcuPages,
  getMatchById,
  getRecentMatches
} from '../lcu/rune-api'
import type { LcuMatch, LcuMatchParticipant } from '../lcu/rune-api'
import { getSettings } from '../db/settings-repo'
import {
  bumpAttempts,
  getPendingGames,
  recordGameStart,
  resolveGame
} from '../db/game-results-repo'
import type { GameOutcome } from '@shared/index'

/** A page applied in the champ select we're currently in. Never persisted — a dodge must leave no trace. */
interface PendingApply {
  pageId: string
  perkIds: number[]
  appliedAt: number
  championId: number
  position: string
}

/** Match history indexes a few seconds after the game ends, so try a few times. */
const RESOLVE_DELAYS_MS = [5000, 15000, 30000, 60000]

/** Below this, the game was a remake — it says nothing about the rune page. */
const REMAKE_MAX_DURATION_S = 300

/** Phases that mean the champ select never became a game (dodge, declined ready check). */
const DROP_PHASES = new Set(['None', 'Lobby', 'Matchmaking', 'ReadyCheck'])

/** Phases after which a result may be readable from match history. */
const END_PHASES = new Set(['WaitingForStats', 'PreEndOfGame', 'EndOfGame', 'None'])

let pendingApply: PendingApply | null = null
let resolveTimers: NodeJS.Timeout[] = []
let onStatsChanged: (() => void) | null = null

/** Called whenever a game resolves, so the renderer can repaint the cards. */
export function setOnStatsChanged(cb: () => void): void {
  onStatsChanged = cb
}

/**
 * Remember that a page was applied in the current champ select. The champion and
 * position are read from the live session, so a page applied before locking in
 * still records what was actually played most of the time.
 */
export function notePageApplied(pageId: string, perkIds: number[]): void {
  const apply: PendingApply = {
    pageId,
    perkIds,
    appliedAt: Date.now(),
    championId: 0,
    position: ''
  }
  pendingApply = apply

  void (async () => {
    try {
      const session = await getChampSelectSession(lcuConnection.getCredentials())
      const me = session.myTeam?.find((p) => p.cellId === session.localPlayerCellId)
      // A second apply may have superseded this one while we were awaiting.
      if (pendingApply !== apply) return
      apply.championId = me?.championId || me?.championPickIntent || 0
      apply.position = (me?.assignedPosition ?? '').toUpperCase()
    } catch {
      // Champion stays 0 — it's only a last-resort join key for the result lookup.
    }
  })()
}

export function onPhaseChange(phase: string): void {
  if (phase === 'InProgress') {
    const apply = pendingApply
    pendingApply = null
    if (apply) void captureGameStart(apply)
    return
  }

  // The champ select ended without a game — nothing to attribute a result to.
  if (DROP_PHASES.has(phase)) pendingApply = null
  if (END_PHASES.has(phase)) scheduleResolveBurst()
}

export function onLcuConnected(): void {
  // Recovers games that were in flight when the app was last closed: their rows
  // are already on disk as 'pending'.
  void reconcilePending()
}

export function stopTracking(): void {
  clearResolveBurst()
  pendingApply = null
}

/**
 * A game just started with our page applied. Record it — unless the client says
 * this isn't a real game, or the user changed their runes in the client after we
 * applied, in which case the page didn't decide anything.
 */
async function captureGameStart(apply: PendingApply): Promise<void> {
  if (!lcuConnection.isConnected()) return

  try {
    const credentials = lcuConnection.getCredentials()
    const session = await getGameflowSession(credentials)
    const gameId = session.gameData?.gameId ?? 0
    const queue = session.gameData?.queue

    // Practice Tool games never reach match history, so they'd stay pending forever.
    if (!gameId || queue?.type === 'PRACTICETOOL') return

    const settings = getSettings()
    const lcuPages = await getLcuPages(credentials)
    const reserved = lcuPages.find((p) => p.id === settings.reservedPageId)
    if (!reserved?.isActive || !samePerks(reserved.selectedPerkIds, apply.perkIds)) return

    const me = await getCurrentSummoner(credentials)

    recordGameStart({
      gameId,
      pageId: apply.pageId,
      puuid: me.puuid,
      championId: apply.championId,
      queueId: queue?.id ?? 0,
      gameMode: queue?.gameMode ?? '',
      position: apply.position,
      appliedAt: apply.appliedAt,
      startedAt: Date.now()
    })
    onStatsChanged?.()
  } catch {
    // The game just isn't tracked. Never surfaced — the user didn't ask for this.
  }
}

function samePerks(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}

function scheduleResolveBurst(): void {
  clearResolveBurst()
  resolveTimers = RESOLVE_DELAYS_MS.map((delay) =>
    setTimeout(async () => {
      const remaining = await reconcilePending()
      if (!remaining) clearResolveBurst()
    }, delay)
  )
}

function clearResolveBurst(): void {
  resolveTimers.forEach(clearTimeout)
  resolveTimers = []
}

/** Resolve every pending game we can. Returns whether any are still unresolved. */
export async function reconcilePending(): Promise<boolean> {
  const rows = getPendingGames()
  if (rows.length === 0) return false
  if (!lcuConnection.isConnected()) return true

  try {
    const credentials = lcuConnection.getCredentials()
    const me = await getCurrentSummoner(credentials)
    const recent = await getRecentMatches(credentials, 20)
    let changed = false

    for (const row of rows) {
      // A different account is logged in — its match history can't answer for this game.
      if (row.puuid !== me.puuid) continue

      let match = recent.find((m) => m.gameId === row.gameId)
      if (!match) {
        // Fell out of the recent list (the app was closed for a while).
        match = await getMatchById(credentials, row.gameId).catch(() => undefined)
      }

      const outcome = match ? outcomeFor(match, me.puuid, row.championId) : undefined
      if (outcome) {
        resolveGame(row.gameId, outcome)
        changed = true
      } else {
        bumpAttempts(row.gameId)
      }
    }

    if (changed) onStatsChanged?.()
  } catch {
    // Leave the rows pending; the next connect or game end tries again.
  }

  return getPendingGames().length > 0
}

function outcomeFor(
  match: LcuMatch,
  puuid: string,
  championId: number
): Exclude<GameOutcome, 'pending' | 'unknown'> | undefined {
  const stats = statsFor(match, puuid, championId)
  if (!stats) return undefined

  if (stats.gameEndedInEarlySurrender) return 'remake'
  if (typeof stats.win !== 'boolean') return undefined

  const duration = match.gameDuration ?? 0
  if (duration > 0 && duration < REMAKE_MAX_DURATION_S) return 'remake'

  return stats.win ? 'win' : 'loss'
}

function statsFor(
  match: LcuMatch,
  puuid: string,
  championId: number
): LcuMatchParticipant['stats'] | undefined {
  const participants = match.participants ?? []

  // The current-summoner match history returns only the local player.
  if (participants.length === 1) return participants[0].stats

  // Riot zeroes out summonerId/accountId in match DTOs, so puuid is the only join.
  const identity = match.participantIdentities?.find((i) => i.player?.puuid === puuid)
  if (identity) {
    return participants.find((p) => p.participantId === identity.participantId)?.stats
  }

  // Some patches blank the puuid too; the champion we recorded is the last resort.
  if (championId > 0) return participants.find((p) => p.championId === championId)?.stats
  return undefined
}
