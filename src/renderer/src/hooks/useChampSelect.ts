import { useEffect } from 'react'
import { useAppStore } from '../stores/app-store'
import type { ChampSelectPhase, ChampSelectQueue } from '../types'

/** Minimal shape of the raw LCU champ-select session we consume. */
interface ChampSelectSession {
  localPlayerCellId?: number
  myTeam?: {
    cellId: number
    championId?: number
    championPickIntent?: number
    /** Lowercase ('middle'), and empty in blind pick / ARAM. */
    assignedPosition?: string
  }[]
}

export function useChampSelect(): void {
  const setChampSelectPhase = useAppStore((s) => s.setChampSelectPhase)
  const setCurrentChampionId = useAppStore((s) => s.setCurrentChampionId)
  const setCurrentPosition = useAppStore((s) => s.setCurrentPosition)
  const setCurrentQueue = useAppStore((s) => s.setCurrentQueue)

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
      setCurrentPosition((me?.assignedPosition ?? '').toUpperCase())
    })

    const cleanupQueue = window.api.onChampSelectQueue((queue: ChampSelectQueue) => {
      setCurrentQueue(queue)
    })

    return () => {
      cleanupPhase()
      cleanupSession()
      cleanupQueue()
    }
  }, [])
}
