import { getEnvironment } from '../data/environments'
import type { EnvironmentId } from '../types'
import { formatDelay } from './format'

export type EscalationMode = 'ground' | 'autonomous'

export interface Escalation {
  mode: EscalationMode
  modeLabel: 'Ground-guided' | 'Crew-autonomous'
  /** Earth reply ETA: the round trip, 2 × one-way delay. */
  replyEta: string
  lines: string[]
}

export const GROUND_LINE = 'Ground-guided: consult the flight surgeon now and follow their direction.'
export const AUTONOMOUS_LINE =
  'Crew-autonomous first: complete steps 1-3 now; do not wait for Earth. Downlink the brief, then follow ground direction when it arrives.'
export const NOTIFY_LINE = 'Notify commander and crew medical officer immediately.'

/** Team rule: ground-guided only when Earth is under a second away. */
export function escalationMode(env: EnvironmentId): EscalationMode {
  return getEnvironment(env).commDelay.maxSeconds < 1 ? 'ground' : 'autonomous'
}

export function replyEta(env: EnvironmentId): string {
  const { minSeconds, maxSeconds } = getEnvironment(env).commDelay
  if (maxSeconds < 1) return 'Under 2 s'
  if (minSeconds === 0) return `Up to ${formatDelay(2 * maxSeconds)}`
  return `${formatDelay(2 * minSeconds)} to ${formatDelay(2 * maxSeconds)}`
}

/** The comm-delay escalation rule shown on every protocol (team rule). */
export function escalationFor(env: EnvironmentId, opts: { redFlag?: boolean; action?: boolean } = {}): Escalation {
  const mode = escalationMode(env)
  const lines = [mode === 'ground' ? GROUND_LINE : AUTONOMOUS_LINE]
  if (opts.redFlag || opts.action) lines.push(NOTIFY_LINE)
  return { mode, modeLabel: mode === 'ground' ? 'Ground-guided' : 'Crew-autonomous', replyEta: replyEta(env), lines }
}
