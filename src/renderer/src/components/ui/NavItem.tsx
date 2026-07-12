import type { ReactNode } from 'react'

interface NavItemProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  /** Pulsing blue dot — the "live" affordance, used only for an active champ select. */
  live?: boolean
}

export function NavItem({ active, onClick, children, live = false }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${
        active ? 'bg-lol-gold/20 text-lol-gold' : 'text-gray-300 hover:bg-white/5'
      }`}
    >
      <span>{children}</span>
      {live && <span className="w-2 h-2 rounded-full bg-lol-blue animate-pulse shrink-0" />}
    </button>
  )
}
