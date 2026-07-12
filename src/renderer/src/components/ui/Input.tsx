import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-black/40 border border-lol-gold/40 focus:border-lol-gold/60 rounded px-3 py-2 text-sm text-white outline-none transition-colors ${className}`}
      {...rest}
    />
  )
}
