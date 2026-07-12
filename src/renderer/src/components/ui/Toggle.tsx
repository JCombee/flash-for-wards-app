interface ToggleProps {
  checked: boolean
  onChange: () => void
  label: string
  hint?: string
}

export function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`w-10 h-6 shrink-0 rounded-full transition-colors relative ${checked ? 'bg-lol-blue' : 'bg-gray-600'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-5' : 'left-1'}`}
        />
      </button>
      <div>
        <p className="text-sm text-gray-200">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </label>
  )
}
