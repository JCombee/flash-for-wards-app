import https from 'https'
import type { Credentials } from 'league-connect'
import type { LcuRunePage, StoredRunePage } from '@shared/index'

const agent = new https.Agent({ rejectUnauthorized: false })

function authHeader(credentials: Credentials): string {
  const encoded = Buffer.from(`riot:${credentials.password}`).toString('base64')
  return `Basic ${encoded}`
}

function lcuRequest<T>(
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

export function getLcuPages(credentials: Credentials): Promise<LcuRunePage[]> {
  return lcuRequest<LcuRunePage[]>(credentials, 'GET', '/lol-perks/v1/pages')
}

export function getGameflowPhase(credentials: Credentials): Promise<string> {
  return lcuRequest<string>(credentials, 'GET', '/lol-gameflow/v1/gameflow-phase')
}

/** Rejects with a 404 when not currently in champion select. */
export function getChampSelectSession(credentials: Credentials): Promise<unknown> {
  return lcuRequest<unknown>(credentials, 'GET', '/lol-champ-select/v1/session')
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
