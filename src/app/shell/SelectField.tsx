import { ChevronDown } from 'lucide-react'
import { useId } from 'react'

interface Option {
  value: string
  label: string
}

/** Native select (full keyboard + screen reader support for free) with a visible label. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  hint?: string
}) {
  const id = useId()
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="field-label block">
        {label}
      </label>
      <div className="relative mt-0.5">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full min-w-48 cursor-pointer appearance-none rounded-md border border-line-strong bg-raised pr-9 pl-3 text-base text-fg transition-colors hover:border-fg-faint"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-muted" />
      </div>
      {hint && <p className="mt-0.5 text-xs text-fg-faint">{hint}</p>}
    </div>
  )
}
