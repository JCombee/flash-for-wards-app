import { useEffect } from 'react'
import { useAppStore } from '../stores/app-store'
import type { LcuStatus } from '../types'

export function useLcuStatus(): void {
  const setLcuStatus = useAppStore((s) => s.setLcuStatus)

  useEffect(() => {
    window.api.getLcuStatus().then((s: LcuStatus) => setLcuStatus(s.status))
    const cleanup = window.api.onLcuStatus((s: LcuStatus) => setLcuStatus(s.status))
    return cleanup
  }, [])
}
