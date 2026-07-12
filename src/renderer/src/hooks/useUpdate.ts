import { useEffect } from 'react'
import { useAppStore } from '../stores/app-store'
import type { UpdateStatus } from '../types'

export function useUpdate(): void {
  const setAppVersion = useAppStore((s) => s.setAppVersion)
  const setUpdateStatus = useAppStore((s) => s.setUpdateStatus)

  useEffect(() => {
    window.api.getAppVersion().then((v: string) => setAppVersion(v))
    const cleanup = window.api.onUpdateStatus((s: UpdateStatus) => setUpdateStatus(s))
    return cleanup
  }, [])
}
