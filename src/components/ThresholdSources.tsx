import { THRESHOLDS } from '../data/thresholds'
import type { ThresholdValue, VitalType } from '../types'

/** "nominalSystolicBelow" -> "Nominal systolic below". */
function humanize(key: string): string {
  const words = key.replace(/([A-Z])/g, ' $1').toLowerCase().trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function formatValue(t: ThresholdValue): string {
  const n = t.value < 1 && t.value > 0 ? `${Math.round(t.value * 100)}%` : String(t.value)
  return t.value < 1 && t.value > 0 ? `${n} ${t.unit.replace(/^of /, 'of ')}` : `${n} ${t.unit}`
}

/** Every threshold value for one vital with its exact source string. */
export function ThresholdSources({ vital }: { vital: Exclude<VitalType, 'imagingLog'> }) {
  const entries = Object.entries(THRESHOLDS[vital]).filter(
    (e): e is [string, ThresholdValue] => typeof e[1] === 'object' && e[1] !== null && 'source' in e[1],
  )
  return (
    <dl className="space-y-2 rounded-md border border-line bg-bg/60 p-3 text-sm">
      {entries.map(([key, t]) => (
        <div key={key}>
          <dt className="text-fg">
            {humanize(key)}: <span className="readout">{formatValue(t)}</span>
          </dt>
          <dd className="text-fg-muted">{t.source}</dd>
        </div>
      ))}
    </dl>
  )
}
