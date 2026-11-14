import { CircleCheck, CircleDashed, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { Status, StatusResult } from '../types'

interface StatusStyle {
  icon: LucideIcon
  /** Foreground colour from the status palette. */
  text: string
  /** Chip border + tinted fill. */
  chip: string
}

/** The only place status colours are mapped. Each status also gets a distinct icon shape. */
export const STATUS_STYLE: Record<Status, StatusStyle> = {
  nominal: { icon: CircleCheck, text: 'text-nominal', chip: 'border-nominal/40 bg-nominal/10' },
  watch: { icon: TriangleAlert, text: 'text-watch', chip: 'border-watch/40 bg-watch/10' },
  action: { icon: OctagonAlert, text: 'text-action', chip: 'border-action/50 bg-action/12' },
  nodata: { icon: CircleDashed, text: 'text-nodata', chip: 'border-nodata/40 bg-nodata/8' },
}

/**
 * Chip text. Grey chips say why there is no rating: nothing measured, not
 * enough history yet, or an imaging entry (logged, never rated).
 */
export function chipLabel({ status, reason, priority }: StatusResult): string {
  if (status === 'nodata') return { logged: 'Logged', 'insufficient-history': 'Not assessed', 'no-reading': 'No data', rated: 'No data' }[reason]
  if (priority) return 'Action: priority'
  return { nominal: 'Nominal', watch: 'Watch', action: 'Action' }[status]
}
