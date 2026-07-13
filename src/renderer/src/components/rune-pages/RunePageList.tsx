import { useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import { useRunePages } from '../../hooks/useRunePages'
import { RecommendedPages } from './RecommendedPages'
import { RunePageCard } from './RunePageCard'
import { RunePageEditor } from './RunePageEditor'
import { SharePageModal } from './SharePageModal'
import { ImportCodeModal } from './ImportCodeModal'
import { Button } from '../ui/Button'
import type { StoredRunePage } from '../../types'

export function RunePageList() {
  const runePages = useAppStore((s) => s.runePages)
  const { refresh } = useRunePages()
  const [editingPage, setEditingPage] = useState<StoredRunePage | null>(null)
  const [sharingPage, setSharingPage] = useState<StoredRunePage | null>(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [importingCode, setImportingCode] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('Delete this rune page?')) return
    await window.api.deleteRunePage(id)
    refresh()
  }

  async function handleDuplicate(page: StoredRunePage) {
    await window.api.createRunePage({
      name: `${page.name} (copy)`,
      primaryStyleId: page.primaryStyleId,
      subStyleId: page.subStyleId,
      selectedPerkIds: page.selectedPerkIds,
      championIds: page.championIds ?? [],
      positions: page.positions ?? [],
      gameModes: page.gameModes ?? [],
      pinned: false
    })
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
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportingCode(true)}>
            Import code
          </Button>
          <Button onClick={() => setCreatingNew(true)}>+ New Page</Button>
        </div>
      </div>

      {runePages.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No rune pages yet</p>
          <p className="text-sm">
            Click &quot;+ New Page&quot; to create your first saved rune page, or save a recommended
            one above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {runePages.map((page) => (
            <RunePageCard
              key={page.id}
              page={page}
              onEdit={setEditingPage}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onTogglePin={handleTogglePin}
              onShare={setSharingPage}
            />
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-lol-gold/10">
        <RecommendedPages onSaved={refresh} />
      </div>

      {creatingNew && (
        <RunePageEditor onSave={handleSaved} onCancel={() => setCreatingNew(false)} />
      )}
      {editingPage && (
        <RunePageEditor
          page={editingPage}
          onSave={handleSaved}
          onCancel={() => setEditingPage(null)}
        />
      )}
      {sharingPage && <SharePageModal page={sharingPage} onClose={() => setSharingPage(null)} />}
      {importingCode && (
        <ImportCodeModal
          onImported={() => {
            setImportingCode(false)
            refresh()
          }}
          onClose={() => setImportingCode(false)}
        />
      )}
    </div>
  )
}
