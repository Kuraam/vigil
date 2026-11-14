import type { BodyZone } from './body'

export type VitalType =
  | 'bloodPressure'
  | 'heartRate'
  | 'hrv'
  | 'bloodGlucose'
  | 'coreTemperature'
  | 'sleepHours'
  | 'mood'
  | 'cognitiveReadiness'
  | 'spo2'
  /** Daily yes/no "Any change in near or distance vision?" stored as 1 (yes) or 0 (no). */
  | 'visionCheck'
  | 'imagingLog'

/** Vitals that carry a single number. */
export type ScalarVitalType = Exclude<VitalType, 'bloodPressure' | 'imagingLog'>

/** Vitals that can be rated against thresholds. */
export type RatedVitalType = Exclude<VitalType, 'imagingLog'>

export interface VitalMeta {
  type: VitalType
  label: string
  /** Display unit; empty for unitless entries (imaging log). */
  unit: string
  /** How the value is obtained, shown as helper text. */
  method: string
}

interface ReadingBase {
  id: string
  crewId: string
  missionDay: number
  /** ISO 8601 timestamp in simulated mission time. */
  timestamp: string
  /** True for generated data, false for readings a person logged in the app. */
  simulated: boolean
}

export interface ScalarReading extends ReadingBase {
  kind: 'scalar'
  vital: ScalarVitalType
  value: number
}

export interface PressureReading extends ReadingBase {
  kind: 'pressure'
  vital: 'bloodPressure'
  systolic: number
  diastolic: number
}

export type ImagingModality = 'ocular-ultrasound' | 'cardiac-ultrasound' | 'bone'

export interface ImagingReading extends ReadingBase {
  kind: 'imaging'
  vital: 'imagingLog'
  modality: ImagingModality
  zone: BodyZone
  /** Free-text finding written by the crew member. Never rated. */
  finding: string
}

export type VitalReading = ScalarReading | PressureReading | ImagingReading
