interface TabItem<T extends string> {
  value: T
  label: string
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[]
  active: T
  onChange: (value: T) => void
}

export function Tabs<T extends string>({ items, active, onChange }: TabsProps<T>) {
  return (
    <div className="flex gap-2">
      {items.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${
            value === active
              ? 'bg-lol-gold text-lol-dark font-semibold'
              : 'bg-white/10 hover:bg-white/20 text-gray-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
