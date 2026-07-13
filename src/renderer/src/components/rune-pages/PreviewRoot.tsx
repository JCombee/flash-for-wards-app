import { useEffect, useRef, useState } from 'react'
import { RunePagePreview } from './RunePagePreview'
import { PREVIEW_SCALE, type SharePagePayload } from '../../types/share'

/** Give up waiting on the rune CDN and let the capture happen anyway. */
const IMAGE_TIMEOUT_MS = 6000

/**
 * The root of the hidden capture window. Renders one page at PREVIEW_SCALE, then
 * tells main it's safe to capture — only once every rune icon has actually
 * decoded, or the CDN has had long enough.
 */
export function PreviewRoot() {
  const [page, setPage] = useState<SharePagePayload | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void window.api.previewPayload().then(setPage)
  }, [])

  useEffect(() => {
    if (!page || !ref.current) return

    const images = Array.from(ref.current.querySelectorAll('img'))
    // decode() (unlike onload) resolves only once the bitmap is paintable.
    const decoded = images.map((img) =>
      img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => undefined)
    )

    void Promise.race([
      Promise.all(decoded),
      new Promise((resolve) => setTimeout(resolve, IMAGE_TIMEOUT_MS))
    ]).then(() => {
      // Two frames: the first schedules the paint, the second lands after it.
      requestAnimationFrame(() => requestAnimationFrame(() => window.api.previewReady()))
    })
  }, [page])

  if (!page) return null

  return (
    <div ref={ref} style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
      <RunePagePreview page={page} />
    </div>
  )
}
