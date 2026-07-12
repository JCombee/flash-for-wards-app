import { useState, useEffect } from 'react'
import { useAppStore } from '../../stores/app-store'
import { useSettings } from '../../hooks/useSettings'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
import type { LcuRunePage } from '../../types'

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings)
  const lcuStatus = useAppStore((s) => s.lcuStatus)
  const { update, refresh } = useSettings()
  const [detecting, setDetecting] = useState(false)
  const [detectResult, setDetectResult] = useState<{
    found: boolean
    pageId?: number
    error?: string
    message?: string
  } | null>(null)
  const [lcuPages, setLcuPages] = useState<LcuRunePage[]>([])
  const [loadingPages, setLoadingPages] = useState(false)

  useEffect(() => {
    if (lcuStatus === 'connected') {
      setLoadingPages(true)
      window.api
        .getLcuPages()
        .then(setLcuPages)
        .finally(() => setLoadingPages(false))
    }
  }, [lcuStatus])

  async function detect() {
    setDetecting(true)
    setDetectResult(null)
    try {
      const r = await window.api.findReservedPage()
      setDetectResult(r)
      if (r.found) refresh()
    } finally {
      setDetecting(false)
    }
  }

  async function setReservedPage(pageId: number) {
    await update({ reservedPageId: pageId })
  }

  async function toggleAutoFocus() {
    if (!settings) return
    await update({ autoFocusOnChampSelect: !settings.autoFocusOnChampSelect })
  }

  async function toggleLaunchOnStartup() {
    if (!settings) return
    await update({ launchOnStartup: !settings.launchOnStartup })
  }

  async function resetOnboarding() {
    await update({ onboardingComplete: false, reservedPageId: null })
  }

  if (!settings) return null

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-lol-gold-light mb-6">Settings</h2>

      <section className="mb-8">
        <h3 className="text-sm font-semibold text-lol-gold mb-3 uppercase tracking-wider">
          Reserved Rune Page
        </h3>
        <div className="bg-lol-dark-mid border border-lol-gold/20 rounded-lg p-4 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Current reserved page</p>
            {settings.reservedPageId ? (
              <p className="text-sm text-white">
                ID: <span className="text-lol-gold font-mono">{settings.reservedPageId}</span>{' '}
                <span className="text-gray-500 text-xs">({settings.reservedPageName})</span>
              </p>
            ) : (
              <p className="text-sm text-red-400">Not configured</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={detect} disabled={detecting || lcuStatus !== 'connected'}>
              {detecting ? 'Searching...' : 'Detect by Name'}
            </Button>
          </div>

          {detectResult && detectResult.found && (
            <p className="text-green-400 text-sm">Found and linked (ID: {detectResult.pageId})</p>
          )}
          {detectResult && !detectResult.found && (
            <p className="text-red-400 text-sm">
              {detectResult.error === 'lcu_disconnected'
                ? 'Client not connected — open League client first.'
                : detectResult.error === 'request_failed'
                  ? `Request failed: ${detectResult.message ?? 'unknown'}`
                  : `No page named "${settings.reservedPageName}" found.`}
            </p>
          )}

          {lcuStatus === 'connected' && !loadingPages && lcuPages.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Or manually pick a page slot:</p>
              <select
                className="bg-black/40 border border-lol-gold/40 focus:border-lol-gold/60 rounded px-3 py-2 text-sm text-white w-full outline-none transition-colors"
                value={settings.reservedPageId ?? ''}
                onChange={(e) => setReservedPage(Number(e.target.value))}
              >
                <option value="">— select a page —</option>
                {lcuPages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-sm font-semibold text-lol-gold mb-3 uppercase tracking-wider">
          Behavior
        </h3>
        <div className="bg-lol-dark-mid border border-lol-gold/20 rounded-lg p-4 space-y-4">
          <Toggle
            checked={settings.autoFocusOnChampSelect}
            onChange={toggleAutoFocus}
            label="Bring window to front when champion select starts"
            hint="Focused once — it drops behind again as soon as you click away"
          />
          <Toggle
            checked={settings.launchOnStartup}
            onChange={toggleLaunchOnStartup}
            label="Launch on system startup"
            hint="Start Flash For Wards automatically when you log in"
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-lol-gold mb-3 uppercase tracking-wider">Setup</h3>
        <div className="bg-lol-dark-mid border border-lol-gold/20 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-3">
            Re-run the first-time setup to change your reserved page.
          </p>
          <Button variant="secondary" onClick={resetOnboarding}>
            Reset Setup
          </Button>
        </div>
      </section>
    </div>
  )
}
