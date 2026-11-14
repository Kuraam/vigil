import type { VitalMeta, VitalType } from '../types'

/** Display metadata for each vital, in the order they appear on the Overview. */
export const VITALS: VitalMeta[] = [
  { type: 'heartRate', label: 'Heart rate', unit: 'bpm', method: 'Resting, wearable, on waking' },
  { type: 'bloodPressure', label: 'Blood pressure', unit: 'mmHg', method: 'Seated cuff, on waking' },
  { type: 'hrv', label: 'Heart rate variability', unit: 'ms', method: 'RMSSD, overnight wearable' },
  { type: 'coreTemperature', label: 'Core temperature', unit: '°C', method: 'Wearable core sensor' },
  { type: 'bloodGlucose', label: 'Blood glucose', unit: 'mg/dL', method: 'Fasting fingerstick' },
  { type: 'sleepHours', label: 'Sleep', unit: 'h', method: 'Wearable sleep duration' },
  { type: 'mood', label: 'Mood', unit: '/ 5', method: 'Daily self-report' },
  { type: 'cognitiveReadiness', label: 'Cognitive readiness', unit: '/ 100', method: 'Daily reaction-time battery' },
  { type: 'imagingLog', label: 'Imaging log', unit: '', method: 'Crew-performed scans' },
]

export const VITAL_META = Object.fromEntries(VITALS.map((v) => [v.type, v])) as Record<VitalType, VitalMeta>
