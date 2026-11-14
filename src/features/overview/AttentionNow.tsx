import { OctagonAlert, Play } from 'lucide-react'
import { useNavigate } from 'react-router'
import { PROTOCOLS } from '../../data/protocols'
import { useVigilStore } from '../../lib/store'
import { useCrewAttention } from '../../lib/useCrewHealth'
import { useOpenProtocol } from '../triage/useOpenProtocol'

/**
 * Shown under the Overview header when the selected crew member has an Action alert:
 * the reading, the threshold it crossed (with its source) and one primary button that
 * opens the matching protocol in Triage.
 */
export function AttentionNow() {
  const crewId = useVigilStore((s) => s.crewId)
  const { list } = useCrewAttention()
  const open = useOpenProtocol()
  const navigate = useNavigate()
  const a = list.find((c) => c.crewId === crewId)?.top
  if (!a || a.result.status !== 'action') return null

  const start = () => {
    const id = open(a)
    navigate(id ? `/triage?run=${id}` : '/triage')
  }

  return (
    <section
      aria-labelledby="attention-heading"
      data-testid="attention-now"
      className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-action/50 bg-action/10 py-3 pr-3 pl-4 shadow-[inset_4px_0_0_var(--color-action)] sm:pl-5"
    >
      <OctagonAlert aria-hidden className="hidden size-6 shrink-0 text-action sm:block" strokeWidth={2.25} />
      <div className="min-w-0 flex-1 basis-60">
        <h2 id="attention-heading" className="text-sm font-semibold text-action">
          Attention now
        </h2>
        <p className="text-fg">
          <span className="font-medium">{a.label}</span> <span className="readout text-lg font-medium">{a.value}</span>
          <span className="text-fg-muted">. Threshold: {a.result.detail}.</span>
        </p>
        <p className="text-xs text-fg-faint">Source: {a.crossedSources.join('; ')}</p>
      </div>
      {a.protocolId && (
        <button
          type="button"
          onClick={start}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-4 sm:w-auto font-medium text-accent-ink hover:opacity-90"
        >
          <Play aria-hidden className="size-4" />
          Start protocol
          <span className="sr-only">: {PROTOCOLS[a.protocolId].title}</span>
        </button>
      )}
    </section>
  )
}
