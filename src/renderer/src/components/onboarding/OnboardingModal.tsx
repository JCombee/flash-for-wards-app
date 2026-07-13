import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import { useSettings } from '../../hooks/useSettings'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { LcuRunePage } from '../../types'

const RESERVED_NAME = 'Flash For Wards Reserved'

export function OnboardingModal() {
  const settings = useAppStore((s) => s.settings)
  const lcuStatus = useAppStore((s) => s.lcuStatus)
  const { update } = useSettings()

  const [detecting, setDetecting] = useState(false)
  const [loadingPages, setLoadingPages] = useState(false)
  const [lcuPages, setLcuPages] = useState<LcuRunePage[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)

  const connected = lcuStatus === 'connected'
  const active = Boolean(settings) && settings?.onboardingComplete === false

  const loadPages = useCallback(async () => {
    setLoadingPages(true)
    setError(null)
    try {
      const pages = await window.api.getLcuPages()
      setLcuPages(pages)
    } catch (err: unknown) {
      setError('Could not read rune pages: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoadingPages(false)
    }
  }, [])

  useEffect(() => {
    if (!active || !connected) return
    loadPages()
  }, [active, connected, loadPages])

  if (!active) return null

  async function detect() {
    setDetecting(true)
    setError(null)

    try {
      const r = await window.api.findReservedPage()

      if (r.found) {
        await update({ onboardingComplete: true })
        return
      }

      if (r.error === 'lcu_disconnected') {
        setError('League client not connected — open it and log in first.')
        return
      }

      setError(
        `No page named "${RESERVED_NAME}" found. Create it in the client, or pick an existing page below.`
      )
      await loadPages()
    } catch (err: unknown) {
      setError('Something went wrong: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setDetecting(false)
    }
  }

  async function confirmManualSelection() {
    if (selectedPageId === null) return
    await window.api.setSettings({ reservedPageId: selectedPageId })
    await update({ onboardingComplete: true })
  }

  function copyName() {
    navigator.clipboard.writeText(RESERVED_NAME)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal strong>
      <h2 className="text-lol-gold text-xl font-bold mb-2">Welcome to Flash For Wards</h2>
      <p className="text-gray-300 text-sm mb-4">
        Flash For Wards needs one rune page it is allowed to overwrite during champion select. Open
        the League client and log in, then pick one of the options below.
      </p>

      {!connected && (
        <p className="text-yellow-400 text-xs mb-4">
          Waiting for League client connection ({lcuStatus})...
        </p>
      )}

      <div className="rounded border border-lol-gold/30 bg-black/20 p-4">
        <h3 className="text-white text-sm font-semibold mb-1">Create a new page</h3>
        <p className="text-sm text-gray-300 mb-2">
          In the client, go to <strong className="text-white">Collection → Rune Pages</strong>,
          create an empty page and name it:
        </p>
        <div className="flex items-center gap-2 bg-black/40 border border-lol-gold/40 rounded px-3 py-2">
          <code className="text-lol-gold-light text-xs flex-1 select-text">{RESERVED_NAME}</code>
          <button
            onClick={copyName}
            className="text-xs text-lol-gold hover:text-lol-gold-light transition-colors shrink-0"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <Button onClick={detect} disabled={detecting || !connected} className="mt-3">
          {detecting ? 'Detecting...' : 'Detect my reserved page'}
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wide text-gray-500">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="rounded border border-white/10 bg-black/20 p-4">
        <h3 className="text-white text-sm font-semibold mb-1">Use an existing page</h3>
        <p className="text-xs text-gray-400 mb-3">
          Pick a page already in your client. Flash For Wards will overwrite it during champion
          select, so don&apos;t pick one you want to keep.
        </p>

        {!connected && (
          <p className="text-sm text-gray-400">
            Your pages appear here once the League client is connected.
          </p>
        )}

        {connected && loadingPages && (
          <p className="text-sm text-gray-400">Loading rune pages...</p>
        )}

        {connected && !loadingPages && lcuPages && lcuPages.length === 0 && (
          <p className="text-sm text-gray-400">
            No rune pages found in the client. Create one first, then{' '}
            <button
              onClick={loadPages}
              className="text-lol-gold hover:text-lol-gold-light transition-colors"
            >
              refresh
            </button>
            .
          </p>
        )}

        {connected && !loadingPages && lcuPages && lcuPages.length > 0 && (
          <>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {lcuPages.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer border transition-colors ${
                    selectedPageId === p.id
                      ? 'border-lol-gold/60 bg-lol-gold/10'
                      : 'border-transparent bg-black/30 hover:bg-black/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reserved-page"
                    value={p.id}
                    checked={selectedPageId === p.id}
                    onChange={() => setSelectedPageId(p.id)}
                    className="accent-yellow-500"
                  />
                  <span className="text-sm text-gray-200">{p.name}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-3">
              <Button
                variant="success"
                onClick={confirmManualSelection}
                disabled={selectedPageId === null}
              >
                Use selected page →
              </Button>
              <Button variant="ghost" size="sm" onClick={loadPages}>
                Refresh
              </Button>
            </div>
          </>
        )}
      </div>

      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
    </Modal>
  )
}
