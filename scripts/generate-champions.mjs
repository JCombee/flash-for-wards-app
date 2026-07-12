// Dev-only. Regenerates src/renderer/src/data/champions.json from Community Dragon.
// Run: node scripts/generate-champions.mjs  (re-run when new champions release)
//
// Community Dragon "latest" serves current-patch metadata + icons with no auth.
// We bundle id + name; square portrait icons load from the CDN at runtime.

import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const CDRAGON = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default'
const SUMMARY_URL = `${CDRAGON}/v1/champion-summary.json`

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'renderer', 'src', 'data', 'champions.json')

// LCU/CDragon assetPath looks like "/lol-game-data/assets/v1/champion-icons/1.png".
// Map it onto the CDragon CDN base (lowercased path after "/lol-game-data/assets").
function resolveIcon(iconPath) {
  if (!iconPath) return ''
  const marker = '/lol-game-data/assets'
  const idx = iconPath.toLowerCase().indexOf(marker)
  const rest = idx >= 0 ? iconPath.slice(idx + marker.length) : iconPath
  return `${CDRAGON}${rest.toLowerCase()}`
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

async function main() {
  console.log('Fetching Community Dragon champion summary...')
  const summary = await fetchJson(SUMMARY_URL)

  const champions = summary
    // id -1 is the "None" placeholder entry.
    .filter((c) => c.id > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      iconUrl: resolveIcon(c.squarePortraitPath)
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(champions, null, 2) + '\n')
  console.log(`Wrote ${OUT}`)
  console.log(`  ${champions.length} champions total`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
