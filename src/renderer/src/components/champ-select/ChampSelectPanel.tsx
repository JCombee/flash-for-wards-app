import React, { useState } from 'react'
import { useAppStore } from '../../stores/app-store'

export function ChampSelectPanel() {
  const runePages = useAppStore((s) => s.runePages)
  const lastApplyStatus = useAppStore((s) => s.lastApplyStatus)
  const lastAppliedName = useAppStore((s) => s.lastAppliedName)
  const lastApplyError = useAppStore((s) => s.lastApplyError)
  const setApplyResult = useAppStore((s) => s.setApplyResult)
  const settings = useAppStore((s) => s.settings)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const sorted = [...runePages].sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))

  async function applyPage(id: string, name: string) {
    if (applyingId) return
    setApplyingId(id)
    setApplyResult('idle')
    try {
      const result = await window.api.applyRunePage(id)
      if (result.success) {
        setApplyResult('success', name)
      } else {
        let msg: string
        if (result.error === 'lcu_disconnected') msg = 'Client disconnected — wait for reconnect'
        else if (result.error === 'no_reserved_page') msg = 'No reserved page set — go to Settings'
        else if (result.error === 'reserved_page_missing') msg = 'Reserved page deleted — re-run Setup in Settings'
        else if (result.error === 'page_not_found') msg = 'Rune page not found in database'
        else msg = result.errorDetail ?? 'Unknown error from LCU'
        setApplyResult('error', undefined, msg)
      }
    } catch (err: unknown) {
      setApplyResult('error', undefined, String(err))
    } finally {
      setApplyingId(null)
    }
  }

  const noReservedPage = settings && !settings.reservedPageId

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lol-blue text-lg font-bold mb-1">Champion Select</h2>
        <p className="text-gray-400 text-sm">Click a rune page to apply it to your reserved slot.</p>
      </div>

      {noReservedPage && (
        <div className="mb-4 px-4 py-3 bg-yellow-900/30 border border-yellow-500/30 rounded text-yellow-400 text-sm">
          No reserved page configured — go to Settings to link one first.
        </div>
      )}

      {lastApplyStatus === 'success' && lastAppliedName && (
        <div className="mb-4 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded text-green-400 text-sm">
          Applied: <strong>{lastAppliedName}</strong>
        </div>
      )}
      {lastApplyStatus === 'error' && lastApplyError && (
        <div className="mb-4 px-4 py-2 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-sm">
          {lastApplyError}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No rune pages saved yet.</p>
          <p className="text-sm">Go to <strong className="text-gray-300">My Rune Pages</strong> to create or import some.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((page) => {
            const isApplying = applyingId === page.id
            const wasApplied = lastApplyStatus === 'success' && lastAppliedName === page.name
            return (
              <button
                key={page.id}
                onClick={() => applyPage(page.id, page.name)}
                disabled={!!applyingId}
                className={`w-full text-left flex items-center justify-between rounded-lg px-4 py-3 border transition-all ${
                  wasApplied
                    ? 'border-green-500/50 bg-green-900/20'
                    : 'border-lol-gold/20 bg-lol-dark-mid hover:border-lol-gold/50 hover:bg-lol-gold/5'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div>
                  <p className="text-sm font-medium text-lol-gold-light">{page.name}</p>
                  {page.lastUsedAt && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Last used {new Date(page.lastUsedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${
                  isApplying
                    ? 'bg-gray-600 text-gray-300'
                    : wasApplied
                    ? 'bg-green-600 text-white'
                    : 'bg-lol-blue text-lol-dark'
                }`}>
                  {isApplying ? 'Applying…' : wasApplied ? 'Applied' : 'Apply'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
