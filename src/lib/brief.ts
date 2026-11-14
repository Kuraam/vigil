import { getEnvironment } from '../data/environments'
import { PROTOCOLS } from '../data/protocols'
import { RADIATION_LIMITS } from '../data/radiation'
import { VITAL_META } from '../data/vitals'
import type { EnvironmentId, ProtocolRun, Status, VitalReading } from '../types'
import type { Alert } from './alerts'
import { sortAlerts } from './alerts'
import { escalationFor } from './escalation'
import { formatReading } from './format'
import type { CrewHealth } from './health'
import { missionLabel } from './missionTime'
import { runTimeline } from './protocolRun'
import { trendValue } from './readings'
import { adherence7, personalStreak, type RoutineContext } from './routine'

export interface BriefInput {
  healths: CrewHealth[]
  alerts: Alert[]
  runs: ProtocolRun[]
  environmentId: EnvironmentId
  missionDay: number
  routine: RoutineContext
  questions: string
  generatedAt: string
}

const TAG: Record<Status, string> = { action: 'ACTION', watch: 'WATCH', nominal: 'NOMINAL', nodata: 'NO DATA' }
const r1 = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** Min / mean / max of the readings from the last 7 mission days. */
export function trend7(history: VitalReading[], today: number, pick: (r: VitalReading) => number | null = trendValue) {
  const vals = history.filter((r) => r.missionDay > today - 7 && r.missionDay <= today).map(pick).filter((v): v is number => v !== null)
  if (vals.length === 0) return null
  return { min: Math.min(...vals), mean: vals.reduce((a, b) => a + b, 0) / vals.length, max: Math.max(...vals), n: vals.length }
}

export function briefSizeKb(text: string): number {
  return new TextEncoder().encode(text).length / 1024
}

function crewSection(h: CrewHealth, alerts: Alert[], runs: ProtocolRun[], day: number, routine: RoutineContext): string[] {
  const c = h.crew
  const out: string[] = [`== ${c?.name ?? h.crewId} (${c?.callSign}), ${c?.role} ==`, '', 'CURRENT STATUS']
  const order: Status[] = ['action', 'watch', 'nominal', 'nodata']
  for (const st of order)
    for (const row of h.rows.filter((r) => r.result.status === st && r.meta.type !== 'imagingLog')) {
      const shown = row.latest ? formatReading(row.latest) : null
      out.push(`  ${TAG[st].padEnd(8)}${row.meta.label} ${shown ? `${shown.value} ${shown.unit}`.trim() : ''}${st === 'nominal' ? '' : `: ${row.result.detail}`}`)
    }
  out.push(`  ${TAG[h.dose.status.status].padEnd(8)}Radiation dose ${h.dose.cumulative.toFixed(1)} mSv`)
  out.push(`  ${TAG[h.exercise.result.status].padEnd(8)}Exercise adherence ${h.exercise.sessions}/7 days`)

  const mine = sortAlerts(alerts.filter((a) => a.crewId === h.crewId))
  out.push('', `ACTIVE ALERTS (${mine.length})`)
  if (mine.length === 0) out.push('  None')
  mine.forEach((a, i) => {
    out.push(`  ${i + 1}. [${TAG[a.result.status]}] ${a.label} ${a.value}. Threshold: ${a.result.detail}`)
    out.push(`     Source: ${a.sources.join('; ')}`)
  })

  const myRuns = runs.filter((r) => r.crewId === h.crewId).sort((a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt))
  out.push('', `PROTOCOL STEPS TAKEN (${myRuns.length} protocol${myRuns.length === 1 ? '' : 's'})`)
  if (myRuns.length === 0) out.push('  None')
  for (const run of myRuns) {
    const def = PROTOCOLS[run.protocolId]
    out.push(`  ${def.title}: ${run.completedAt ? `completed ${missionLabel(run.completedAt)}` : 'in progress'}`)
    const items = runTimeline(run, def)
    for (const it of items) out.push(`    ${missionLabel(it.at)}  ${it.text}`)
  }

  out.push('', '7-DAY TRENDS (min / mean / max)')
  for (const row of h.rows) {
    const t = row.meta.type
    if (t === 'imagingLog' || t === 'visionCheck') continue
    if (t === 'bloodPressure') {
      const s = trend7(row.history, day, (r) => (r.kind === 'pressure' ? r.systolic : null))
      const d = trend7(row.history, day, (r) => (r.kind === 'pressure' ? r.diastolic : null))
      if (s && d) out.push(`  Blood pressure (mmHg): systolic ${s.min} / ${r1(s.mean)} / ${s.max}, diastolic ${d.min} / ${r1(d.mean)} / ${d.max}`)
      continue
    }
    const tr = trend7(row.history, day)
    if (tr) out.push(`  ${VITAL_META[t].label} (${VITAL_META[t].unit.replace('/ ', 'of ')}): ${r1(tr.min)} / ${r1(tr.mean)} / ${r1(tr.max)}`)
  }
  const visionChanges = row7Count(h, day)
  out.push(`  Vision self-check: ${visionChanges} change${visionChanges === 1 ? '' : 's'} reported`)

  const limit = RADIATION_LIMITS.career.value
  out.push(
    '',
    'RADIATION',
    `  ${h.dose.cumulative.toFixed(1)} mSv of ${limit} mSv career limit (${Math.round(h.dose.fraction * 100)}%). Rate today ${h.dose.rateToday} mSv/day; ${Math.floor(h.dose.daysRemaining)} days to the limit at this rate.`,
  )
  const bar = adherence7(h.crewId, day, routine)
  const done = bar.reduce((a, d) => a + d.done, 0)
  const total = bar.reduce((a, d) => a + d.total, 0)
  out.push(
    '',
    'ROUTINE ADHERENCE (last 7 days)',
    `  Core tasks: ${done}/${total} (${Math.round((done / total) * 100)}%). Exercise: ${h.exercise.sessions}/7 days (${h.exercise.result.status}). Personal streak: ${personalStreak(h.crewId, day, routine)} days.`,
  )
  return out
}

function row7Count(h: CrewHealth, day: number): number {
  return h.byVital.visionCheck.history.filter((r) => r.missionDay > day - 7 && r.kind === 'scalar' && r.value === 1).length
}

/** Compact plain-text brief for the next downlink. */
export function buildBrief(input: BriefInput): string {
  const env = getEnvironment(input.environmentId)
  const esc = escalationFor(input.environmentId)
  const lines: string[] = [
    'VIGIL DOWNLINK BRIEF',
    'Simulated data. Concept demonstration.',
    `Generated: ${missionLabel(input.generatedAt)} (mission time)`,
    `Mission day ${input.missionDay}`,
    `Environment: ${env.name} (${env.context})`,
    `One-way delay: ${env.commDelay.label}. Earth reply ETA: ${esc.replyEta}.`,
    `Escalation: ${esc.modeLabel}`,
    `Scope: ${input.healths.map((h) => h.crew?.name ?? h.crewId).join(', ')}`,
    '',
  ]
  for (const h of input.healths) lines.push(...crewSection(h, input.alerts, input.runs, input.missionDay, input.routine), '')
  lines.push('QUESTIONS FOR THE FLIGHT SURGEON', ...(input.questions.trim() ? input.questions.trim().split('\n').map((l) => `  ${l}`) : ['  None']), '', '-- end of brief --')
  return lines.join('\n')
}
