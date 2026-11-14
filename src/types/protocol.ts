import type { RatedVitalType } from './vitals'

export type ProtocolId =
  | 'fever'
  | 'high-heart-rate'
  | 'high-blood-pressure'
  | 'low-blood-sugar'
  | 'low-spo2'
  | 'sleep-debt'
  | 'low-mood'
  | 'radiation'
  | 'vision-change'
  | 'low-exercise'

export type ProtocolPhase = 'confirm' | 'assess' | 'act' | 'escalate'

export interface ProtocolStep {
  id: string
  phase: Exclude<ProtocolPhase, 'assess'>
  text: string
}

export interface ProtocolSymptom {
  id: string
  text: string
  /** A "yes" to a red flag escalates immediately. */
  redFlag: boolean
}

export interface ProtocolDef {
  id: ProtocolId
  title: string
  /** When the protocol applies, in plain words. */
  trigger: string
  /** Vital re-measured in CONFIRM (entered in the runner); none for radiation. */
  measure?: RatedVitalType[]
  howToMeasure: string[]
  howToSource?: string
  symptoms: ProtocolSymptom[]
  steps: ProtocolStep[]
  /** Extra context lines (e.g. microgravity temperature rise), each with its source. */
  notes: { text: string; source: string }[]
  /** Named NASA HRP risks this protocol relates to. */
  risks: string[]
  /** Vitals to show alongside (e.g. heart rate for fever). */
  related: RatedVitalType[]
}

/** One run of a protocol for one crew member. Saved to the store and resumable. */
export interface ProtocolRun {
  id: string
  protocolId: ProtocolId
  crewId: string
  /** The alert that opened it, e.g. "crew-04:coreTemperature". */
  alertKey: string
  startedAt: string
  /** Step id -> ISO mission time it was checked. */
  steps: Record<string, string>
  /** Symptom id -> answer and time. */
  answers: Record<string, { yes: boolean; at: string }>
  /** Re-measurements entered in CONFIRM. */
  measurements: { readingId: string; label: string; at: string }[]
  completedAt?: string
}
