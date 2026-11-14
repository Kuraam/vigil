import type { ProtocolDef, ProtocolId, ProtocolPhase, ProtocolRun } from '../types'

/** Pure helpers: every change returns a new run, which the store saves. */

export function startRun(protocolId: ProtocolId, crewId: string, alertKey: string, at: string): ProtocolRun {
  return { id: `${crewId}-${protocolId}-${Date.parse(at).toString(36)}`, protocolId, crewId, alertKey, startedAt: at, steps: {}, answers: {}, measurements: [] }
}

/** The latest unfinished run of this protocol for this crew member, if any. */
export function findResumable(runs: ProtocolRun[], crewId: string, protocolId: ProtocolId): ProtocolRun | undefined {
  return runs
    .filter((r) => r.crewId === crewId && r.protocolId === protocolId && !r.completedAt)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0]
}

export function toggleStep(run: ProtocolRun, stepId: string, at: string | null): ProtocolRun {
  const steps = { ...run.steps }
  if (at) steps[stepId] = at
  else delete steps[stepId]
  return { ...run, steps }
}

export function answer(run: ProtocolRun, symptomId: string, yes: boolean, at: string): ProtocolRun {
  return { ...run, answers: { ...run.answers, [symptomId]: { yes, at } } }
}

export function addMeasurement(run: ProtocolRun, readingId: string, label: string, at: string): ProtocolRun {
  return { ...run, measurements: [...run.measurements, { readingId, label, at }] }
}

export const completeRun = (run: ProtocolRun, at: string): ProtocolRun => ({ ...run, completedAt: at })

/** Any red-flag symptom answered "yes". */
export function redFlagRaised(run: ProtocolRun, def: ProtocolDef): boolean {
  return def.symptoms.some((s) => s.redFlag && run.answers[s.id]?.yes)
}

export function phaseDone(run: ProtocolRun, def: ProtocolDef, phase: ProtocolPhase): boolean {
  if (phase === 'assess') return def.symptoms.every((s) => run.answers[s.id])
  return def.steps.filter((s) => s.phase === phase).every((s) => run.steps[s.id])
}

export function progress(run: ProtocolRun, def: ProtocolDef): { done: number; total: number } {
  const total = def.steps.length + def.symptoms.length
  const done = def.steps.filter((s) => run.steps[s.id]).length + def.symptoms.filter((s) => run.answers[s.id]).length
  return { done, total }
}

/** Chronological log of everything recorded in a run, for the Downlink brief. */
export function runTimeline(run: ProtocolRun, def: ProtocolDef): { at: string; text: string }[] {
  const items: { at: string; text: string }[] = [{ at: run.startedAt, text: `Started: ${def.title}` }]
  for (const s of def.steps) if (run.steps[s.id]) items.push({ at: run.steps[s.id], text: s.text })
  for (const s of def.symptoms) {
    const a = run.answers[s.id]
    if (a) items.push({ at: a.at, text: `${s.redFlag ? 'Red flag' : 'Symptom'} "${s.text}": ${a.yes ? 'YES' : 'no'}` })
  }
  for (const m of run.measurements) items.push({ at: m.at, text: `Re-measured: ${m.label}` })
  if (run.completedAt) items.push({ at: run.completedAt, text: 'Marked complete' })
  return items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
}
