import React, { useState, useEffect } from 'react'
import { useLcuStatus } from './hooks/useLcuStatus'
import { useRunePages } from './hooks/useRunePages'
import { useSettings } from './hooks/useSettings'
import { useChampSelect } from './hooks/useChampSelect'
import { useAppStore } from './stores/app-store'
import { Sidebar } from './components/layout/Sidebar'
import { StatusBar } from './components/layout/StatusBar'
import { OnboardingModal } from './components/onboarding/OnboardingModal'
import { RunePageList } from './components/rune-pages/RunePageList'
import { ChampSelectPanel } from './components/champ-select/ChampSelectPanel'
import { SettingsPage } from './components/settings/SettingsPage'

export type View = 'pages' | 'champ-select' | 'settings'

export default function App() {
  useLcuStatus()
  useRunePages()
  useSettings()
  useChampSelect()

  const [currentView, setCurrentView] = useState<View>('pages')
  const champSelectActive = useAppStore((s) => s.champSelectActive)

  // Auto-navigate to champ select panel when phase fires
  useEffect(() => {
    if (champSelectActive) setCurrentView('champ-select')
  }, [champSelectActive])

  function renderMain() {
    if (currentView === 'champ-select') return <ChampSelectPanel />
    if (currentView === 'settings') return <SettingsPage />
    return <RunePageList />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-lol-dark">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderMain()}
        <StatusBar />
      </main>
      <OnboardingModal />
    </div>
  )
}
