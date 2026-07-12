import { useEffect } from 'react'
import { useAppStore } from '../stores/app-store'
import type { ChampSelectPhase } from '../types'

/** Minimal shape of the raw LCU champ-select session we consume. */
interface ChampSelectSession {
  localPlayerCellId?: number
  myTeam?: {
    cellId: number
    championId?: number
    championPickIntent?: number
  }[]
}

export function useChampSelect(): void {
  const setChampSelectPhase = useAppStore((s) => s.setChampSelectPhase)
  const setCurrentChampionId = useAppStore((s) => s.setCurrentChampionId)

  useEffect(() => {
    const cleanupPhase = window.api.onChampSelectPhase((phase: ChampSelectPhase) => {
      setChampSelectPhase(phase)
    })

    const cleanupSession = window.api.onChampSelectSession((raw: unknown) => {
      // Tolerate both the bare session and a WS { data: session } envelope
      const outer = raw as ChampSelectSession & { data?: ChampSelectSession }
      const session = outer?.myTeam ? outer : (outer?.data ?? ({} as ChampSelectSession))
      const me = session.myTeam?.find((p) => p.cellId === session.localPlayerCellId)
      // pickIntent covers the hover phase; championId is set once locked in.
      const champId = me ? me.championId || me.championPickIntent || 0 : 0
      setCurrentChampionId(champId)
    })

    return () => {
      cleanupPhase()
      cleanupSession()
    }
  }, [])
}
