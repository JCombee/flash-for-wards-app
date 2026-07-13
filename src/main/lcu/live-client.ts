import https from 'https'

/**
 * The Live Client Data API — served by the game process itself, not the client,
 * on a fixed port with no auth. It only exists while a game is actually running,
 * and comes up a good while after the gameflow phase turns InProgress, so every
 * call here is expected to fail until then.
 *
 * It knows the full roster of both teams even when the LCU withholds enemy
 * identities, but it has no puuid, so nothing here can be enriched with a level
 * or a rank.
 */
const PORT = 2999
const TIMEOUT_MS = 2000

const agent = new https.Agent({ rejectUnauthorized: false })

export interface LiveClientPlayer {
  riotIdGameName?: string
  riotIdTagLine?: string
  /** Display name, e.g. 'Lee Sin' — not a champion ID. */
  championName?: string
  team?: 'ORDER' | 'CHAOS'
}

function liveClientRequest<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: '127.0.0.1', port: PORT, path, method: 'GET', agent },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Live Client ${res.statusCode}: ${data}`))
            return
          }
          try {
            resolve(JSON.parse(data) as T)
          } catch {
            reject(new Error('Live Client returned unparseable body'))
          }
        })
      }
    )

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error('Live Client request timeout'))
    })

    req.on('error', reject)
    req.end()
  })
}

/** Rejects until the game window is up. Callers must treat that as "not ready yet". */
export function getLivePlayerList(): Promise<LiveClientPlayer[]> {
  return liveClientRequest<LiveClientPlayer[]>('/liveclientdata/playerlist')
}
