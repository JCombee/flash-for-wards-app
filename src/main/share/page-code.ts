import { deflateRawSync, inflateRawSync } from 'zlib'
import type { DecodeResult, SharePagePayload } from '@shared/share'

/**
 * Codes look like FFW1-<base64url>. The prefix version guards the envelope; the
 * leading 1 inside the payload guards its shape, so a later format can change
 * either without a v1 code silently decoding as garbage.
 */
const PREFIX = 'FFW1-'
const PAYLOAD_VERSION = 1

/** A positional array rather than an object — it roughly halves the code length. */
type Encoded = [
  version: number,
  name: string,
  primaryStyleId: number,
  subStyleId: number,
  selectedPerkIds: number[],
  championIds: number[],
  positions: string[],
  gameModes: string[]
]

export function encodePageCode(page: SharePagePayload): string {
  const encoded: Encoded = [
    PAYLOAD_VERSION,
    page.name,
    page.primaryStyleId,
    page.subStyleId,
    page.selectedPerkIds,
    page.championIds ?? [],
    page.positions ?? [],
    page.gameModes ?? []
  ]
  const packed = deflateRawSync(Buffer.from(JSON.stringify(encoded), 'utf8'))
  return PREFIX + packed.toString('base64url')
}

/**
 * Strict on purpose: a code that came off Discord half-selected should be
 * rejected outright rather than imported as a page with holes in it. Perk ids
 * aren't checked against the rune data here — main has no copy of it — so the
 * renderer validates those before saving.
 */
export function decodePageCode(code: string): DecodeResult {
  const trimmed = code.trim()
  if (!trimmed.startsWith(PREFIX)) {
    return { ok: false, error: 'Not a Flash For Wards code — it should start with FFW1-' }
  }

  let parsed: unknown
  try {
    const raw = inflateRawSync(Buffer.from(trimmed.slice(PREFIX.length), 'base64url'))
    parsed = JSON.parse(raw.toString('utf8'))
  } catch {
    return { ok: false, error: 'Code is damaged — it may have been cut off when copied' }
  }

  if (!Array.isArray(parsed) || parsed[0] !== PAYLOAD_VERSION) {
    return { ok: false, error: 'Code was made by a different version of the app' }
  }

  const [, name, primaryStyleId, subStyleId, selectedPerkIds, championIds, positions, gameModes] =
    parsed as Encoded

  if (typeof name !== 'string' || !name.trim()) {
    return { ok: false, error: 'Code has no page name' }
  }
  if (!isPositiveInt(primaryStyleId) || !isPositiveInt(subStyleId)) {
    return { ok: false, error: 'Code has an invalid rune tree' }
  }
  if (primaryStyleId === subStyleId) {
    return { ok: false, error: 'Code has the same primary and secondary tree' }
  }
  if (
    !Array.isArray(selectedPerkIds) ||
    selectedPerkIds.length !== 9 ||
    !selectedPerkIds.every(isPositiveInt)
  ) {
    return { ok: false, error: 'Code is missing runes' }
  }

  return {
    ok: true,
    page: {
      name: name.trim(),
      primaryStyleId,
      subStyleId,
      selectedPerkIds,
      championIds: toNumbers(championIds),
      positions: toStrings(positions),
      gameModes: toStrings(gameModes)
    }
  }
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function toNumbers(value: unknown): number[] {
  return Array.isArray(value) ? value.filter(isPositiveInt) : []
}

function toStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}
