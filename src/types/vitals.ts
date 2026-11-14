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
  | 'imagingLog'

/** Vitals that carry a single number. */
export type ScalarVitalType = Exclude<VitalType, 'bloodPressure' | 'imagingLog'>

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
  /** Every reading in this build is generated. Kept explicit so it can never be mistaken for real data. */
  simulated: true
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

export type ImagingModality = 'ultrasound' | 'fundus-photo' | 'optical-coherence' | 'photo'

export interface ImagingReading extends ReadingBase {
  kind: 'imaging'
  vital: 'imagingLog'
  zone: BodyZone
  modality: ImagingModality
  note: string
}

export type VitalReading = ScalarReading | PressureReading | ImagingReading
