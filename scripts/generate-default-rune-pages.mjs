// Dev-only. Regenerates src/renderer/src/data/default-rune-pages.json from the
// running League client. Run: node scripts/generate-default-rune-pages.mjs
// (re-run each patch, or when new champions release)
//
// Requires the League client to be OPEN — the recommendations come from Riot's
// own endpoint, /lol-perks/v1/recommended-pages/champion/{id}/position/{pos}/map/{map}.
// Position NONE makes the client return its default-position pages for that
// champion; the first entry is the recommendation it highlights, so that's the
// one we bundle. The 9 perk ids come back in the same slot order the app uses
// (keystone, 3 primary, 2 secondary, 3 shards).

import { writeFile, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { authenticate, createHttp1Request } from 'league-connect'

const SUMMONERS_RIFT = 11

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'src', 'renderer', 'src', 'data')
const CHAMPIONS = join(DATA_DIR, 'champions.json')
const OUT = join(DATA_DIR, 'default-rune-pages.json')

async function recommendedPages(credentials, championId) {
  const res = await createHttp1Request(
    {
      method: 'GET',
      url: `/lol-perks/v1/recommended-pages/champion/${championId}/position/NONE/map/${SUMMONERS_RIFT}`
    },
    credentials
  )
  if (res.status !== 200) throw new Error(`champion ${championId} -> HTTP ${res.status}`)
  return res.json()
}

async function main() {
  const champions = JSON.parse(await readFile(CHAMPIONS, 'utf8'))
  console.log(`Authenticating with the League client (${champions.length} champions to fetch)...`)
  const credentials = await authenticate()

  const pages = {}
  const skipped = []

  for (const champion of champions) {
    const [page] = await recommendedPages(credentials, champion.id)
    if (!page) {
      skipped.push(champion.name)
      continue
    }
    pages[champion.id] = {
      championId: champion.id,
      position: page.position,
      primaryStyleId: page.primaryPerkStyleId,
      subStyleId: page.secondaryPerkStyleId,
      selectedPerkIds: page.perks.map((p) => p.id)
    }
  }

  await writeFile(OUT, JSON.stringify(pages, null, 2) + '\n')
  console.log(`Wrote ${OUT}`)
  console.log(`  ${Object.keys(pages).length} default pages`)
  if (skipped.length) console.log(`  no recommendation for: ${skipped.join(', ')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
