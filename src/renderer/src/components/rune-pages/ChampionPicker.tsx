import { useMemo, useState } from 'react'
import { CHAMPIONS, CHAMPION_BY_ID } from '../../data/champions'
import { Badge } from '../ui/Badge'
import { IconTile } from '../ui/IconTile'
import { Input } from '../ui/Input'

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
            <Badge key={c.id} variant="accent" onRemove={() => toggle(c.id)}>
              <img src={c.iconUrl} alt={c.name} className="w-4 h-4 rounded" />
              {c.name}
            </Badge>
          ))}
        </div>
      )}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search champions…"
      />

      <div className="mt-2 max-h-40 overflow-y-auto flex flex-wrap gap-2 pr-1">
        {filtered.map((c) => (
          <IconTile
            key={c.id}
            src={c.iconUrl}
            alt={c.name}
            size="lg"
            selected={selectedIds.includes(c.id)}
            onClick={() => toggle(c.id)}
            className="overflow-hidden"
          />
        ))}
        {filtered.length === 0 && (
          <p className="w-full text-xs text-gray-500 py-2">No champions match “{query}”.</p>
        )}
      </div>
    </div>
  )
}
