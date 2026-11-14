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
 * Chip text. A grey chip distinguishes "nothing measured" from
 * "measured but not rated yet", so a value next to it never looks contradicted.
 */
export function chipLabel({ status, reason }: StatusResult): string {
  if (status === 'nodata') return reason === 'threshold-pending' ? 'Not assessed' : 'No data'
  return { nominal: 'Nominal', watch: 'Watch', action: 'Action' }[status]
}
