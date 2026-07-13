import { CHAMPION_BY_ID, CHAMPION_BY_NAME } from '../../data/champions'
import { ProfileLinks } from './ProfileLinks'
import type { InGamePlayer, RankedEntry } from '../../types'

/** 'GOLD' + 'II' + 42 → 'Gold II · 42 LP'. Null means we never got the data. */
function formatRank(rank: RankedEntry | null): string {
  if (!rank) return '—'
  if (!rank.tier) return 'Unranked'
  const tier = rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()
  const division = rank.division ? ` ${rank.division}` : ''
  return `${tier}${division} · ${rank.leaguePoints} LP`
}

function rankClass(rank: RankedEntry | null): string {
  if (!rank || !rank.tier) return 'text-gray-600'
  return 'text-gray-300'
}

export function PlayerRow({ player, region }: { player: InGamePlayer; region: string }) {
  const champion = player.championId
    ? CHAMPION_BY_ID.get(player.championId)
    : CHAMPION_BY_NAME.get(player.championName)

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-lol-gold/10 last:border-b-0">
      {champion ? (
        <img src={champion.iconUrl} alt={champion.name} className="w-8 h-8 rounded-full shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-black/30 border border-lol-gold/20 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-gray-200 truncate">
            {player.riotId || <span className="text-gray-600">Hidden</span>}
          </span>
          {player.summonerLevel > 0 && (
            <span className="text-xs text-gray-500 shrink-0">Lv {player.summonerLevel}</span>
          )}
        </div>
        <div className="flex gap-3 mt-0.5 text-xs">
          <span className={rankClass(player.soloRank)}>
            <span className="text-gray-600">Solo </span>
            {formatRank(player.soloRank)}
          </span>
          <span className={rankClass(player.flexRank)}>
            <span className="text-gray-600">Flex </span>
            {formatRank(player.flexRank)}
          </span>
        </div>
      </div>

      <ProfileLinks riotId={player.riotId} region={region} />
    </div>
  )
}
