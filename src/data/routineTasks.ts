import type { RoutineTask } from '../types'

/**
 * The daily checklist. Points, core/bonus split and hazard mapping are VIGIL
 * team rules (see Sources). "Log morning vitals" and "Vision self-check" are
 * completed by logging data; the rest are ticked off.
 */
export const ROUTINE_TASKS: RoutineTask[] = [
  { id: 'vitals', label: 'Log morning vitals', detail: 'Done once every daily vital is logged today.', points: 10, core: true, hazard: 'distance-from-earth', derived: true },
  { id: 'exercise', label: 'Exercise session', detail: 'Resistance and aerobic.', points: 15, core: true, hazard: 'gravity-fields', derived: false },
  { id: 'nutrition', label: 'Nutrition and hydration log', detail: 'Record meals and fluids.', points: 5, core: true, hazard: 'hostile-closed-environments', derived: false },
  { id: 'sleep', label: 'Protect sleep window', detail: 'Keep the scheduled sleep period free.', points: 10, core: true, hazard: 'isolation-confinement', derived: false },
  { id: 'checkin', label: 'Mood and cognitive check-in', detail: 'Self-rate mood and run the readiness test.', points: 5, core: true, hazard: 'isolation-confinement', derived: false },
  { id: 'vision', label: 'Vision self-check', detail: 'Any change in near or distance vision?', points: 5, core: true, hazard: 'gravity-fields', derived: true },
  { id: 'connection', label: 'Crew connection', detail: 'Shared meal or contact with home.', points: 5, core: false, hazard: 'isolation-confinement', derived: false },
]

/** Vitals that must all be logged on a day for "Log morning vitals" to count as done. */
export const MORNING_VITALS = [
  'heartRate',
  'bloodPressure',
  'hrv',
  'coreTemperature',
  'bloodGlucose',
  'sleepHours',
  'mood',
  'cognitiveReadiness',
  'spo2',
] as const
