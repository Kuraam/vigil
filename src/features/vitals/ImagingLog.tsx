import { useId, useState, type FormEvent } from 'react'
import { Disclosure } from '../../components/Disclosure'
import { StatusChip } from '../../components/StatusChip'
import { BODY_ZONE_LABEL, type ImagingModality, type ImagingReading, type VitalReading } from '../../types'
import { MODALITY_LABEL, MODALITY_ZONE, timeOf } from '../../lib/format'
import { makeLoggedImaging, missionNowMs } from '../../lib/missionTime'
import { latestMissionDay } from '../../lib/readings'
import { useVigilStore } from '../../lib/store'

/** Imaging entries for the selected crew member, newest first. Logged, never rated. */
export function ImagingLog({ history }: { history: VitalReading[] }) {
  const crewId = useVigilStore((s) => s.crewId)
  const readings = useVigilStore((s) => s.readings)
  const addReading = useVigilStore((s) => s.addReading)
  const [modality, setModality] = useState<ImagingModality>('ocular-ultrasound')
  const [finding, setFinding] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const id = useId()
  const entries = history.filter((r): r is ImagingReading => r.kind === 'imaging').reverse()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = finding.trim()
    if (text.length < 3) {
      setError('Describe the finding in a few words, even "no change seen".')
      setSaved('')
      document.getElementById(`${id}-finding`)?.focus()
      return
    }
    const entry = makeLoggedImaging(crewId, modality, MODALITY_ZONE[modality], text, missionNowMs(latestMissionDay(readings)))
    addReading(entry)
    setError('')
    setFinding('')
    setSaved(`Saved: ${MODALITY_LABEL[modality]} on mission day ${entry.missionDay}.`)
  }

  return (
    <section aria-labelledby="imaging-heading" className="rounded-lg border border-line bg-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div>
          <h2 id="imaging-heading" className="text-base font-semibold text-fg">
            Imaging log
          </h2>
          <p className="text-sm text-fg-muted">Crew-performed scans. Logged for review, never rated by VIGIL.</p>
        </div>
        <StatusChip result={{ status: 'nodata', reason: 'logged', detail: 'Imaging is logged, not rated.' }} />
      </div>

      <ul className="mt-3 divide-y divide-line border-t border-line">
        {entries.length === 0 && <li className="px-4 py-3 text-fg-muted sm:px-5">No scans logged yet.</li>}
        {entries.map((r) => (
          <li key={r.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_12rem_1fr] sm:gap-4 sm:px-5">
            <span className="readout text-sm text-fg-muted">
              Day {r.missionDay}, {timeOf(r.timestamp)}
            </span>
            <span className="text-fg">
              {MODALITY_LABEL[r.modality]}
              <span className="block text-xs text-fg-faint">{BODY_ZONE_LABEL[r.zone]}</span>
            </span>
            <span className="text-sm text-fg-muted">
              {r.finding}
              {!r.simulated && <span className="text-fg-faint"> (logged)</span>}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t border-line px-4 py-3 sm:px-5">
        <Disclosure label="Log imaging entry" icon={false}>
          <form onSubmit={submit} noValidate aria-label="Log imaging entry" className="space-y-3 rounded-md border border-line bg-bg/60 p-3">
            <div>
              <label htmlFor={`${id}-type`} className="field-label block">
                Scan type
              </label>
              <select
                id={`${id}-type`}
                value={modality}
                onChange={(e) => setModality(e.target.value as ImagingModality)}
                className="mt-0.5 h-11 w-full max-w-xs cursor-pointer rounded-md border border-line-strong bg-raised px-3 text-fg"
              >
                {(Object.keys(MODALITY_LABEL) as ImagingModality[]).map((m) => (
                  <option key={m} value={m}>
                    {MODALITY_LABEL[m]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-finding`} className="field-label block">
                Finding (free text)
              </label>
              <textarea
                id={`${id}-finding`}
                value={finding}
                onChange={(e) => setFinding(e.target.value)}
                rows={2}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-err` : undefined}
                className={`mt-0.5 w-full rounded-md border bg-raised px-3 py-2 text-fg ${error ? 'border-action' : 'border-line-strong'}`}
              />
              {error && (
                <p id={`${id}-err`} className="mt-0.5 text-sm text-action">
                  {error}
                </p>
              )}
            </div>
            <button type="submit" className="h-11 cursor-pointer rounded-md bg-accent px-4 font-medium text-accent-ink hover:opacity-90">
              Save entry
            </button>
            <p role="status" className="min-h-5 text-sm text-fg-muted">
              {saved}
            </p>
          </form>
        </Disclosure>
      </div>
    </section>
  )
}
