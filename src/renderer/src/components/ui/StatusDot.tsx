import type { LcuConnectionStatus } from '../../types'

const COLORS: Record<LcuConnectionStatus, string> = {
  connected: 'bg-green-400',
  connecting: 'bg-yellow-400 animate-pulse',
  disconnected: 'bg-gray-500'
}

export function StatusDot({ status }: { status: LcuConnectionStatus }) {
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${COLORS[status]}`} />
}
