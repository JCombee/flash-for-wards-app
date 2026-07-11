import React, { useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import { RunePageCard } from '../rune-pages/RunePageCard'

export function ChampSelectPanel() {
  const runePages = useAppStore((s) => s.runePages)
  const lastApplyStatus = useAppStore((s) => s.lastApplyStatus)
  const lastAppliedName = useAppStore((s) => s.lastAppliedName)
  const lastApplyError = useAppStore((s) => s.lastApplyError)
  const setApplyResult = useAppStore((s) => s.setApplyResult)
  const settings = useAppStore((s) => s.settings)
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const sorted = [...runePages].sort(
    (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)
  )

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((page) => {
            const isApplying = applyingId === page.id
            const wasApplied = lastApplyStatus === 'success' && lastAppliedName === page.name
            return (
              <RunePageCard
                key={page.id}
                page={page}
                highlight={wasApplied}
                disabled={!!applyingId}
                onClick={() => applyPage(page.id, page.name)}
                actions={
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${
                      isApplying
                        ? 'bg-gray-600 text-gray-300'
                        : wasApplied
                        ? 'bg-green-600 text-white'
                        : 'bg-lol-blue text-lol-dark'
                    }`}
                  >
                    {isApplying ? 'Applying…' : wasApplied ? 'Applied' : 'Apply'}
                  </span>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
