import { useState } from 'react'
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
  const [lcuPages, setLcuPages] = useState<LcuRunePage[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)

  if (!settings || settings.onboardingComplete) return null

  async function detect() {
    setDetecting(true)
    setError(null)
    setLcuPages(null)
    setSelectedPageId(null)

    try {
      // First try auto-detect by name
      const r = await window.api.findReservedPage()

      if (r.found) {
        // Auto-detected — done
        await update({ onboardingComplete: true })
        return
      }

      if (r.error === 'lcu_disconnected') {
        setError('League client not connected — open it and log in first.')
        return
      }

      // Not found by name — fetch all pages so user can pick
      const pages = await window.api.getLcuPages()
      if (pages.length === 0) {
        setError('No rune pages found in client. Create one first.')
      } else {
        setLcuPages(pages)
        setError(null)
      }
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
      <p className="text-gray-300 text-sm mb-6">First-time setup — takes about 1 minute.</p>

      <ol className="space-y-4">
        <li className="flex gap-3">
          <span className="text-lol-gold font-bold text-sm mt-0.5 w-5 shrink-0">1.</span>
          <p className="text-sm text-gray-300">Open the League of Legends client and log in.</p>
        </li>
        <li className="flex gap-3">
          <span className="text-lol-gold font-bold text-sm mt-0.5 w-5 shrink-0">2.</span>
          <p className="text-sm text-gray-300">
            Go to <strong className="text-white">Collection → Rune Pages</strong> and create a new
            empty page. Name doesn&apos;t matter — you&apos;ll pick it below.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="text-lol-gold font-bold text-sm mt-0.5 w-5 shrink-0">3.</span>
          <div className="flex-1">
            <p className="text-sm text-gray-300 mb-1">
              Optionally name it something recognisable, like:
            </p>
            <div className="flex items-center gap-2 bg-black/40 border border-lol-gold/40 rounded px-3 py-2">
              <code className="text-lol-gold-light text-xs flex-1 select-text">
                {RESERVED_NAME}
              </code>
              <button
                onClick={copyName}
                className="text-xs text-lol-gold hover:text-lol-gold-light transition-colors shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This tool will overwrite it during champion select.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="text-lol-gold font-bold text-sm mt-0.5 w-5 shrink-0">4.</span>
          <div className="flex-1">
            <p className="text-sm text-gray-300 mb-2">Link your reserved page:</p>

            {lcuStatus !== 'connected' && (
              <p className="text-yellow-400 text-xs mb-2">
                Waiting for League client connection ({lcuStatus})...
              </p>
            )}

            <Button onClick={detect} disabled={detecting || lcuStatus !== 'connected'}>
              {detecting ? 'Loading pages...' : 'Load My Rune Pages'}
            </Button>

            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}

            {lcuPages && lcuPages.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">
                  Pick which page Flash For Wards should overwrite during champion select:
                </p>
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

                <Button
                  variant="success"
                  onClick={confirmManualSelection}
                  disabled={selectedPageId === null}
                  className="mt-3"
                >
                  Use selected page →
                </Button>
              </div>
            )}
          </div>
        </li>
      </ol>
    </Modal>
  )
}
