import { useAppStore } from '../../stores/app-store'
import { Badge } from '../ui/Badge'
import { Notice } from '../ui/Notice'
import { PlayerRow } from './PlayerRow'
import type { InGamePlayer } from '../../types'

function Team({
  label,
  players,
  region
}: {
  label: string
  players: InGamePlayer[]
  region: string
}) {
  return (
    <div className="bg-lol-dark-mid border border-lol-gold/20 rounded-lg overflow-hidden">
      <h3 className="text-lol-gold text-sm font-bold px-3 py-2 border-b border-lol-gold/20">
        {label}
      </h3>
      {players.length === 0 ? (
        <p className="px-3 py-4 text-sm text-gray-600">No players reported yet.</p>
      ) : (
        players.map((p, i) => (
          <PlayerRow key={p.puuid || `${label}-${i}`} player={p} region={region} />
        ))
      )}
    </div>
  )
}

export function InGamePanel() {
  const snapshot = useAppStore((s) => s.inGameSnapshot)
  const lcuStatus = useAppStore((s) => s.lcuStatus)

  // Every real account resolves to a level and a rank; anyone still missing one
  // has no account behind them (a bot) or was withheld by the client.
  const someoneUnresolved = [...snapshot.allyTeam, ...snapshot.enemyTeam].some(
    (p) => p.summonerLevel === 0
  )

  if (!snapshot.active) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-lol-gold-light mb-1">In Game</h2>
          <p className="text-gray-400 text-sm">
            Both teams, with account level and ranked standing.
          </p>
        </div>

        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">Not in a game.</p>
          <p className="text-sm">
            {lcuStatus === 'connected'
              ? 'Rosters show up here as soon as champion select starts.'
              : 'Open the League client to get started.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-lol-gold-light">In Game</h2>
          <Badge variant="accent">
            {snapshot.phase === 'ChampSelect' ? 'Champion Select' : 'In Progress'}
          </Badge>
        </div>
        <p className="text-gray-400 text-sm">Both teams, with account level and ranked standing.</p>
      </div>

      {snapshot.source === 'live-client' && someoneUnresolved && (
        <div className="mb-4">
          <Notice variant="info">
            Rows without a level or rank have no account behind them — bots, or a player the client
            refused to resolve.
          </Notice>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Team label="Your Team" players={snapshot.allyTeam} region={snapshot.region} />
        <Team label="Enemy Team" players={snapshot.enemyTeam} region={snapshot.region} />
      </div>
    </div>
  )
}
