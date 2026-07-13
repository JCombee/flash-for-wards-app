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
    // A game resolving in the background changes a page's win/loss record.
    return window.api.onRunePagesChanged(refresh)
  }, [])

  return { refresh }
}
