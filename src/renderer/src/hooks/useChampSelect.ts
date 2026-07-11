import { useEffect } from 'react'
import { useAppStore } from '../stores/app-store'
import type { ChampSelectPhase } from '../types'

export function useChampSelect(): void {
  const setChampSelectPhase = useAppStore((s) => s.setChampSelectPhase)

  useEffect(() => {
    const cleanup = window.api.onChampSelectPhase((phase: ChampSelectPhase) => {
      setChampSelectPhase(phase)
    })
    return cleanup
  }, [])
}
