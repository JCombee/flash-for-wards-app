import { useAppStore } from '../../stores/app-store'
import { Button } from '../ui/Button'

export function UpdateBanner() {
  const updateStatus = useAppStore((s) => s.updateStatus)

  if (updateStatus.state === 'downloading') {
    return (
      <div className="bg-lol-dark border-b border-lol-gold/10 px-4 py-1.5 text-xs text-lol-gold-light/70">
        <div className="flex items-center justify-between mb-1">
          <span>Downloading update…</span>
          <span>{updateStatus.percent}%</span>
        </div>
        <div className="h-0.5 bg-lol-gold/10 rounded">
          <div
            className="h-0.5 bg-lol-blue rounded transition-all"
            style={{ width: `${updateStatus.percent}%` }}
          />
        </div>
      </div>
    )
  }

  if (updateStatus.state === 'ready') {
    return (
      <div className="bg-lol-blue/10 border-b border-lol-blue/40 px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-lol-blue font-semibold">
          Update v{updateStatus.version} ready to install
        </span>
        <Button variant="info" size="sm" onClick={() => window.api.installUpdate()}>
          Restart now
        </Button>
      </div>
    )
  }

  return null
}
