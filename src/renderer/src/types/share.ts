import type { RunePageStats } from './index'

/** Card width in CSS pixels. Its height follows from the content, so it isn't fixed. */
export const PREVIEW_WIDTH = 1000

/**
 * How far the card is zoomed before capture, to keep the PNG sharp. This is the
 * ideal; the real scale is whatever the display can hold (see captureScale in main).
 */
export const PREVIEW_SCALE = 2

/** The measured size of the rendered card, in CSS pixels. */
export interface PreviewSize {
  width: number
  height: number
}

/** Everything the shared image (or a share code) needs to describe a page. */
export interface SharePagePayload {
  name: string
  primaryStyleId: number
  subStyleId: number
  selectedPerkIds: number[]
  championIds?: number[]
  positions?: string[]
  gameModes?: string[]
  stats?: RunePageStats
}

export interface ShareImageRequest {
  page: SharePagePayload
  action: 'clipboard' | 'save'
}

export type ShareImageResult =
  | { success: true; action: 'clipboard' }
  | { success: true; action: 'save'; filePath: string }
  | {
      success: false
      error: 'canceled' | 'render_failed' | 'write_failed'
      errorDetail?: string
    }

export type DecodeResult = { ok: true; page: SharePagePayload } | { ok: false; error: string }
