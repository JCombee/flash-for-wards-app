import { useState } from 'react'
import { useAppStore } from '../../stores/app-store'
import { useRunePages } from '../../hooks/useRunePages'
import { RunePageCard } from '../rune-pages/RunePageCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Notice } from '../ui/Notice'
import { CHAMPION_BY_ID } from '../../data/champions'
import { getDefaultRunePage, defaultPageName } from '../../data/default-runes'
import type { ApplyResult, StoredRunePage } from '../../types'

// The card's action slot stops click propagation, so this needs its own handler
// rather than relying on the card's onClick.
function ApplyButton({
  applying,
  applied,
  disabled,
  onApply
}: {
  applying: boolean
  applied: boolean
  disabled: boolean
  onApply: () => void
}) {
  return (
    <Button variant={applied ? 'success' : 'info'} size="sm" disabled={disabled} onClick={onApply}>
      {applying ? 'Applying…' : applied ? 'Applied' : 'Apply'}
    </Button>
  )
}

export function ChampSelectPanel() {
  const champSelectActive = useAppStore((s) => s.champSelectActive)
  const lcuStatus = useAppStore((s) => s.lcuStatus)
  const runePages = useAppStore((s) => s.runePages)
  const lastApplyStatus = useAppStore((s) => s.lastApplyStatus)
  const lastAppliedId = useAppStore((s) => s.lastAppliedId)
  const lastAppliedName = useAppStore((s) => s.lastAppliedName)
  const lastApplyError = useAppStore((s) => s.lastApplyError)
  const setApplyResult = useAppStore((s) => s.setApplyResult)
  const settings = useAppStore((s) => s.settings)
  const currentChampionId = useAppStore((s) => s.currentChampionId)
  const { refresh } = useRunePages()
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [savingDefault, setSavingDefault] = useState(false)

  const sorted = [...runePages].sort(
    (a, b) =>
      Number(b.pinned ?? false) - Number(a.pinned ?? false) ||
      (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)
  )

  const currentChampion = currentChampionId > 0 ? CHAMPION_BY_ID.get(currentChampionId) : undefined
  const preferred =
    currentChampionId > 0 ? sorted.filter((p) => p.championIds?.includes(currentChampionId)) : []

  // Riot's recommended page for the picked champion — always available, even
  // when the user has their own pages for them.
  const fallback = currentChampionId > 0 ? getDefaultRunePage(currentChampionId) : undefined
  const fallbackPage: StoredRunePage | undefined = fallback && {
    id: `default:${fallback.championId}`,
    name: defaultPageName(fallback.championId),
    primaryStyleId: fallback.primaryStyleId,
    subStyleId: fallback.subStyleId,
    selectedPerkIds: fallback.selectedPerkIds,
    createdAt: 0,
    updatedAt: 0,
    championIds: [fallback.championId]
  }

  async function runApply(id: string, name: string, apply: () => Promise<ApplyResult>) {
    if (applyingId || !champSelectActive) return
    setApplyingId(id)
    setApplyResult('idle')
    try {
      const result = await apply()
      if (result.success) {
        setApplyResult('success', { id, name })
      } else {
        let msg: string
        if (result.error === 'lcu_disconnected') msg = 'Client disconnected — wait for reconnect'
        else if (result.error === 'not_in_champ_select')
          msg = 'Champion select ended — pages can only be applied during champ select'
        else if (result.error === 'no_reserved_page') msg = 'No reserved page set — go to Settings'
        else if (result.error === 'reserved_page_missing')
          msg = 'Reserved page deleted — re-run Setup in Settings'
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

  function applyPage(id: string, name: string) {
    return runApply(id, name, () => window.api.applyRunePage(id))
  }

  function applyFallback() {
    if (!fallbackPage) return
    return runApply(fallbackPage.id, fallbackPage.name, () =>
      window.api.applyRunePageData({
        name: fallbackPage.name,
        primaryStyleId: fallbackPage.primaryStyleId,
        subStyleId: fallbackPage.subStyleId,
        selectedPerkIds: fallbackPage.selectedPerkIds
      })
    )
  }

  // Fork the built-in default into a real page the user owns and can edit.
  async function saveFallback() {
    if (!fallbackPage || savingDefault) return
    setSavingDefault(true)
    try {
      await window.api.createRunePage({
        name: fallbackPage.name,
        primaryStyleId: fallbackPage.primaryStyleId,
        subStyleId: fallbackPage.subStyleId,
        selectedPerkIds: fallbackPage.selectedPerkIds,
        championIds: fallbackPage.championIds ?? [],
        pinned: false
      })
      refresh()
    } finally {
      setSavingDefault(false)
    }
  }

  const noReservedPage = settings && !settings.reservedPageId

  // Applying a page overwrites the reserved slot in the live client — only offer
  // it while the client is actually in champ select.
  if (!champSelectActive) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-lol-gold-light mb-1">Champion Select</h2>
          <p className="text-gray-400 text-sm">
            Rune pages can only be applied while you&apos;re in champion select.
          </p>
        </div>

        {noReservedPage && (
          <div className="mb-4">
            <Notice variant="warning">
              No reserved page configured — go to Settings to link one first.
            </Notice>
          </div>
        )}

        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">Waiting for champion select…</p>
          <p className="text-sm">
            {lcuStatus === 'connected'
              ? 'Start a game — your pages will show up here as soon as you pick.'
              : 'Open the League client to get started.'}
          </p>
        </div>
      </div>
    )
  }

  function renderCard(page: (typeof sorted)[number]) {
    const isApplying = applyingId === page.id
    const wasApplied = lastApplyStatus === 'success' && lastAppliedId === page.id
    return (
      <RunePageCard
        key={page.id}
        page={page}
        highlight={wasApplied}
        disabled={!!applyingId}
        onClick={() => applyPage(page.id, page.name)}
        actions={
          <ApplyButton
            applying={isApplying}
            applied={wasApplied}
            disabled={!!applyingId}
            onApply={() => applyPage(page.id, page.name)}
          />
        }
      />
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-lol-gold-light mb-1">Champion Select</h2>
        <p className="text-gray-400 text-sm">
          Click a rune page to apply it to your reserved slot.
        </p>
      </div>

      {noReservedPage && (
        <div className="mb-4">
          <Notice variant="warning">
            No reserved page configured — go to Settings to link one first.
          </Notice>
        </div>
      )}

      {lastApplyStatus === 'success' && lastAppliedName && (
        <div className="mb-4">
          <Notice variant="success">
            Applied: <strong>{lastAppliedName}</strong>
          </Notice>
        </div>
      )}
      {lastApplyStatus === 'error' && lastApplyError && (
        <div className="mb-4">
          <Notice variant="danger">{lastApplyError}</Notice>
        </div>
      )}

      {preferred.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {currentChampion && (
              <img
                src={currentChampion.iconUrl}
                alt={currentChampion.name}
                className="w-5 h-5 rounded"
              />
            )}
            <h3 className="text-lol-gold text-sm font-bold">
              Preferred{currentChampion ? ` for ${currentChampion.name}` : ''}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {preferred.map(renderCard)}
          </div>
        </div>
      )}

      {fallbackPage && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {currentChampion && (
              <img
                src={currentChampion.iconUrl}
                alt={currentChampion.name}
                className="w-5 h-5 rounded"
              />
            )}
            <h3 className="text-lol-gold text-sm font-bold">
              Recommended{currentChampion ? ` for ${currentChampion.name}` : ''}
            </h3>
            <Badge>{fallback?.position ?? 'DEFAULT'}</Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            The League client&apos;s own page for this champion. Save it to make it yours.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <RunePageCard
              page={fallbackPage}
              highlight={lastApplyStatus === 'success' && lastAppliedId === fallbackPage.id}
              disabled={!!applyingId}
              onClick={applyFallback}
              actions={
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={savingDefault}
                    onClick={saveFallback}
                  >
                    {savingDefault ? 'Saving…' : 'Save'}
                  </Button>
                  <ApplyButton
                    applying={applyingId === fallbackPage.id}
                    applied={lastApplyStatus === 'success' && lastAppliedId === fallbackPage.id}
                    disabled={!!applyingId}
                    onApply={applyFallback}
                  />
                </>
              }
            />
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        !fallbackPage && (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-2">No rune pages saved yet.</p>
            <p className="text-sm">
              Go to <strong className="text-gray-300">My Rune Pages</strong> to create or import
              some.
            </p>
          </div>
        )
      ) : (
        <>
          {(preferred.length > 0 || fallbackPage) && (
            <h3 className="text-gray-400 text-sm font-semibold mb-2">All Pages</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map(renderCard)}
          </div>
        </>
      )}
    </div>
  )
}
