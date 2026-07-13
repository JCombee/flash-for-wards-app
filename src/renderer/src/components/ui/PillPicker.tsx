interface PillPickerProps {
  options: readonly string[]
  selected: readonly string[]
  onToggle: (value: string) => void
  /** Rendered label per option; defaults to the raw value. */
  format?: (value: string) => string
}

/** Multi-select row of toggleable pills. Empty selection means "any". */
export function PillPicker({ options, selected, onToggle, format }: PillPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((value) => {
        const active = selected.includes(value)
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors ${
              active
                ? 'bg-lol-gold/15 border-lol-gold text-lol-gold-light'
                : 'bg-black/30 border-lol-gold/20 text-gray-400 hover:border-lol-gold/40 hover:text-gray-200'
            }`}
          >
            {format ? format(value) : value}
          </button>
        )
      })}
    </div>
  )
}
