/**
 * The LCU reports a region ('EUW'). U.GG addresses profiles by platform ID ('euw1');
 * OP.GG, Porofessor and DeepLoL use a short slug ('euw'). Neither is a plain
 * lowercasing of the region — 'EUNE' is `eun1` / `eune` — so both are spelled out.
 */
interface RegionSites {
  /** U.GG. */
  platform: string
  /** Everyone else. */
  slug: string
}

const SITES_BY_REGION: Record<string, RegionSites> = {
  BR: { platform: 'br1', slug: 'br' },
  EUNE: { platform: 'eun1', slug: 'eune' },
  EUW: { platform: 'euw1', slug: 'euw' },
  JP: { platform: 'jp1', slug: 'jp' },
  KR: { platform: 'kr', slug: 'kr' },
  LAN: { platform: 'la1', slug: 'lan' },
  LAS: { platform: 'la2', slug: 'las' },
  ME: { platform: 'me1', slug: 'me' },
  NA: { platform: 'na1', slug: 'na' },
  OCE: { platform: 'oc1', slug: 'oce' },
  PH: { platform: 'ph2', slug: 'ph' },
  RU: { platform: 'ru', slug: 'ru' },
  SG: { platform: 'sg2', slug: 'sg' },
  TH: { platform: 'th2', slug: 'th' },
  TR: { platform: 'tr1', slug: 'tr' },
  TW: { platform: 'tw2', slug: 'tw' },
  VN: { platform: 'vn2', slug: 'vn' }
}

/** Null for a region we have no mapping for — the caller hides the links rather than guess. */
export function sitesForRegion(region: string): RegionSites | null {
  return SITES_BY_REGION[region.toUpperCase()] ?? null
}
