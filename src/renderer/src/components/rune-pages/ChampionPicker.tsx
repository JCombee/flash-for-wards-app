import React, { useMemo, useState } from 'react'
import { CHAMPIONS, CHAMPION_BY_ID } from '../../data/champions'

interface ChampionPickerProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
}

export function ChampionPicker({ selectedIds, onChange }: ChampionPickerProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CHAMPIONS
    return CHAMPIONS.filter((c) => c.name.toLowerCase().includes(q))
  }, [query])

  function toggle(id: number) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id))
    else onChange([...selectedIds, id])
  }

  const selectedChamps = selectedIds
    .map((id) => CHAMPION_BY_ID.get(id))
    .filter((c): c is NonNullable<typeof c> => !!c)

  return (
    <div>
      <label className="text-xs text-gray-400 block mb-1">
        Preferred Champions <span className="text-gray-600">(optional)</span>
      </label>

      {selectedChamps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedChamps.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded bg-lol-gold/15 border border-lol-gold/30 text-xs text-lol-gold-light"
            >
              <img src={c.iconUrl} alt={c.name} className="w-4 h-4 rounded-sm" />
              {c.name}
              <button
                onClick={() => toggle(c.id)}
                title={`Remove ${c.name}`}
                className="text-gray-400 hover:text-red-400 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-black/40 border border-lol-gold/30 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-lol-gold/60"
        placeholder="Search champions…"
      />

      <div className="mt-2 max-h-40 overflow-y-auto grid grid-cols-6 sm:grid-cols-8 gap-1.5 pr-1">
        {filtered.map((c) => {
          const active = selectedIds.includes(c.id)
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              title={c.name}
              className={`relative rounded overflow-hidden border transition-colors ${
                active ? 'border-lol-gold' : 'border-transparent hover:border-lol-gold/40'
              }`}
            >
              <img src={c.iconUrl} alt={c.name} className="w-full aspect-square object-cover" />
              {active && (
                <span className="absolute inset-0 bg-lol-gold/25 flex items-center justify-center text-lol-gold-light text-xs font-bold">
                  ✓
                </span>
              )}
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="col-span-full text-xs text-gray-500 py-2">No champions match “{query}”.</p>
        )}
      </div>
    </div>
  )
}
