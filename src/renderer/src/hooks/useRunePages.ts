import { useEffect, useCallback } from 'react'
import { useAppStore } from '../stores/app-store'

export function useRunePages() {
  const setRunePages = useAppStore((s) => s.setRunePages)

  const refresh = useCallback(async () => {
    const pages = await window.api.getRunePages()
    setRunePages(pages)
  }, [])

  useEffect(() => {
    refresh()
  }, [])

  return { refresh }
}
