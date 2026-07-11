import React from 'react'
import { useAppStore } from '../../stores/app-store'
import type { View } from '../../App'

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'connected' ? 'bg-green-400' :
    status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
    'bg-gray-500'
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const lcuStatus = useAppStore((s) => s.lcuStatus)
  const champSelectActive = useAppStore((s) => s.champSelectActive)

  return (
    <aside className="w-48 bg-lol-dark-mid border-r border-lol-gold/20 flex flex-col">
      <div className="p-4 border-b border-lol-gold/20">
        <h1 className="text-lol-gold font-bold text-sm leading-tight">Flash For Wards</h1>
        <p className="text-xs text-gray-500 mt-0.5">Rune Manager</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        <button
          onClick={() => onNavigate('pages')}
          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
            currentView === 'pages'
              ? 'bg-lol-gold/20 text-lol-gold'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          My Rune Pages
        </button>

        <button
          onClick={() => onNavigate('champ-select')}
          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${
            currentView === 'champ-select'
              ? 'bg-lol-gold/20 text-lol-gold'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          <span>Champ Select</span>
          {champSelectActive && (
            <span className="w-2 h-2 rounded-full bg-lol-blue animate-pulse shrink-0" />
          )}
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
            currentView === 'settings'
              ? 'bg-lol-gold/20 text-lol-gold'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          Settings
        </button>
      </nav>

      <div className="p-3 border-t border-lol-gold/20 flex items-center gap-2">
        <StatusDot status={lcuStatus} />
        <span className="text-xs text-gray-400 capitalize">{lcuStatus}</span>
      </div>
    </aside>
  )
}
