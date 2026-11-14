import { RadioTower } from 'lucide-react'
import { ENVIRONMENTS } from '../../data/environments'
import { formatDelay } from '../../lib/format'
import type { Environment } from '../../types'

/** Scale end: the worst one-way delay of any environment (Mars at conjunction). */
const SCALE_MAX_S = Math.max(...ENVIRONMENTS.map((e) => e.commDelay.maxSeconds))

/**
 * One-way Earth signal delay for the selected environment, drawn on a shared
 * 0 to 22.3 min scale so the distance from help is visible at a glance.
 */
export function CommDelay({ environment }: { environment: Environment }) {
  const { minSeconds, maxSeconds, source, label: text } = environment.commDelay
  const left = (minSeconds / SCALE_MAX_S) * 100
  // Keep at least a visible sliver for near-zero delays (low Earth orbit).
  const width = Math.max(((maxSeconds - minSeconds) / SCALE_MAX_S) * 100, 1.5)

  return (
    <div className="min-w-40 2xl:min-w-56" title={source}>
      <div className="field-label flex items-center gap-1.5">
        <RadioTower aria-hidden className="size-3.5" />
        Earth signal, one way
      </div>
      <div className="readout text-lg leading-7 font-medium text-fg">{text}</div>
      <div
        role="img"
        aria-label={`One-way delay to Earth ${text}, on a scale of 0 to ${formatDelay(SCALE_MAX_S)}. ${source}`}
        className="relative mt-1 h-1.5 rounded-full bg-line"
      >
        <div className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${left}%`, width: `${width}%` }} />
      </div>
      <div aria-hidden className="readout mt-0.5 flex justify-between text-[11px] text-fg-faint">
        <span>0</span>
        <span>{formatDelay(SCALE_MAX_S)}</span>
      </div>
    </div>
  )
}
