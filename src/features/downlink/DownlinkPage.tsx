import { Check, Copy, Printer, SatelliteDish } from 'lucide-react'
import { useId, useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { SimulatedTag } from '../../components/SimulatedTag'
import { getEnvironment } from '../../data/environments'
import { buildAlerts } from '../../lib/alerts'
import { briefContents, briefSizeKb, buildBrief } from '../../lib/brief'
import { escalationFor } from '../../lib/escalation'
import { missionNowMs } from '../../lib/missionTime'
import { useVigilStore } from '../../lib/store'
import { useMissionHealth } from '../../lib/useCrewHealth'

const segBtn = (on: boolean) => `h-11 cursor-pointer px-4 text-sm ${on ? 'bg-raised text-fg' : 'text-fg-muted hover:text-fg'}`

export function DownlinkPage() {
  const { all, selected, environmentId, missionDay, routine } = useMissionHealth()
  const runs = useVigilStore((s) => s.runs)
  const speWarning = useVigilStore((s) => s.speWarning)
  const questions = useVigilStore((s) => s.briefQuestions)
  const setQuestions = useVigilStore((s) => s.setBriefQuestions)
  const [scope, setScope] = useState<'crew' | 'all'>('crew')
  const [brief, setBrief] = useState('')
  const [copied, setCopied] = useState('')
  const qid = useId()
  const env = getEnvironment(environmentId)

  const scoped = scope === 'all' ? Object.values(all) : [selected]
  const nowIso = new Date(missionNowMs(missionDay)).toISOString()
  const preview = briefContents(
    scoped,
    scoped.flatMap((h) => buildAlerts(h, { speWarning, now: nowIso })),
    runs,
    missionDay,
  )

  const build = () => {
    const healths = scope === 'all' ? Object.values(all) : [selected]
    const now = new Date(missionNowMs(missionDay)).toISOString()
    setBrief(
      buildBrief({
        healths,
        alerts: healths.flatMap((h) => buildAlerts(h, { speWarning, now })),
        runs,
        environmentId,
        missionDay,
        routine,
        questions,
        generatedAt: now,
      }),
    )
    setCopied('')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brief)
      setCopied('Brief copied to the clipboard.')
    } catch {
      setCopied('Copy was blocked by the browser. Select the text and copy it manually.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Downlink"
        description="Build a compact plain-text health brief for the next communication window to Earth."
        aside={<SimulatedTag>Simulated data. Concept demonstration.</SimulatedTag>}
      />

      <section aria-labelledby="build-heading" data-tour="downlink-build" className="space-y-4 rounded-lg border border-line bg-panel p-4 print:hidden sm:p-5">
        <h2 id="build-heading" className="text-base font-semibold text-fg">
          Build brief
        </h2>
        <div role="group" aria-label="Brief scope" className="inline-flex overflow-hidden rounded-md border border-line-strong">
          <button type="button" aria-pressed={scope === 'crew'} onClick={() => setScope('crew')} className={segBtn(scope === 'crew')}>
            {selected.crew?.name ?? 'Selected crew member'}
          </button>
          <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')} className={`${segBtn(scope === 'all')} border-l border-line-strong`}>
            Whole crew
          </button>
        </div>
        <div>
          <label htmlFor={qid} className="field-label block">
            Open questions for the flight surgeon (free text)
          </label>
          <textarea
            id={qid}
            rows={3}
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            className="mt-0.5 w-full max-w-3xl rounded-md border border-line-strong bg-raised px-3 py-2 text-fg"
          />
        </div>
        <button type="button" onClick={build} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-accent px-4 font-medium text-accent-ink hover:opacity-90">
          <SatelliteDish aria-hidden className="size-4" />
          Build brief
        </button>
      </section>

      {!brief && (
        <section aria-labelledby="includes-heading" data-testid="brief-preview" className="rounded-lg border border-line bg-panel p-4 sm:p-5">
          <h2 id="includes-heading" className="text-base font-semibold text-fg">
            What this brief will include
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              `Current status of every vital for ${scope === 'all' ? `all ${preview.crew} crew members` : (selected.crew?.name ?? 'the selected crew member')}`,
              `${preview.action} Action alert${preview.action === 1 ? '' : 's'}, ${preview.watch} Watch, each with its threshold and source`,
              `${preview.runs} protocol run${preview.runs === 1 ? '' : 's'} with timestamped steps`,
              `7-day trends for ${preview.trends} vitals`,
              'Radiation dose and routine adherence',
              questions.trim() ? 'Your open questions for the flight surgeon' : 'Open questions for the flight surgeon (none written yet)',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-fg">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.5} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-sm text-fg-muted" data-testid="brief-eta">
            Arrives at Earth in approximately <span className="readout text-fg">{env.commDelay.label.toLowerCase()}</span> from {env.name}. Earth&apos;s reply
            takes <span className="readout text-fg">{escalationFor(environmentId).replyEta}</span> for the round trip.
          </p>
        </section>
      )}

      {brief && (
        <section aria-labelledby="brief-heading" className="rounded-lg border border-line bg-panel print:border-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 print:hidden sm:px-5">
            <div>
              <h2 id="brief-heading" className="text-base font-semibold text-fg">
                Brief ready
              </h2>
              <p className="text-sm text-fg-muted" data-testid="brief-meta">
                <span className="readout text-fg">{briefSizeKb(brief).toFixed(1)} KB</span> plain text. Arrives at Earth in approximately{' '}
                <span className="readout text-fg">{env.commDelay.label.toLowerCase()}</span> from {env.name}.
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={copy} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-3 text-sm text-fg hover:border-fg-faint">
                <Copy aria-hidden className="size-4" /> Copy
              </button>
              <button type="button" onClick={() => window.print()} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong px-3 text-sm text-fg hover:border-fg-faint">
                <Printer aria-hidden className="size-4" /> Print or save as PDF
              </button>
            </div>
          </div>
          <p role="status" className="min-h-5 px-4 text-sm text-fg-muted print:hidden sm:px-5">
            {copied}
          </p>
          <pre data-testid="brief-text" tabIndex={0} aria-label="Downlink brief text" className="readout m-4 mt-2 max-h-[36rem] overflow-auto rounded-md border border-line bg-bg p-4 text-[13px] leading-relaxed whitespace-pre-wrap text-fg print:m-0 print:max-h-none print:overflow-visible print:border-0 print:bg-paper print:p-0 print:text-ink sm:m-5 sm:mt-2">
            {brief}
          </pre>
        </section>
      )}
    </div>
  )
}
