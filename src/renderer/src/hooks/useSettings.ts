import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app-store'
import type { AppSettings } from '../types'

export function useSettings() {
  const setSettings = useAppStore((s) => s.setSettings)

  const refresh = useCallback(async () => {
    const s = await window.api.getSettings()
    setSettings(s)
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  const update = useCallback(async (data: Partial<AppSettings>) => {
    const s = await window.api.setSettings(data)
    setSettings(s)
    return s
  }, [])

  return { refresh, update }
}
