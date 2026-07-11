import React, { useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import { useRunePages } from '../../hooks/useRunePages'
import { RunePageCard } from './RunePageCard'
import { RunePageEditor } from './RunePageEditor'
import type { StoredRunePage } from '../../types'

export function RunePageList() {
  const runePages = useAppStore((s) => s.runePages)
  const { refresh } = useRunePages()
  const [editingPage, setEditingPage] = useState<StoredRunePage | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('Delete this rune page?')) return
    await window.api.deleteRunePage(id)
    refresh()
  }

  async function handleTogglePin(page: StoredRunePage) {
    await window.api.updateRunePage(page.id, { pinned: !page.pinned })
    refresh()
  }

  function handleSaved() {
    setEditingPage(null)
    setCreatingNew(false)
    refresh()
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-lol-gold-light">My Rune Pages</h2>
        <button
          onClick={() => setCreatingNew(true)}
          className="px-4 py-2 bg-lol-gold hover:bg-lol-gold/80 text-lol-dark font-semibold rounded text-sm transition-colors"
        >
          + New Page
        </button>
      </div>

      {runePages.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No rune pages yet</p>
          <p className="text-sm">Click &quot;+ New Page&quot; to create your first saved rune page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {runePages.map((page) => (
            <RunePageCard
              key={page.id}
              page={page}
              onEdit={setEditingPage}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}

      {creatingNew && (
        <RunePageEditor onSave={handleSaved} onCancel={() => setCreatingNew(false)} />
      )}
      {editingPage && (
        <RunePageEditor page={editingPage} onSave={handleSaved} onCancel={() => setEditingPage(null)} />
      )}
    </div>
  )
}
