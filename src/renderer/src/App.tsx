import React, { useState, useEffect } from 'react'
import { useLcuStatus } from './hooks/useLcuStatus'
import { useRunePages } from './hooks/useRunePages'
import { useSettings } from './hooks/useSettings'
import { useChampSelect } from './hooks/useChampSelect'
import { useInGame } from './hooks/useInGame'
import { useUpdate } from './hooks/useUpdate'
import { useAppStore } from './stores/app-store'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { UpdateBanner } from './components/layout/UpdateBanner'
import { OnboardingModal } from './components/onboarding/OnboardingModal'
import { RunePageList } from './components/rune-pages/RunePageList'
import { ChampSelectPanel } from './components/champ-select/ChampSelectPanel'
import { InGamePanel } from './components/in-game/InGamePanel'
import { SettingsPage } from './components/settings/SettingsPage'

export type View = 'pages' | 'champ-select' | 'in-game' | 'settings'

export default function App() {
  useLcuStatus()
  useRunePages()
  useSettings()
  useChampSelect()
  useInGame()
  useUpdate()

  const [currentView, setCurrentView] = useState<View>('pages')
  const champSelectActive = useAppStore((s) => s.champSelectActive)
  const inProgress = useAppStore((s) => s.inGameSnapshot.phase === 'InProgress')

  // Auto-navigate to champ select panel when phase fires — picking a page is the
  // point of champ select, so it wins over the roster tab, which is also live then.
  useEffect(() => {
    if (champSelectActive) setCurrentView('champ-select')
  }, [champSelectActive])

  useEffect(() => {
    if (inProgress) setCurrentView('in-game')
  }, [inProgress])

  function renderMain() {
    if (currentView === 'champ-select') return <ChampSelectPanel />
    if (currentView === 'in-game') return <InGamePanel />
    if (currentView === 'settings') return <SettingsPage />
    return <RunePageList />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-lol-dark">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <UpdateBanner />
        {renderMain()}
        <StatusBar />
      </main>
      <OnboardingModal />
    </div>
  )
}
