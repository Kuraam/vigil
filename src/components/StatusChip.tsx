import type { StatusResult } from '../types'
import { chipLabel, STATUS_STYLE } from './statusStyle'

/** Status is always icon + label + colour; never colour alone. */
export function StatusChip({ result, className = '', title }: { result: StatusResult; className?: string; title?: string }) {
  const { icon: Icon, text, chip } = STATUS_STYLE[result.status]
  return (
    <span
      title={title}
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2 text-sm font-medium ${text} ${chip} ${className}`}
    >
      <Icon aria-hidden className="size-4" strokeWidth={2.25} />
      {chipLabel(result)}
    </span>
  )
}
