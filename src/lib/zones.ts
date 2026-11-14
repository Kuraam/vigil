import type { StatusResult } from '../types'
import { worse } from './status'

/**
 * Zone status = the worst status of its linked indicators. Indicators with
 * no data are ignored unless nothing is rated. A zone with nothing rated but
 * with imaging entries reads "Logged" (imaging is never rated); otherwise nodata.
 */
export function rollUpZone(results: StatusResult[], hasImaging = false): StatusResult {
  const rated = results.filter((r) => r.status !== 'nodata')
  if (rated.length > 0) return rated.reduce(worse)
  if (hasImaging) return { status: 'nodata', reason: 'logged', detail: 'Imaging logged for review. Not rated.' }
  return { status: 'nodata', reason: 'no-reading', detail: 'No rated readings linked to this zone.' }
}
