import type { ReactNode } from 'react'

type Variant = 'info' | 'success' | 'danger' | 'warning'

const VARIANTS: Record<Variant, string> = {
  info: 'bg-lol-blue/10 border-lol-blue/40 text-lol-blue',
  success: 'bg-green-900/30 border-green-500/30 text-green-400',
  danger: 'bg-red-900/30 border-red-500/30 text-red-400',
  warning: 'bg-yellow-900/30 border-yellow-500/30 text-yellow-400'
}

/** Inline status banner. Depth comes from the border, per the design system — no shadow. */
export function Notice({ variant, children }: { variant: Variant; children: ReactNode }) {
  return (
    <div className={`px-4 py-2 border rounded text-sm ${VARIANTS[variant]}`}>{children}</div>
  )
}
