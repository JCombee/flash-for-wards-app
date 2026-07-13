import { useState } from 'react'
import { STYLE_BY_ID, STAT_SHARD_ROWS, PERK_BY_ID, type Perk } from '../../data/runes'
import { CHAMPION_BY_ID } from '../../data/champions'
import { formatPosition, formatGameMode } from '../../lib/page-context'
import { PREVIEW_WIDTH, PREVIEW_HEIGHT, type SharePagePayload } from '../../types/share'

const MAX_CHAMPION_ICONS = 6

/**
 * A rune page as a fixed-size card, sized for capture as a PNG. Read-only and
 * hookless apart from image fallbacks — the capture window renders exactly this.
 *
 * Unselected runes stay visible but dimmed, the way the client shows them: a
 * shared rune image is read as "which of these did they take", not as nine icons
 * without context.
 */
export function RunePagePreview({ page }: { page: SharePagePayload }) {
  const primary = STYLE_BY_ID.get(page.primaryStyleId)
  const secondary = STYLE_BY_ID.get(page.subStyleId)
  const perks = padPerks(page.selectedPerkIds)
  const chosen = new Set(perks.filter(Boolean))

  const champions = (page.championIds ?? [])
    .map((id) => CHAMPION_BY_ID.get(id))
    .filter((c): c is NonNullable<typeof c> => !!c)
  const shownChampions = champions.slice(0, MAX_CHAMPION_ICONS)
  const overflowChampions = champions.length - shownChampions.length

  const tags = [
    ...(page.positions ?? []).map(formatPosition),
    ...(page.gameModes ?? []).map(formatGameMode)
  ]
  const stats = page.stats
  const decided = stats ? stats.wins + stats.losses : 0

  return (
    <div
      className="bg-lol-dark border border-lol-gold/20 rounded-lg flex flex-col overflow-hidden"
      style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
    >
      <header className="flex items-center gap-4 px-8 pt-7 pb-5">
        <RuneIcon perk={PERK_BY_ID.get(perks[0])} size={56} selected />
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold text-lol-gold-light leading-tight truncate">
            {page.name}
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs">
            <span className="text-lol-gold">{primary?.name ?? '—'}</span>
            <span className="text-gray-600">/</span>
            <span className="text-lol-gold">{secondary?.name ?? '—'}</span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded border border-lol-gold/30 text-lol-gold-light"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        {shownChampions.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {shownChampions.map((c) => (
              <img key={c.id} src={c.iconUrl} alt={c.name} className="w-8 h-8 rounded-full" />
            ))}
            {overflowChampions > 0 && (
              <span className="text-xs text-gray-500">+{overflowChampions}</span>
            )}
          </div>
        )}
      </header>

      <div className="flex-1 grid grid-cols-[56fr_44fr] gap-8 px-8 min-h-0">
        <section className="space-y-4">
          {primary && <StyleHeader iconUrl={primary.iconUrl} name={primary.name} />}
          {primary && (
            <>
              <Row perks={primary.slots[0]} chosen={chosen} size={56} />
              {primary.slots.slice(1).map((row, i) => (
                <Row key={i} perks={row} chosen={chosen} size={44} />
              ))}
            </>
          )}
        </section>

        <section className="space-y-4">
          {secondary && <StyleHeader iconUrl={secondary.iconUrl} name={secondary.name} />}
          {secondary?.slots.slice(1).map((row, i) => (
            <Row key={i} perks={row} chosen={chosen} size={44} />
          ))}

          <div className="pt-3 border-t border-lol-gold/10 space-y-2.5">
            {STAT_SHARD_ROWS.map((row) => (
              <Row key={row.key} perks={row.perks} chosen={chosen} size={28} />
            ))}
          </div>
        </section>
      </div>

      <footer className="flex items-center justify-between px-8 py-4 mt-5 border-t border-lol-gold/10">
        <span className="text-xs text-gray-600 tracking-wide">flash for wards</span>
        {stats && decided > 0 && (
          <span className="text-xs flex items-center gap-1.5">
            <span className="text-green-400">{stats.wins}W</span>
            <span className="text-red-400">{stats.losses}L</span>
            {stats.winRate !== null && (
              <span className="text-gray-300">{Math.round(stats.winRate * 100)}%</span>
            )}
          </span>
        )}
      </footer>
    </div>
  )
}

function StyleHeader({ iconUrl, name }: { iconUrl: string; name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={iconUrl} alt={name} className="w-7 h-7 object-contain" />
      <p className="text-lol-gold-light font-semibold text-sm">{name}</p>
    </div>
  )
}

function Row({ perks, chosen, size }: { perks: Perk[]; chosen: Set<number>; size: number }) {
  return (
    <div className="flex items-center gap-3">
      {perks.map((perk) => (
        <RuneIcon key={perk.id} perk={perk} size={size} selected={chosen.has(perk.id)} />
      ))}
    </div>
  )
}

function RuneIcon({ perk, size, selected }: { perk?: Perk; size: number; selected: boolean }) {
  const [failed, setFailed] = useState(false)

  // A dead CDN should leave a hole in the layout, not a broken-image glyph.
  if (!perk || failed) {
    return (
      <div
        className="rounded-full bg-white/5 shrink-0"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <img
      src={perk.iconUrl}
      alt={perk.name}
      onError={() => setFailed(true)}
      className={`rounded-full object-contain shrink-0 ${
        selected ? 'ring-2 ring-lol-gold' : 'opacity-40 grayscale'
      }`}
      style={{ width: size, height: size }}
    />
  )
}

function padPerks(ids: number[]): number[] {
  return Array.from({ length: 9 }, (_, i) => ids[i] ?? 0)
}
