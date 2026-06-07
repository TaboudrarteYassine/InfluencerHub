export default function ToggleSwitch({ checked, onChange, disabled, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0 flex-1">
        {label && (
          <p className="text-sm font-medium text-white">{label}</p>
        )}
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 
          focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]
          ${checked ? 'bg-violet-600' : 'bg-[#2a2a2a]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  )
}
