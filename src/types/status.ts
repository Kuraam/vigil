/**
 * Status vocabulary shared by every assessment in VIGIL.
 * `nodata` covers both "no reading" and "no sourced threshold yet": in both
 * cases VIGIL cannot make a claim, so it says so instead of guessing.
 */
export type Status = 'nominal' | 'watch' | 'action' | 'nodata'

/** Why a status was assigned. Shown to the crew so a grey chip is never mysterious. */
export type StatusReason =
  | 'no-reading'
  | 'threshold-pending'
  | 'in-range'
  | 'watch-range'
  | 'action-range'

export interface StatusResult {
  status: Status
  reason: StatusReason
}
