import { useEffect, useState } from 'react'
import { RunePagePreview } from './RunePagePreview'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Notice } from '../ui/Notice'
import { PERK_BY_ID, STYLE_BY_ID } from '../../data/runes'
import type { SharePagePayload } from '../../types/share'
import type { Position } from '../../types'

const DISPLAY_SCALE = 0.45

export function ImportCodeModal({
  onImported,
  onClose
}: {
  onImported: () => void
  onClose: () => void
}) {
  const [code, setCode] = useState('')
  const [page, setPage] = useState<SharePagePayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const trimmed = code.trim()
    if (!trimmed) {
      setPage(null)
      setError(null)
      return
    }

    let stale = false
    void window.api.decodePageCode(trimmed).then((result) => {
      if (stale) return
      if (!result.ok) {
        setPage(null)
        setError(result.error)
        return
      }
      // Main can't see the rune data, so the perk ids are checked here — a code
      // from a future patch could name runes this build has never heard of.
      const unknown = result.page.selectedPerkIds.some((id) => !PERK_BY_ID.has(id))
      if (unknown || !STYLE_BY_ID.has(result.page.primaryStyleId)) {
        setPage(null)
        setError('Code uses runes this version doesn’t know — update the app and try again')
        return
      }
      setPage(result.page)
      setError(null)
    })

    return () => {
      stale = true
    }
  }, [code])

  async function save() {
    if (!page || saving) return
    setSaving(true)
    try {
      await window.api.createRunePage({
        name: page.name,
        primaryStyleId: page.primaryStyleId,
        subStyleId: page.subStyleId,
        selectedPerkIds: page.selectedPerkIds,
        championIds: page.championIds ?? [],
        positions: (page.positions ?? []) as Position[],
        gameModes: page.gameModes ?? [],
        pinned: false
      })
      onImported()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal width="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lol-gold font-bold">Import a rune page</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">
          ×
        </button>
      </div>

      <label className="text-xs text-gray-400 block mb-1">Paste a share code (FFW1-…)</label>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="FFW1-…"
        autoFocus
        className="font-mono text-xs"
      />

      {error && (
        <div className="mt-3">
          <Notice variant="danger">{error}</Notice>
        </div>
      )}

      {page && (
        <div className="mt-4 mx-auto w-fit" style={{ zoom: DISPLAY_SCALE }}>
          <RunePagePreview page={page} />
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!page || saving} onClick={save}>
          {saving ? 'Saving…' : 'Save Page'}
        </Button>
      </div>
    </Modal>
  )
}
