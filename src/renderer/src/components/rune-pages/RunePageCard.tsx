import React from 'react'
import type { StoredRunePage } from '../../types'

interface RunePageCardProps {
  page: StoredRunePage
  onEdit: (page: StoredRunePage) => void
  onDelete: (id: string) => void
}

const STYLE_NAMES: Record<number, string> = {
  8000: 'Precision',
  8100: 'Domination',
  8200: 'Sorcery',
  8300: 'Inspiration',
  8400: 'Resolve'
}

export function RunePageCard({ page, onEdit, onDelete }: RunePageCardProps) {
  const primaryName = STYLE_NAMES[page.primaryStyleId] ?? `Style ${page.primaryStyleId}`
  const subName = STYLE_NAMES[page.subStyleId] ?? `Style ${page.subStyleId}`

  return (
    <div className="bg-lol-dark-mid border border-lol-gold/20 rounded-lg p-4 hover:border-lol-gold/40 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-lol-gold-light text-sm leading-tight">{page.name}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(page)}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(page.id)}
            className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-900/60 text-red-400 transition-colors"
          >
            Del
          </button>
        </div>
      </div>

      <div className="flex gap-2 text-xs text-gray-400">
        <span className="px-2 py-0.5 bg-black/30 rounded">{primaryName}</span>
        <span className="text-gray-600">/</span>
        <span className="px-2 py-0.5 bg-black/30 rounded">{subName}</span>
      </div>

      {page.lastUsedAt && (
        <p className="text-xs text-gray-600 mt-2">
          Used {new Date(page.lastUsedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
