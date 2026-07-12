import { useAppStore } from '../../stores/app-store'
import { NavItem } from '../ui/NavItem'
import { StatusDot } from '../ui/StatusDot'
import logoIcon from '../../assets/logo-icon.svg'
import type { View } from '../../App'

interface SidebarProps {
  currentView: View
  onNavigate: (view: View) => void
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const lcuStatus = useAppStore((s) => s.lcuStatus)
  const champSelectActive = useAppStore((s) => s.champSelectActive)

  return (
    <aside className="w-48 bg-lol-dark-mid border-r border-lol-gold/20 flex flex-col">
      <div className="p-4 border-b border-lol-gold/20 flex items-center gap-2.5">
        <img src={logoIcon} alt="" className="w-7 h-7 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-lol-gold font-bold text-sm leading-tight">Flash For Wards</h1>
          <p className="text-xs text-gray-500 mt-0.5">Rune Manager</p>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        <NavItem active={currentView === 'pages'} onClick={() => onNavigate('pages')}>
          My Rune Pages
        </NavItem>
        <NavItem
          active={currentView === 'champ-select'}
          onClick={() => onNavigate('champ-select')}
          live={champSelectActive}
        >
          Champ Select
        </NavItem>
        <NavItem active={currentView === 'settings'} onClick={() => onNavigate('settings')}>
          Settings
        </NavItem>
      </nav>

      <div className="p-3 border-t border-lol-gold/20 flex items-center gap-2">
        <StatusDot status={lcuStatus} />
        <span className="text-xs text-gray-400 capitalize">{lcuStatus}</span>
      </div>
    </aside>
  )
}
