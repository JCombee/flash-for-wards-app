import { useEffect, useRef, useState } from 'react'
import { RunePagePreview } from './RunePagePreview'
import type { SharePagePayload } from '../../types/share'

/** Give up waiting on the rune CDN and let the capture happen anyway. */
const IMAGE_TIMEOUT_MS = 6000

/**
 * The root of the hidden capture window.
 *
 * The card's height depends on its content, so main opens this twice: once at 1x
 * to learn how big the card really is, then again at the zoom it picked, in a
 * window sized to match. Either way this reports the size it drew.
 *
 * `zoom` rather than `transform: scale` on purpose: zoom affects layout, so the
 * size reported here is the size that gets captured.
 */
export function PreviewRoot() {
  const [page, setPage] = useState<SharePagePayload | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const zoom = Number(new URLSearchParams(window.location.search).get('scale')) || 1

  useEffect(() => {
    // Any overflow at all would put the app's gold scrollbars in the image.
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.margin = '0'

    void window.api.previewPayload().then(setPage)
  }, [])

  useEffect(() => {
    if (!page || !ref.current) return
    const el = ref.current

    const images = Array.from(el.querySelectorAll('img'))
    // decode() (unlike onload) resolves only once the bitmap is paintable.
    const decoded = images.map((img) =>
      img.complete && img.naturalWidth > 0 ? Promise.resolve() : img.decode().catch(() => undefined)
    )

    void Promise.race([
      Promise.all(decoded),
      new Promise((resolve) => setTimeout(resolve, IMAGE_TIMEOUT_MS))
    ]).then(() => {
      const { width, height } = el.getBoundingClientRect()
      window.api.previewSize({ width, height })
    })
  }, [page])

  if (!page) return null

  return (
    <div ref={ref} className="inline-block" style={{ zoom }}>
      <RunePagePreview page={page} />
    </div>
  )
}
