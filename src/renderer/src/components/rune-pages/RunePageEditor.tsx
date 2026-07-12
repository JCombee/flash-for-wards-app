import React, { useState, useEffect } from 'react'
import type { StoredRunePage, LcuRunePage } from '../../types'
import { useAppStore } from '../../stores/app-store'
import { RuneTreeEditor } from './RuneTreeEditor'
import { ChampionPicker } from './ChampionPicker'

interface RunePageEditorProps {
  page?: StoredRunePage
  onSave: () => void
  onCancel: () => void
}

export function RunePageEditor({ page, onSave, onCancel }: RunePageEditorProps) {
  const lcuStatus = useAppStore((s) => s.lcuStatus)

  const [tab, setTab] = useState<'runes' | 'champions'>('runes')
  const [mode, setMode] = useState<'import' | 'visual'>('visual')
  const [lcuPages, setLcuPages] = useState<LcuRunePage[]>([])
  const [loadingLcu, setLoadingLcu] = useState(false)
  const [name, setName] = useState(page?.name ?? '')
  const [editingName, setEditingName] = useState(!page)
  const [primaryStyleId, setPrimaryStyleId] = useState(page?.primaryStyleId ?? 8000)
  const [subStyleId, setSubStyleId] = useState(page?.subStyleId ?? 8100)
  const [selectedPerkIds, setSelectedPerkIds] = useState<number[]>(
    page?.selectedPerkIds ?? Array(9).fill(0)
  )
  const [championIds, setChampionIds] = useState<number[]>(page?.championIds ?? [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'import' && lcuStatus === 'connected') {
      setLoadingLcu(true)
      window.api.getLcuPages()
        .then(setLcuPages)
        .finally(() => setLoadingLcu(false))
    }
  }, [mode, lcuStatus])

  function selectLcuPage(lp: LcuRunePage) {
    setName(lp.name)
    setPrimaryStyleId(lp.primaryStyleId)
    setSubStyleId(lp.subStyleId)
    setSelectedPerkIds(lp.selectedPerkIds)
    setMode('visual')
  }

  const complete =
    name.trim().length > 0 &&
    primaryStyleId !== subStyleId &&
    subStyleId > 0 &&
    selectedPerkIds.length === 9 &&
    selectedPerkIds.every((id) => id > 0)

  async function handleSave() {
    if (!complete) return
    setSaving(true)
    try {
      const data = { name: name.trim(), primaryStyleId, subStyleId, selectedPerkIds, championIds }
      if (page) {
        await window.api.updateRunePage(page.id, data)
      } else {
        await window.api.createRunePage(data)
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
      <div className="bg-lol-dark-mid border border-lol-gold/40 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          {editingName ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false)
              }}
              autoFocus
              className="flex-1 bg-black/40 border border-lol-gold/30 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-lol-gold/60"
              placeholder="e.g. Conqueror Garen"
            />
          ) : (
            <>
              <h2 className="text-lol-gold font-bold truncate">{name || 'Untitled Page'}</h2>
              <button
                onClick={() => setEditingName(true)}
                className="text-gray-500 hover:text-lol-gold transition-colors"
                title="Rename"
              >
                ✎
              </button>
              <div className="flex-1" />
            </>
          )}
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('runes')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${tab === 'runes' ? 'bg-lol-gold text-lol-dark font-semibold' : 'bg-white/10 text-gray-300'}`}
          >
            Runes
          </button>
          <button
            onClick={() => setTab('champions')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${tab === 'champions' ? 'bg-lol-gold text-lol-dark font-semibold' : 'bg-white/10 text-gray-300'}`}
          >
            Champions{championIds.length > 0 ? ` (${championIds.length})` : ''}
          </button>
        </div>

        {tab === 'runes' && (
          <div className="space-y-3">
            {!page && mode === 'visual' && (
              <div className="flex justify-end">
                <button
                  onClick={() => setMode('import')}
                  className="px-3 py-1.5 rounded text-sm bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                >
                  ⬇ Import from client
                </button>
              </div>
            )}

            {!page && mode === 'import' ? (
              <div>
                {lcuStatus !== 'connected' && (
                  <p className="text-yellow-400 text-sm mb-2">LCU not connected — open the League client first.</p>
                )}
                {loadingLcu && <p className="text-gray-400 text-sm">Loading pages from client...</p>}
                {!loadingLcu && lcuPages.length > 0 && (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-2">Select a page to import:</p>
                    {lcuPages.map((lp) => (
                      <button
                        key={lp.id}
                        onClick={() => selectLcuPage(lp)}
                        className="w-full text-left px-3 py-2 rounded bg-black/30 hover:bg-lol-gold/10 border border-transparent hover:border-lol-gold/30 text-sm text-gray-200 transition-colors"
                      >
                        {lp.name}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setMode('visual')}
                  className="mt-3 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ← Back to editor
                </button>
              </div>
            ) : (
              <RuneTreeEditor
                primaryStyleId={primaryStyleId}
                subStyleId={subStyleId}
                selectedPerkIds={selectedPerkIds}
                onChange={(next) => {
                  setPrimaryStyleId(next.primaryStyleId)
                  setSubStyleId(next.subStyleId)
                  setSelectedPerkIds(next.selectedPerkIds)
                }}
              />
            )}
          </div>
        )}

        {tab === 'champions' && (
          <ChampionPicker selectedIds={championIds} onChange={setChampionIds} />
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !complete}
            className="px-4 py-2 bg-lol-gold hover:bg-lol-gold/80 text-lol-dark font-semibold rounded text-sm disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Page'}
          </button>
        </div>
      </div>
    </div>
  )
}
