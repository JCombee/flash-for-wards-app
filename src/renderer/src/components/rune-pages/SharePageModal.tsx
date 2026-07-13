import { useEffect, useState } from 'react'
import { RunePagePreview } from './RunePagePreview'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Notice } from '../ui/Notice'
import type { SharePagePayload } from '../../types/share'
import type { StoredRunePage } from '../../types'

/** Fits the 1000px card inside the modal. The exported PNG is rendered at full size. */
const DISPLAY_SCALE = 0.62

const COPIED_FEEDBACK_MS = 1500

export function SharePageModal({ page, onClose }: { page: StoredRunePage; onClose: () => void }) {
  const [busy, setBusy] = useState<'clipboard' | 'save' | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [code, setCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)

  const payload: SharePagePayload = {
    name: page.name,
    primaryStyleId: page.primaryStyleId,
    subStyleId: page.subStyleId,
    selectedPerkIds: page.selectedPerkIds,
    championIds: page.championIds,
    positions: page.positions,
    gameModes: page.gameModes,
    stats: page.stats
  }

  useEffect(() => {
    void window.api.encodePageCode(payload).then(setCode)
  }, [page.id, page.updatedAt])

  async function copyCode() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), COPIED_FEEDBACK_MS)
  }

  async function share(action: 'clipboard' | 'save') {
    if (busy) return
    setBusy(action)
    setMessage(null)
    try {
      const result = await window.api.sharePageImage({ page: payload, action })
      if (result.success) {
        setMessage({
          text: result.action === 'clipboard' ? 'Image copied to clipboard' : 'Saved to disk',
          ok: true
        })
      } else if (result.error !== 'canceled') {
        setMessage({ text: result.errorDetail ?? 'Could not render the image', ok: false })
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <Modal width="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lol-gold font-bold truncate">Share “{page.name}”</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">
          ×
        </button>
      </div>

      {/* zoom, not transform: it affects layout, so the box shrinks with the card. */}
      <div className="mx-auto w-fit" style={{ zoom: DISPLAY_SCALE }}>
        <RunePagePreview page={payload} />
      </div>

      <div className="mt-5">
        <label className="text-xs text-gray-400 block mb-1">
          Share code <span className="text-gray-600">(paste into Import to rebuild the page)</span>
        </label>
        <div className="flex gap-2">
          <input
            readOnly
            value={code}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 bg-black/40 border border-lol-gold/20 rounded px-3 py-2 text-xs font-mono text-gray-300 select-text"
          />
          <Button variant="secondary" disabled={!code} onClick={copyCode}>
            {codeCopied ? 'Copied' : 'Copy code'}
          </Button>
        </div>
      </div>

      {message && (
        <div className="mt-4">
          <Notice variant={message.ok ? 'success' : 'danger'}>{message.text}</Notice>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button variant="secondary" disabled={busy !== null} onClick={() => share('save')}>
          {busy === 'save' ? 'Saving…' : 'Save PNG'}
        </Button>
        <Button disabled={busy !== null} onClick={() => share('clipboard')}>
          {busy === 'clipboard' ? 'Copying…' : 'Copy image'}
        </Button>
      </div>
    </Modal>
  )
}
