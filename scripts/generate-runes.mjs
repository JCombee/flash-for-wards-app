// Dev-only. Regenerates src/renderer/src/data/runes.json from Community Dragon.
// Run: node scripts/generate-runes.mjs  (re-run on League patch bumps)
//
// Community Dragon "latest" serves current-patch metadata + icons with no auth.
// We bundle the tree structure + names + plain-text descriptions; icons load
// from the CDN at runtime via the resolved URLs written here.

import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const CDRAGON = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default'
const PERKSTYLES_URL = `${CDRAGON}/v1/perkstyles.json`
const PERKS_URL = `${CDRAGON}/v1/perks.json`

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'src', 'renderer', 'src', 'data', 'runes.json')

// LCU/CDragon iconPath looks like "/lol-game-data/assets/v1/perk-images/Styles/...png".
// Map it onto the CDragon CDN base (lowercased path after "/lol-game-data/assets").
function resolveIcon(iconPath) {
  if (!iconPath) return ''
  const marker = '/lol-game-data/assets'
  const idx = iconPath.toLowerCase().indexOf(marker)
  const rest = idx >= 0 ? iconPath.slice(idx + marker.length) : iconPath
  return `${CDRAGON}${rest.toLowerCase()}`
}

// Strip HTML tags and collapse whitespace to plain text for tooltips.
function plain(html) {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// Stat shards are not part of perkstyles slots — fixed set, three rows.
const SHARD_ROWS = [
  { key: 'offense', ids: [5008, 5005, 5007] },
  { key: 'flex', ids: [5008, 5010, 5001] },
  { key: 'defense', ids: [5011, 5013, 5001] }
]

// The five primary styles, in client order.
const STYLE_ORDER = [8000, 8100, 8200, 8300, 8400]

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

async function main() {
  console.log('Fetching Community Dragon perk data...')
  const [perkStyles, perks] = await Promise.all([fetchJson(PERKSTYLES_URL), fetchJson(PERKS_URL)])

  const perkById = new Map()
  for (const p of perks) {
    perkById.set(p.id, {
      id: p.id,
      name: p.name,
      // longDesc carries concrete numbers (dmg/percent); fall back to shortDesc.
      shortDesc: plain(p.longDesc || p.shortDesc),
      iconUrl: resolveIcon(p.iconPath)
    })
  }

  const stylesById = new Map(perkStyles.styles.map((s) => [s.id, s]))

  const runeStyles = STYLE_ORDER.map((styleId) => {
    const style = stylesById.get(styleId)
    if (!style) throw new Error(`style ${styleId} missing from perkstyles.json`)
    // slots[0] = keystones (type kKeyStone), then three kMixedRegularSplashable rows.
    const slots = style.slots
      .filter((slot) => slot.type === 'kKeyStone' || slot.type === 'kMixedRegularSplashable')
      .map((slot) =>
        slot.perks
          .filter((id) => id !== 0)
          .map((id) => {
            const perk = perkById.get(id)
            if (!perk) throw new Error(`perk ${id} in style ${styleId} missing from perks.json`)
            return perk
          })
      )
    return {
      id: style.id,
      name: style.name,
      subdesc: plain(style.tooltip || style.name),
      iconUrl: resolveIcon(style.iconPath),
      slots
    }
  })

  const statShardRows = SHARD_ROWS.map((row) => ({
    key: row.key,
    perks: row.ids.map((id) => {
      const perk = perkById.get(id)
      if (!perk) throw new Error(`shard ${id} missing from perks.json`)
      return perk
    })
  }))

  const out = { styles: runeStyles, statShardRows }
  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`Wrote ${OUT}`)
  console.log(`  ${runeStyles.length} styles, ${perkById.size} perks total`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
