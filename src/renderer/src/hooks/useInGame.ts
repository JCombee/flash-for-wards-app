import { useEffect } from 'react'
import { useAppStore } from '../stores/app-store'
import type { InGameSnapshot } from '../types'

export function useInGame(): void {
  const setInGameSnapshot = useAppStore((s) => s.setInGameSnapshot)

  useEffect(() => {
    window.api.getInGameSnapshot().then((s: InGameSnapshot) => setInGameSnapshot(s))
    const cleanup = window.api.onInGameSnapshot((s: InGameSnapshot) => setInGameSnapshot(s))
    return cleanup
  }, [])
}
