import type { RunePageStats } from './index'

/** Card size in CSS pixels. The capture window renders it at PREVIEW_SCALE. */
export const PREVIEW_WIDTH = 1000
export const PREVIEW_HEIGHT = 620

/** Rendered at 2x so the PNG is crisp regardless of the user's display scaling. */
export const PREVIEW_SCALE = 2

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
