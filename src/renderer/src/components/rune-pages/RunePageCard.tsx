import React from 'react'
import type { StoredRunePage } from '../../types'
import { STYLE_BY_ID, PERK_BY_ID } from '../../data/runes'
import { CHAMPION_BY_ID } from '../../data/champions'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

interface RunePageCardProps {
  page: StoredRunePage
  onEdit?: (page: StoredRunePage) => void
  onDelete?: (id: string) => void
  onDuplicate?: (page: StoredRunePage) => void
  onTogglePin?: (page: StoredRunePage) => void
  /** Custom action node rendered in place of Edit/Del (always visible). */
  actions?: React.ReactNode
  /** Green "applied" highlight border. */
  highlight?: boolean
  /** Card click handler (whole card). */
  onClick?: () => void
  disabled?: boolean
}

export function RunePageCard({
  page,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePin,
  actions,
  highlight,
  onClick,
  disabled
}: RunePageCardProps) {
  const primaryName = STYLE_BY_ID.get(page.primaryStyleId)?.name ?? `Style ${page.primaryStyleId}`
  const subName = STYLE_BY_ID.get(page.subStyleId)?.name ?? `Style ${page.subStyleId}`
  const keystone = PERK_BY_ID.get(page.selectedPerkIds?.[0] ?? 0)
  const champions = (page.championIds ?? [])
    .map((id) => CHAMPION_BY_ID.get(id))
    .filter((c): c is NonNullable<typeof c> => !!c)

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`border rounded-lg p-4 transition-colors group ${
        highlight
          ? 'bg-green-900/20 border-green-500/50'
          : 'bg-lol-dark-mid border-lol-gold/20 hover:border-lol-gold/40'
      } ${onClick ? 'cursor-pointer' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {onTogglePin && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTogglePin(page)
              }}
              title={page.pinned ? 'Unpin' : 'Pin'}
              className={`shrink-0 text-base leading-none transition-colors ${
                page.pinned ? 'text-lol-gold' : 'text-gray-600 hover:text-lol-gold/70'
              }`}
            >
              {page.pinned ? '★' : '☆'}
            </button>
          )}
          {keystone && (
            <img
              src={keystone.iconUrl}
              alt={keystone.name}
              className="w-6 h-6 object-contain shrink-0"
            />
          )}
          <h3 className="font-semibold text-lol-gold-light text-sm leading-tight truncate">
            {page.name}
          </h3>
        </div>
        {actions ? (
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        ) : (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(page)}>
                Edit
              </Button>
            )}
            {onDuplicate && (
              <Button variant="secondary" size="sm" onClick={() => onDuplicate(page)}>
                Copy
              </Button>
            )}
            {onDelete && (
              <Button variant="danger" size="sm" onClick={() => onDelete(page.id)}>
                Del
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Badge>{primaryName}</Badge>
        <span className="text-gray-600">/</span>
        <Badge>{subName}</Badge>
      </div>

      {champions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {champions.map((c) => (
            <img
              key={c.id}
              src={c.iconUrl}
              alt={c.name}
              title={c.name}
              className="w-5 h-5 rounded"
            />
          ))}
        </div>
      )}

      {page.lastUsedAt && (
        <p className="text-xs text-gray-600 mt-2">
          Used {new Date(page.lastUsedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
