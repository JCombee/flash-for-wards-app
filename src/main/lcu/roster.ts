import {
  getChampSelectSession,
  getCurrentSummoner,
  getGameflowSession,
  getRankedStats,
  getRegion,
  getSummonerByPuuid,
  lookupPuuidByRiotId
} from './rune-api'
import { getLivePlayerList } from './live-client'
import type { LcuChampSelectMember, LcuLobbyMember, LcuRankedQueue, LcuSummoner } from './rune-api'
import type { LiveClientPlayer } from './live-client'
import type { Credentials } from 'league-connect'
import type { InGamePlayer, InGameSnapshot, RankedEntry } from '@shared/index'

const SOLO_QUEUE = 'RANKED_SOLO_5x5'
const FLEX_QUEUE = 'RANKED_FLEX_SR'

/**
 * Identity, level and rank never change over the course of a game, so they're
 * fetched once per puuid and reused on every rebuild. Champion IDs are *not*
 * cached — they keep changing as picks lock in.
 */
const profileCache = new Map<string, Promise<EnrichedProfile>>()
/**
 * The same profiles again, keyed by Riot ID and only once they've resolved. The
 * Live Client fallback identifies players by name alone, so this is the only way
 * to keep the level and rank we already looked up during champ select.
 */
const profilesByRiotId = new Map<string, EnrichedProfile>()
/** Riot ID → puuid, including the empty misses for bots. */
const aliasCache = new Map<string, string>()
let localPuuid: string | null = null
let region: string | null = null

interface EnrichedProfile {
  riotId: string
  summonerLevel: number
  soloRank: RankedEntry | null
  flexRank: RankedEntry | null
}

const EMPTY_SNAPSHOT: InGameSnapshot = {
  active: false,
  phase: '',
  source: '',
  region: '',
  allyTeam: [],
  enemyTeam: []
}

/** The snapshot last pushed to the renderer, so a window opened mid-game can catch up. */
let lastSnapshot: InGameSnapshot = EMPTY_SNAPSHOT

export function setLastSnapshot(snapshot: InGameSnapshot): void {
  lastSnapshot = snapshot
}

export function getLastSnapshot(): InGameSnapshot {
  return lastSnapshot
}

export function emptySnapshot(): InGameSnapshot {
  return EMPTY_SNAPSHOT
}

/** Drop everything remembered about the game that just ended. */
export function resetRosterCache(): void {
  profileCache.clear()
  profilesByRiotId.clear()
  aliasCache.clear()
  localPuuid = null
  region = null
  lastSnapshot = EMPTY_SNAPSHOT
}

function riotIdOf(summoner: LcuSummoner): string {
  if (!summoner.gameName) return ''
  return summoner.tagLine ? `${summoner.gameName}#${summoner.tagLine}` : summoner.gameName
}

function toRankedEntry(queue: LcuRankedQueue | undefined): RankedEntry | null {
  if (!queue) return null
  return {
    tier: queue.tier && queue.tier !== 'NONE' ? queue.tier : '',
    // Riot fills in 'NA' above Diamond, where divisions don't exist.
    division: queue.division && queue.division !== 'NA' ? queue.division : '',
    leaguePoints: queue.leaguePoints ?? 0,
    wins: queue.wins ?? 0,
    losses: queue.losses ?? 0
  }
}

/**
 * A puuid that resolves to no summoner is a bot: the alias lookup happily returns
 * one, but every route behind it 404s, leaving an empty profile. Folding that into
 * a row would wipe the name and champion the Live Client already gave us, so an
 * unresolved profile is dropped rather than merged.
 */
function mergeProfile(base: InGamePlayer, profile: EnrichedProfile): InGamePlayer {
  if (!profile.summonerLevel) return base
  return {
    ...base,
    riotId: profile.riotId || base.riotId,
    summonerLevel: profile.summonerLevel,
    soloRank: profile.soloRank,
    flexRank: profile.flexRank
  }
}

async function fetchProfile(credentials: Credentials, puuid: string): Promise<EnrichedProfile> {
  const [summoner, ranked] = await Promise.allSettled([
    getSummonerByPuuid(credentials, puuid),
    getRankedStats(credentials, puuid)
  ])

  const s = summoner.status === 'fulfilled' ? summoner.value : undefined
  const queueMap = ranked.status === 'fulfilled' ? (ranked.value?.queueMap ?? {}) : {}

  return {
    riotId: s ? riotIdOf(s) : '',
    summonerLevel: s?.summonerLevel ?? 0,
    soloRank: toRankedEntry(queueMap[SOLO_QUEUE]),
    flexRank: toRankedEntry(queueMap[FLEX_QUEUE])
  }
}

/** Memoised on the promise, so ten near-simultaneous rebuilds still do one fetch each. */
function profileOf(credentials: Credentials, puuid: string): Promise<EnrichedProfile> {
  let pending = profileCache.get(puuid)
  if (!pending) {
    // A failed lookup must not be remembered as an empty profile — drop it so the
    // next tick retries.
    pending = fetchProfile(credentials, puuid)
      .then((profile) => {
        if (profile.riotId) profilesByRiotId.set(profile.riotId, profile)
        return profile
      })
      .catch((err) => {
        profileCache.delete(puuid)
        throw err
      })
    profileCache.set(puuid, pending)
  }
  return pending
}

async function toPlayer(
  credentials: Credentials,
  puuid: string,
  championId: number
): Promise<InGamePlayer> {
  const base: InGamePlayer = {
    puuid,
    riotId: '',
    summonerLevel: 0,
    championId,
    championName: '',
    soloRank: null,
    flexRank: null
  }
  if (!puuid) return base

  try {
    return mergeProfile(base, await profileOf(credentials, puuid))
  } catch {
    // Identity withheld or the client hiccuped — the row still shows the champion.
    return base
  }
}

function championIdOf(member: LcuChampSelectMember): number {
  return member.championId || member.championPickIntent || 0
}

async function localSummonerPuuid(credentials: Credentials): Promise<string> {
  if (localPuuid !== null) return localPuuid
  try {
    localPuuid = (await getCurrentSummoner(credentials)).puuid ?? ''
  } catch {
    localPuuid = ''
  }
  return localPuuid
}

/** Which regional profile site to link a player out to. Never changes while the client is up. */
async function regionOf(credentials: Credentials): Promise<string> {
  if (region !== null) return region
  try {
    region = await getRegion(credentials)
  } catch {
    region = ''
  }
  return region
}

async function champSelectSnapshot(credentials: Credentials): Promise<InGameSnapshot> {
  const session = await getChampSelectSession(credentials)
  const build = (team: LcuChampSelectMember[] | undefined) =>
    Promise.all((team ?? []).map((m) => toPlayer(credentials, m.puuid ?? '', championIdOf(m))))

  const [allyTeam, enemyTeam, theRegion] = await Promise.all([
    build(session.myTeam),
    build(session.theirTeam),
    regionOf(credentials)
  ])
  return {
    active: true,
    phase: 'ChampSelect',
    source: 'lcu',
    region: theRegion,
    allyTeam,
    enemyTeam
  }
}

/**
 * The Live Client reports a player's name but not their puuid, and every LCU
 * route that knows a level or a rank is keyed by puuid. This is the bridge.
 * Bots have no account and always miss, so the empty result is cached too —
 * otherwise every 3-second tick would re-ask about them.
 */
async function puuidForRiotId(credentials: Credentials, riotId: string): Promise<string> {
  const cached = aliasCache.get(riotId)
  if (cached !== undefined) return cached

  const [gameName, tagLine] = riotId.split('#')
  let puuid = ''
  try {
    if (gameName && tagLine) puuid = await lookupPuuidByRiotId(credentials, gameName, tagLine)
  } catch {
    puuid = ''
  }
  aliasCache.set(riotId, puuid)
  return puuid
}

async function toLivePlayer(credentials: Credentials, p: LiveClientPlayer): Promise<InGamePlayer> {
  const riotId = p.riotIdGameName
    ? p.riotIdTagLine
      ? `${p.riotIdGameName}#${p.riotIdTagLine}`
      : p.riotIdGameName
    : ''
  const base: InGamePlayer = {
    puuid: '',
    riotId,
    summonerLevel: 0,
    championId: 0,
    championName: p.championName ?? '',
    soloRank: null,
    flexRank: null
  }
  if (!riotId) return base

  // Anyone seen in champ select is already enriched; everyone else — including the
  // whole enemy team — is resolved by name and then enriched the same way.
  const known = profilesByRiotId.get(riotId)
  if (known) return mergeProfile(base, known)

  const puuid = await puuidForRiotId(credentials, riotId)
  if (!puuid) return base

  try {
    return mergeProfile({ ...base, puuid }, await profileOf(credentials, puuid))
  } catch {
    return base
  }
}

async function fromLiveClient(
  credentials: Credentials,
  players: LiveClientPlayer[],
  ourRiotId: string
): Promise<InGameSnapshot> {
  const build = (team: LiveClientPlayer[]) =>
    Promise.all(team.map((p) => toLivePlayer(credentials, p)))

  const [order, chaos, theRegion] = await Promise.all([
    build(players.filter((p) => p.team === 'ORDER')),
    build(players.filter((p) => p.team === 'CHAOS')),
    regionOf(credentials)
  ])
  const weAreChaos = chaos.some((p) => p.riotId && p.riotId === ourRiotId)

  return {
    active: true,
    phase: 'InProgress',
    source: 'live-client',
    region: theRegion,
    allyTeam: weAreChaos ? chaos : order,
    enemyTeam: weAreChaos ? order : chaos
  }
}

async function inProgressSnapshot(credentials: Credentials): Promise<InGameSnapshot> {
  const session = await getGameflowSession(credentials)
  const teamOne = session.gameData?.teamOne ?? []
  const teamTwo = session.gameData?.teamTwo ?? []
  const ourPuuid = await localSummonerPuuid(credentials)

  const identified = [...teamOne, ...teamTwo].some((m) => m.puuid)
  const weAreTeamTwo = teamTwo.some((m) => m.puuid && m.puuid === ourPuuid)
  const ours = weAreTeamTwo ? teamTwo : teamOne
  const theirs = weAreTeamTwo ? teamOne : teamTwo
  const enemyHidden = theirs.length === 0 || theirs.every((m) => !m.puuid)

  // The gameflow session hides the enemy roster in some queues, and is empty
  // altogether in others. The game process itself always knows who is playing —
  // but only by name, so this trades level and rank for a complete roster.
  if (!identified || enemyHidden) {
    try {
      const players = await getLivePlayerList()
      if (players.length > 0) {
        const us = ourPuuid ? await profileOf(credentials, ourPuuid).catch(() => null) : null
        return fromLiveClient(credentials, players, us?.riotId ?? '')
      }
    } catch {
      // Game window isn't up yet — fall through and show what the LCU gave us.
    }
  }

  const build = (team: LcuLobbyMember[]) =>
    Promise.all(team.map((m) => toPlayer(credentials, m.puuid ?? '', m.championId ?? 0)))
  const [allyTeam, enemyTeam, theRegion] = await Promise.all([
    build(ours),
    build(theirs),
    regionOf(credentials)
  ])

  return {
    active: true,
    phase: 'InProgress',
    source: 'lcu',
    region: theRegion,
    allyTeam,
    enemyTeam
  }
}

/** The one place that turns a gameflow phase into a roster. Rejects if the LCU does. */
export async function buildSnapshot(
  credentials: Credentials,
  phase: string
): Promise<InGameSnapshot> {
  if (phase === 'ChampSelect') return champSelectSnapshot(credentials)
  if (phase === 'InProgress') return inProgressSnapshot(credentials)
  return EMPTY_SNAPSHOT
}
