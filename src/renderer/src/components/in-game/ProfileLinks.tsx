import { useState } from 'react'
import { sitesForRegion } from '../../data/regions'

interface Site {
  name: string
  /** Shown in place of the favicon when it fails to load — offline, or the site moved it. */
  initial: string
  /** The site's own favicon. Not always at /favicon.ico — these are the URLs that actually resolve. */
  favicon: string
  url: (slug: string, platform: string, name: string, tag: string) => string
}

const SITES: Site[] = [
  {
    name: 'OP.GG',
    initial: 'O',
    favicon: 'https://op.gg/favicon.ico',
    url: (slug, _platform, name, tag) => `https://op.gg/lol/summoners/${slug}/${name}-${tag}`
  },
  {
    name: 'U.GG',
    initial: 'U',
    favicon: 'https://static.bigbrain.gg/assets/ugg/favicon/favicon-32x32.png',
    url: (_slug, platform, name, tag) =>
      `https://u.gg/lol/profile/${platform}/${name}-${tag}/overview`
  },
  {
    name: 'Porofessor',
    initial: 'P',
    favicon: 'https://cdn2.porofessor.gg/img/favicon_v2.png',
    url: (slug, _platform, name, tag) => `https://porofessor.gg/live/${slug}/${name}-${tag}`
  },
  {
    name: 'DeepLoL',
    initial: 'D',
    favicon: 'https://www.deeplol.gg/favicon.ico',
    url: (slug, _platform, name, tag) => `https://www.deeplol.gg/summoner/${slug}/${name}-${tag}`
  }
]

function SiteLink({ site, href }: { site: Site; href: string }) {
  const [broken, setBroken] = useState(false)

  return (
    // Several of these marks are dark glyphs on transparency — invisible against the
    // panel — so every one sits on the same light tile.
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={`${site.name} profile`}
      className="shrink-0 w-6 h-6 flex items-center justify-center rounded bg-white/80 hover:bg-white transition-colors"
    >
      {broken ? (
        <span className="text-[10px] font-bold text-gray-700">{site.initial}</span>
      ) : (
        <img
          src={site.favicon}
          alt={site.name}
          className="w-4 h-4 object-contain"
          onError={() => setBroken(true)}
        />
      )}
    </a>
  )
}

/**
 * Third-party profile pages for one player. The main process's window-open handler
 * turns these into `shell.openExternal` calls, so they land in the system browser.
 */
export function ProfileLinks({ riotId, region }: { riotId: string; region: string }) {
  const [gameName, tagLine] = riotId.split('#')
  const sites = sitesForRegion(region)
  // No identity (a hidden enemy or a bot), or a region we have no mapping for.
  if (!gameName || !tagLine || !sites) return null

  const name = encodeURIComponent(gameName)
  const tag = encodeURIComponent(tagLine)

  return (
    <div className="shrink-0 flex items-center gap-1.5">
      {SITES.map((site) => (
        <SiteLink
          key={site.name}
          site={site}
          href={site.url(sites.slug, sites.platform, name, tag)}
        />
      ))}
    </div>
  )
}
