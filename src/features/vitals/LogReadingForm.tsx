import { useId, useState, type FormEvent } from 'react'
import { makeLoggedReading, missionNowMs } from '../../lib/missionTime'
import { latestMissionDay } from '../../lib/readings'
import { useVigilStore } from '../../lib/store'
import { ENTRY_LIMITS, validateEntry } from '../../lib/validation'
import type { RatedVitalType } from '../../types'

interface Field {
  name: string
  label: string
  unit: string
  limitKey: keyof typeof ENTRY_LIMITS
  decimal: boolean
}

function fieldsFor(vital: RatedVitalType, unit: string): Field[] {
  if (vital === 'bloodPressure')
    return [
      { name: 'systolic', label: 'Systolic', unit: 'mmHg', limitKey: 'systolic', decimal: false },
      { name: 'diastolic', label: 'Diastolic', unit: 'mmHg', limitKey: 'diastolic', decimal: false },
    ]
  return [{ name: 'value', label: 'Value', unit, limitKey: vital, decimal: !ENTRY_LIMITS[vital].integer }]
}

/** Keyboard-first form to log one reading. Saves to the store, so every page updates at once. */
export function LogReadingForm({ vital, label, unit }: { vital: RatedVitalType; label: string; unit: string }) {
  const crewId = useVigilStore((s) => s.crewId)
  const readings = useVigilStore((s) => s.readings)
  const addReading = useVigilStore((s) => s.addReading)
  const fields = fieldsFor(vital, unit)
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState('')
  const formId = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const result = validateEntry(vital, values)
    if (!result.ok) {
      setErrors(result.errors)
      setSaved('')
      // Move focus to the first invalid field so the error is heard and seen.
      const first = fields.find((f) => result.errors[f.name])
      if (first) document.getElementById(`${formId}-${first.name}`)?.focus()
      return
    }
    const reading = makeLoggedReading(crewId, vital, result.values, missionNowMs(latestMissionDay(readings)))
    addReading(reading)
    setErrors({})
    setValues({})
    const shown = vital === 'bloodPressure' ? `${result.values.systolic}/${result.values.diastolic}` : String(result.values.value)
    setSaved(`Saved: ${label} ${shown} ${unit} on mission day ${reading.missionDay}.`)
  }

  return (
    <form onSubmit={submit} noValidate aria-label={`Log ${label}`} className="rounded-md border border-line bg-bg/60 p-3">
      <div className="flex flex-wrap items-start gap-3">
        {fields.map((f) => {
          const id = `${formId}-${f.name}`
          const err = errors[f.name]
          const { min, max } = ENTRY_LIMITS[f.limitKey]
          return (
            <div key={f.name} className="min-w-32 flex-1">
              <label htmlFor={id} className="field-label block">
                {f.label} ({f.unit})
              </label>
              <input
                id={id}
                name={f.name}
                inputMode={f.decimal ? 'decimal' : 'numeric'}
                autoComplete="off"
                value={values[f.name] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                aria-invalid={err ? true : undefined}
                aria-describedby={`${id}-hint${err ? ` ${id}-err` : ''}`}
                className={`readout mt-0.5 h-11 w-full rounded-md border bg-raised px-3 text-base text-fg ${err ? 'border-action' : 'border-line-strong'}`}
              />
              <p id={`${id}-hint`} className="mt-0.5 text-xs text-fg-faint">
                Accepted {min}-{max}
              </p>
              {err && (
                <p id={`${id}-err`} className="mt-0.5 text-sm text-action">
                  {err}
                </p>
              )}
            </div>
          )
        })}
        <button
          type="submit"
          className="mt-[1.125rem] h-11 cursor-pointer rounded-md bg-accent px-4 font-medium text-accent-ink transition-opacity hover:opacity-90"
        >
          Save reading
        </button>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-fg-muted">
        {saved}
      </p>
    </form>
  )
}
