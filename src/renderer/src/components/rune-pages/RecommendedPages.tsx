import { useMemo, useState } from 'react'
import { CHAMPIONS } from '../../data/champions'
import { getDefaultRunePage, defaultPageName } from '../../data/default-runes'
import { RunePageCard } from './RunePageCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import type { StoredRunePage } from '../../types'

interface RecommendedPagesProps {
  /** Called after a recommendation is forked into a real page. */
  onSaved: () => void
}

// Browse Riot's built-in recommendation for any champion and fork it into a
// real page. These aren't stored pages until saved, so the cards are synthetic.
export function RecommendedPages({ onSaved }: RecommendedPagesProps) {
  const [query, setQuery] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return CHAMPIONS.filter((c) => c.name.toLowerCase().includes(q))
      .map((champion) => {
        const page = getDefaultRunePage(champion.id)
        return page ? { champion, page } : undefined
      })
      .filter((m): m is NonNullable<typeof m> => !!m)
  }, [query])

  async function save(championId: number) {
    const page = getDefaultRunePage(championId)
    if (!page || savingId) return
    setSavingId(championId)
    try {
      await window.api.createRunePage({
        name: defaultPageName(championId),
        primaryStyleId: page.primaryStyleId,
        subStyleId: page.subStyleId,
        selectedPerkIds: page.selectedPerkIds,
        championIds: [championId],
        pinned: false
      })
      onSaved()
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-lol-gold-light mb-1">Recommended</h3>
      <p className="text-xs text-gray-500 mb-3">
        The League client&apos;s own rune page for any champion. Save one to make it yours.
      </p>

      <div className="max-w-sm">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search champions…"
        />
      </div>

      {query.trim() && matches.length === 0 && (
        <p className="text-xs text-gray-500 mt-3">No champions match “{query}”.</p>
      )}

      {matches.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {matches.map(({ champion, page }) => {
            const card: StoredRunePage = {
              id: `default:${champion.id}`,
              name: defaultPageName(champion.id),
              primaryStyleId: page.primaryStyleId,
              subStyleId: page.subStyleId,
              selectedPerkIds: page.selectedPerkIds,
              createdAt: 0,
              updatedAt: 0,
              championIds: [champion.id]
            }
            return (
              <RunePageCard
                key={champion.id}
                page={card}
                actions={
                  <>
                    <Badge>{page.position}</Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={savingId !== null}
                      onClick={() => save(champion.id)}
                    >
                      {savingId === champion.id ? 'Saving…' : 'Save'}
                    </Button>
                  </>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
