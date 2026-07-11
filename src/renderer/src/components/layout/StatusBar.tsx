import React from 'react'
import { useAppStore } from '../../stores/app-store'

export function StatusBar() {
  const champSelectActive = useAppStore((s) => s.champSelectActive)
  const lastApplyStatus = useAppStore((s) => s.lastApplyStatus)
  const lastAppliedName = useAppStore((s) => s.lastAppliedName)

  return (
    <div className="h-7 bg-lol-dark border-t border-lol-gold/10 flex items-center px-4 gap-4 text-xs">
      {champSelectActive && (
        <span className="text-lol-blue animate-pulse font-semibold">CHAMP SELECT ACTIVE</span>
      )}
      {lastApplyStatus === 'success' && lastAppliedName && (
        <span className="text-green-400">Applied: {lastAppliedName}</span>
      )}
      {lastApplyStatus === 'error' && (
        <span className="text-red-400">Apply failed — check settings</span>
      )}
    </div>
  )
}
