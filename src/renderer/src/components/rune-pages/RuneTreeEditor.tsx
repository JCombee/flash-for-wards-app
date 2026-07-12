import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  RUNE_STYLES,
  STAT_SHARD_ROWS,
  STYLE_BY_ID,
  type Perk,
  type RuneStyle
} from '../../data/runes'
import { IconTile } from '../ui/IconTile'

export interface RuneSelection {
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
}

interface RuneTreeEditorProps extends RuneSelection {
  onChange: (next: RuneSelection) => void
}

// selectedPerkIds index map (matches LCU):
// [0] keystone, [1-3] primary rows, [4-5] secondary (2 from different rows),
// [6-8] offense/flex/defense shards.

interface Hover {
  perk: Perk
  anchor: { centerX: number; top: number; bottom: number }
}

const TOOLTIP_GAP = 8
const VIEWPORT_MARGIN = 8

export function RuneTreeEditor({
  primaryStyleId,
  subStyleId,
  selectedPerkIds,
  onChange
}: RuneTreeEditorProps) {
  const [hover, setHover] = useState<Hover | null>(null)

  const primary = STYLE_BY_ID.get(primaryStyleId)
  const secondary = STYLE_BY_ID.get(subStyleId)
  const perks = padPerks(selectedPerkIds)

  function emit(patch: Partial<RuneSelection>) {
    onChange({ primaryStyleId, subStyleId, selectedPerkIds: perks, ...patch })
  }

  function choosePrimary(styleId: number) {
    if (styleId === primaryStyleId) return
    // reset primary perks; if it collides with the secondary, clear secondary too.
    const next = [...perks]
    next[0] = next[1] = next[2] = next[3] = 0
    const clearsSecondary = styleId === subStyleId
    if (clearsSecondary) {
      next[4] = next[5] = 0
    }
    emit({
      primaryStyleId: styleId,
      subStyleId: clearsSecondary ? 0 : subStyleId,
      selectedPerkIds: next
    })
  }

  function chooseSecondary(styleId: number) {
    if (styleId === subStyleId || styleId === primaryStyleId) return
    const next = [...perks]
    next[4] = next[5] = 0 // secondary runes must come from the new tree
    emit({ subStyleId: styleId, selectedPerkIds: next })
  }

  function setPerkAt(index: number, perkId: number) {
    const next = [...perks]
    next[index] = next[index] === perkId ? 0 : perkId
    emit({ selectedPerkIds: next })
  }

  // Secondary: 2 runes from 2 different non-keystone rows (slots[1..3]).
  function toggleSecondaryPerk(rowIndex: number, perkId: number) {
    if (!secondary) return
    const next = [...perks]
    const rowOf = (pid: number) => secondaryRowIndex(secondary, pid)
    const r4 = next[4] ? rowOf(next[4]) : -1
    const r5 = next[5] ? rowOf(next[5]) : -1

    if (next[4] === perkId) {
      next[4] = 0
      emit({ selectedPerkIds: next })
      return
    }
    if (next[5] === perkId) {
      next[5] = 0
      emit({ selectedPerkIds: next })
      return
    }

    if (r4 === rowIndex) {
      next[4] = perkId
    } // replace within same row
    else if (r5 === rowIndex) {
      next[5] = perkId
    } else if (!next[4]) {
      next[4] = perkId
    } else if (!next[5]) {
      next[5] = perkId
    } else return // both slots full, on two other rows — locked until deselect
    emit({ selectedPerkIds: next })
  }

  const secondaryChosen = new Set([perks[4], perks[5]].filter(Boolean))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ---------------- Primary path ---------------- */}
      <div className="space-y-4">
        <StyleSelector
          label="Primary Path"
          styles={RUNE_STYLES}
          activeId={primaryStyleId}
          onPick={choosePrimary}
          onHover={setHover}
        />

        {primary && (
          <>
            <StyleHeader style={primary} />
            <SlotRow
              heading="Keystone"
              perks={primary.slots[0]}
              isSelected={(p) => perks[0] === p.id}
              onPick={(p) => setPerkAt(0, p.id)}
              onHover={setHover}
              size="lg"
            />
            {primary.slots.slice(1).map((row, i) => (
              <SlotRow
                key={i}
                perks={row}
                isSelected={(p) => perks[i + 1] === p.id}
                onPick={(p) => setPerkAt(i + 1, p.id)}
                onHover={setHover}
              />
            ))}
          </>
        )}
      </div>

      {/* ---------------- Secondary path ---------------- */}
      <div className="space-y-4">
        <StyleSelector
          label="Secondary Path"
          styles={RUNE_STYLES.filter((s) => s.id !== primaryStyleId)}
          activeId={subStyleId}
          onPick={chooseSecondary}
          onHover={setHover}
        />

        {secondary ? (
          <>
            <StyleHeader style={secondary} />
            {secondary.slots.slice(1).map((row, i) => (
              <SlotRow
                key={i}
                perks={row}
                isSelected={(p) => secondaryChosen.has(p.id)}
                onPick={(p) => toggleSecondaryPerk(i + 1, p.id)}
                onHover={setHover}
              />
            ))}
            <p className="text-xs text-gray-500">Pick 2 runes from different rows.</p>
          </>
        ) : (
          <p className="text-sm text-gray-500">Select a secondary path.</p>
        )}

        {/* Stat shards */}
        <div className="pt-2 border-t border-lol-gold/10 space-y-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Stat Shards</p>
          {STAT_SHARD_ROWS.map((row, i) => (
            <SlotRow
              key={row.key}
              perks={row.perks}
              isSelected={(p) => perks[6 + i] === p.id}
              onPick={(p) => setPerkAt(6 + i, p.id)}
              onHover={setHover}
              size="sm"
            />
          ))}
        </div>
      </div>

      {hover && <RuneTooltip hover={hover} />}
    </div>
  )
}

function padPerks(ids: number[]): number[] {
  const next = Array(9).fill(0)
  for (let i = 0; i < 9; i++) next[i] = ids[i] ?? 0
  return next
}

function secondaryRowIndex(style: RuneStyle, perkId: number): number {
  for (let i = 1; i < style.slots.length; i++) {
    if (style.slots[i].some((p) => p.id === perkId)) return i
  }
  return -1
}

function StyleSelector({
  label,
  styles,
  activeId,
  onPick,
  onHover
}: {
  label: string
  styles: RuneStyle[]
  activeId: number
  onPick: (id: number) => void
  onHover: (h: Hover | null) => void
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{label}</p>
      <div className="flex gap-2">
        {styles.map((s) => (
          <IconTile
            key={s.id}
            src={s.iconUrl}
            alt={s.name}
            size="style"
            selected={s.id === activeId}
            onClick={() => onPick(s.id)}
            onMouseEnter={(e) => onHover(hoverFor(e, styleAsPerk(s)))}
            onMouseLeave={() => onHover(null)}
          />
        ))}
      </div>
    </div>
  )
}

function StyleHeader({ style }: { style: RuneStyle }) {
  return (
    <div className="flex items-center gap-3">
      <img src={style.iconUrl} alt={style.name} className="w-8 h-8 object-contain" />
      <div>
        <p className="text-lol-gold-light font-semibold text-sm leading-tight">{style.name}</p>
        <p className="text-xs text-gray-500 leading-tight">{style.subdesc}</p>
      </div>
    </div>
  )
}

function SlotRow({
  heading,
  perks,
  isSelected,
  onPick,
  onHover,
  size = 'md'
}: {
  heading?: string
  perks: Perk[]
  isSelected: (p: Perk) => boolean
  onPick: (p: Perk) => void
  onHover: (h: Hover | null) => void
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div>
      {heading && <p className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">{heading}</p>}
      <div className="flex gap-3">
        {perks.map((p) => (
          <IconTile
            key={p.id}
            src={p.iconUrl}
            alt={p.name}
            size={size}
            selected={isSelected(p)}
            onClick={() => onPick(p)}
            onMouseEnter={(e) => onHover(hoverFor(e, p))}
            onMouseLeave={() => onHover(null)}
          />
        ))}
      </div>
    </div>
  )
}

function RuneTooltip({ hover }: { hover: Hover }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const { centerX, top, bottom } = hover.anchor

    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN
    const left = Math.min(
      Math.max(centerX - width / 2, VIEWPORT_MARGIN),
      Math.max(maxLeft, VIEWPORT_MARGIN)
    )

    // Prefer above the tile; flip below when it would clip the top edge.
    const above = top - TOOLTIP_GAP - height
    const belowTop = bottom + TOOLTIP_GAP
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN
    const top_ =
      above >= VIEWPORT_MARGIN
        ? above
        : Math.min(Math.max(belowTop, VIEWPORT_MARGIN), Math.max(maxTop, VIEWPORT_MARGIN))

    setPos({ left, top: top_ })
  }, [hover])

  return (
    <div
      ref={ref}
      className="fixed z-50 pointer-events-none w-72 max-w-[calc(100vw-1rem)] bg-lol-dark border border-lol-gold/40 rounded px-3 py-2 shadow-lg"
      style={{
        left: pos?.left ?? hover.anchor.centerX,
        top: pos?.top ?? hover.anchor.top,
        visibility: pos ? 'visible' : 'hidden'
      }}
    >
      <p className="text-lol-gold-light font-semibold text-xs mb-0.5">{hover.perk.name}</p>
      {hover.perk.shortDesc && (
        <p className="text-xs text-gray-300 leading-snug">{hover.perk.shortDesc}</p>
      )}
    </div>
  )
}

function hoverFor(e: React.MouseEvent<HTMLElement>, perk: Perk): Hover {
  const r = e.currentTarget.getBoundingClientRect()
  return { perk, anchor: { centerX: r.left + r.width / 2, top: r.top, bottom: r.bottom } }
}

// Reuse the tooltip shape for style icons (no shortDesc → show subdesc).
function styleAsPerk(s: RuneStyle): Perk {
  return { id: s.id, name: s.name, shortDesc: s.subdesc, iconUrl: s.iconUrl }
}
