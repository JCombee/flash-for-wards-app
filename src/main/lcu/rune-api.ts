import https from 'https'
import type { Credentials } from 'league-connect'
import type { LcuRunePage, StoredRunePage } from '@shared/index'

const agent = new https.Agent({ rejectUnauthorized: false })

function authHeader(credentials: Credentials): string {
  const encoded = Buffer.from(`riot:${credentials.password}`).toString('base64')
  return `Basic ${encoded}`
}

export function lcuRequest<T>(
  credentials: Credentials,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : undefined
    const options: https.RequestOptions = {
      hostname: '127.0.0.1',
      port: credentials.port,
      path,
      method,
      agent,
      headers: {
        Authorization: authHeader(credentials),
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(
            Object.assign(new Error(`LCU ${res.statusCode}: ${data}`), {
              statusCode: res.statusCode,
              body: data
            })
          )
          return
        }
        try {
          resolve(data ? JSON.parse(data) : (undefined as unknown as T))
        } catch {
          resolve(undefined as unknown as T)
        }
      })
    })

    req.setTimeout(5000, () => {
      req.destroy(new Error('LCU request timeout'))
    })

    req.on('error', reject)
    if (bodyStr) req.write(bodyStr)
    req.end()
  })
}

/** A player as the gameflow session reports them, once a game is being set up. */
export interface LcuLobbyMember {
  /** Empty string when Riot withholds the identity. */
  puuid?: string
  summonerName?: string
  championId?: number
}

export interface LcuGameflowSession {
  phase: string
  gameData?: {
    gameId?: number
    queue?: { id?: number; gameMode?: string; type?: string; description?: string }
    teamOne?: LcuLobbyMember[]
    teamTwo?: LcuLobbyMember[]
  }
}

export interface LcuChampSelectMember {
  cellId: number
  /** Empty string for the enemy team in queues that hide identities. */
  puuid?: string
  championId?: number
  championPickIntent?: number
  assignedPosition?: string
}

export interface LcuChampSelectSession {
  localPlayerCellId?: number
  myTeam?: LcuChampSelectMember[]
  theirTeam?: LcuChampSelectMember[]
}

export interface LcuSummoner {
  puuid: string
  gameName?: string
  tagLine?: string
  summonerLevel?: number
}

/** Riot reports a division of 'NA' above Diamond, and tier 'NONE' when unranked. */
export interface LcuRankedQueue {
  tier?: string
  division?: string
  leaguePoints?: number
  wins?: number
  losses?: number
}

export interface LcuRankedStats {
  queueMap?: Record<string, LcuRankedQueue>
}

export interface LcuMatchParticipant {
  participantId: number
  championId: number
  stats?: { win?: boolean; gameEndedInEarlySurrender?: boolean }
}

export interface LcuMatch {
  gameId: number
  /** Seconds. */
  gameDuration?: number
  queueId?: number
  gameMode?: string
  participants?: LcuMatchParticipant[]
  participantIdentities?: { participantId: number; player?: { puuid?: string } }[]
}

export function getCurrentSummoner(credentials: Credentials): Promise<LcuSummoner> {
  return lcuRequest<LcuSummoner>(credentials, 'GET', '/lol-summoner/v1/current-summoner')
}

/**
 * The current summoner's recent games. This variant returns only the local
 * player's participant entry, so the result needs no identity join.
 */
export async function getRecentMatches(credentials: Credentials, count = 20): Promise<LcuMatch[]> {
  const res = await lcuRequest<{ games?: { games?: LcuMatch[] } }>(
    credentials,
    'GET',
    `/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=0&endIndex=${count}`
  )
  return res?.games?.games ?? []
}

/** Full match DTO, for games that have already fallen out of the recent list. */
export function getMatchById(credentials: Credentials, gameId: number): Promise<LcuMatch> {
  return lcuRequest<LcuMatch>(credentials, 'GET', `/lol-match-history/v1/games/${gameId}`)
}

/**
 * Riot ID → puuid. The only bridge from the Live Client API (which reports names)
 * back to the LCU routes (which are all keyed by puuid). 404s for bots, which have
 * no real account behind them.
 */
export async function lookupPuuidByRiotId(
  credentials: Credentials,
  gameName: string,
  tagLine: string
): Promise<string> {
  const query = `gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`
  const res = await lcuRequest<{ puuid?: string }>(
    credentials,
    'GET',
    `/lol-summoner/v1/alias/lookup?${query}`
  )
  return res?.puuid ?? ''
}

export function getSummonerByPuuid(credentials: Credentials, puuid: string): Promise<LcuSummoner> {
  return lcuRequest<LcuSummoner>(credentials, 'GET', `/lol-summoner/v2/summoners/puuid/${puuid}`)
}

export function getRankedStats(credentials: Credentials, puuid: string): Promise<LcuRankedStats> {
  return lcuRequest<LcuRankedStats>(credentials, 'GET', `/lol-ranked/v1/ranked-stats/${puuid}`)
}

/**
 * The region the client is logged in to, e.g. 'EUW'. The LoginDataPacket platformId
 * key that would give 'EUW1' directly isn't there — this route is the one that answers.
 */
export async function getRegion(credentials: Credentials): Promise<string> {
  const res = await lcuRequest<{ region?: string }>(credentials, 'GET', '/riotclient/region-locale')
  return res?.region ?? ''
}

export function getLcuPages(credentials: Credentials): Promise<LcuRunePage[]> {
  return lcuRequest<LcuRunePage[]>(credentials, 'GET', '/lol-perks/v1/pages')
}

export function getGameflowPhase(credentials: Credentials): Promise<string> {
  return lcuRequest<string>(credentials, 'GET', '/lol-gameflow/v1/gameflow-phase')
}

/** Carries the queue (game mode) from champ select onwards, and the gameId once a game starts. */
export function getGameflowSession(credentials: Credentials): Promise<LcuGameflowSession> {
  return lcuRequest<LcuGameflowSession>(credentials, 'GET', '/lol-gameflow/v1/session')
}

/** Rejects with a 404 when not currently in champion select. */
export function getChampSelectSession(credentials: Credentials): Promise<LcuChampSelectSession> {
  return lcuRequest<LcuChampSelectSession>(credentials, 'GET', '/lol-champ-select/v1/session')
}

export function overwriteLcuPage(
  credentials: Credentials,
  pageId: number,
  reservedPageName: string,
  page: Pick<StoredRunePage, 'primaryStyleId' | 'subStyleId' | 'selectedPerkIds'>
): Promise<LcuRunePage> {
  return lcuRequest<LcuRunePage>(credentials, 'PUT', `/lol-perks/v1/pages/${pageId}`, {
    id: pageId,
    name: reservedPageName,
    primaryStyleId: page.primaryStyleId,
    subStyleId: page.subStyleId,
    selectedPerkIds: page.selectedPerkIds,
    current: true
  })
}
