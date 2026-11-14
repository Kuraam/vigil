/**
 * SIMULATED DATASET GENERATOR.
 *
 * Produces 30 mission days of readings for the four fictional crew members.
 * Output is fully determined by `seed`, so every run of the app and every
 * test sees the same numbers.
 *
 * Baselines describe typical healthy adults so the demo is believable; they
 * are not thresholds. Two scripted storylines sit on top (see STORYLINES).
 */
import { between, gaussian, mulberry32 } from '../lib/prng'
import type { BodyZone, ImagingModality, RoutineLog, ScalarVitalType, VitalReading } from '../types'
import { CREW } from './crew'
import { PRIOR_DOSE_RANGE } from './radiation'

export const SIM_SEED = 20261004
/** Bump when the generated data changes shape or content, so stale saved data is replaced. */
export const SIM_VERSION = 3
export const SIM_DAYS = 30
/** Fictional mission start. Day 1 begins at this instant. */
export const MISSION_EPOCH = Date.UTC(2031, 2, 1, 0, 0, 0)
export const DAY_MS = 86_400_000

/**
 * Demo storylines (simulated, deterministic):
 *  - crew-03 (Flight Engineer): sleep debt from day 22. Sleep is watch on days
 *    22-26 and becomes action from day 27 (third consecutive night under 6 h).
 *    Heart rate, HRV, mood and cognition drift with it.
 *  - crew-04 (Mission Specialist): core temperature 38.3 °C and resting heart
 *    rate 108 bpm on days 29-30 (used by Phase 3 triage).
 */
export const STORYLINES = {
  sleepDebt: { crewId: 'crew-03', fromDay: 22, sleep: [6.6, 6.4, 6.2, 5.8, 5.6, 5.5, 5.3, 5.2, 5.0] },
  fever: { crewId: 'crew-04', days: [29, 30], coreTemperature: 38.3, heartRate: 108 },
} as const

interface Profile {
  hr: number
  sys: number
  dia: number
  hrv: number
  glucose: number
  temp: number
  sleep: number
  mood: number
  cog: number
}

function makeProfile(rand: () => number): Profile {
  return {
    hr: between(rand, 62, 72),
    sys: between(rand, 104, 114),
    dia: between(rand, 66, 74),
    hrv: between(rand, 42, 68),
    glucose: between(rand, 82, 92),
    temp: between(rand, 36.6, 37.0),
    sleep: between(rand, 7.1, 7.6),
    mood: between(rand, 3.9, 4.4),
    cog: between(rand, 84, 92),
  }
}

/** 0 outside the sleep-debt window, ramping to 1 by day 30. */
function strain(crewId: string, day: number): number {
  const { crewId: who, fromDay } = STORYLINES.sleepDebt
  if (crewId !== who || day < fromDay) return 0
  return (day - fromDay + 1) / (SIM_DAYS - fromDay + 1)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round = (v: number, dp: number) => Math.round(v * 10 ** dp) / 10 ** dp

const IMAGING_PLAN: { modality: ImagingModality; zone: BodyZone; finding: string }[] = [
  { modality: 'ocular-ultrasound', zone: 'eyes', finding: 'Scheduled eye scan completed. Images stored onboard for review.' },
  { modality: 'cardiac-ultrasound', zone: 'heart-circulation', finding: 'Scheduled heart scan completed. Images stored onboard for review.' },
  { modality: 'bone', zone: 'bones-muscles', finding: 'Scheduled bone scan completed. Images stored onboard for review.' },
]
const IMAGING_EVERY = 7

export function generateReadings(seed: number = SIM_SEED, days: number = SIM_DAYS): VitalReading[] {
  const rand = mulberry32(seed)
  // Phase 3 indicators draw from their own stream so earlier data and storylines stay identical.
  const rand2 = mulberry32(seed ^ 0x5b02)
  const out: VitalReading[] = []

  CREW.forEach((crew, crewIndex) => {
    const p = makeProfile(rand)

    for (let day = 1; day <= days; day++) {
      const s = strain(crew.id, day)
      const at = MISSION_EPOCH + (day - 1) * DAY_MS + 7 * 3_600_000 + Math.round(between(rand, -30, 30)) * 60_000
      const base = { crewId: crew.id, missionDay: day, timestamp: new Date(at).toISOString(), simulated: true }
      const n = () => gaussian(rand)
      const scalar = (vital: ScalarVitalType, value: number): VitalReading => ({
        ...base,
        id: `${crew.id}-${vital}-d${day}`,
        kind: 'scalar',
        vital,
        value,
      })

      // Draw every noise sample even when a storyline overrides the value, so
      // storylines never shift the random stream for the rest of the data.
      let hr = Math.round(clamp(p.hr + 3 * n() + 10 * s, 40, 140))
      const sys = Math.round(clamp(p.sys + 4 * n() + 5 * s, 85, 190))
      const dia = Math.round(clamp(p.dia + 3 * n() + 3 * s, 50, 110))
      const hrv = Math.round(clamp(p.hrv + 4 * n() - 16 * s, 10, 140))
      let temp = round(clamp(p.temp + 0.12 * n(), 35.5, 39.5), 1)
      const glucose = Math.round(clamp(p.glucose + 5 * n(), 60, 180))
      let sleep = round(clamp(p.sleep + 0.4 * n(), 3, 9.5), 1)
      const mood = Math.round(clamp(p.mood + 0.28 * n() - 1.2 * s, 1, 5))
      const cog = Math.round(clamp(p.cog + 3 * n() - 16 * s, 30, 100))

      if (s > 0) sleep = STORYLINES.sleepDebt.sleep[day - STORYLINES.sleepDebt.fromDay]
      const fever = STORYLINES.fever
      if (crew.id === fever.crewId && (fever.days as readonly number[]).includes(day)) {
        temp = fever.coreTemperature
        hr = fever.heartRate
      }

      out.push(
        scalar('heartRate', hr),
        { ...base, id: `${crew.id}-bloodPressure-d${day}`, kind: 'pressure', vital: 'bloodPressure', systolic: sys, diastolic: dia },
        scalar('hrv', hrv),
        scalar('coreTemperature', temp),
        scalar('bloodGlucose', glucose),
        scalar('sleepHours', sleep),
        scalar('mood', mood),
        scalar('cognitiveReadiness', cog),
        // SpO2: mostly 96-99 %.
        scalar('spo2', Math.round(clamp(97.6 + 0.9 * gaussian(rand2), 95, 99))),
        // Vision self-check: no change reported (0) in the simulated history.
        scalar('visionCheck', 0),
      )

      if ((day + crewIndex * 2) % IMAGING_EVERY === 3) {
        const plan = IMAGING_PLAN[Math.floor((day + crewIndex * 2) / IMAGING_EVERY) % IMAGING_PLAN.length]
        out.push({ ...base, id: `${crew.id}-imagingLog-d${day}`, kind: 'imaging', vital: 'imagingLog', ...plan })
      }
    }
  })

  return out
}

/** Seeded prior career dose per crew member (simulated), in mSv. */
export function generatePriorDoses(seed: number = SIM_SEED): Record<string, number> {
  const rand = mulberry32(seed ^ 0x5eed)
  const [lo, hi] = PRIOR_DOSE_RANGE
  return Object.fromEntries(CREW.map((c) => [c.id, Math.round(between(rand, lo, hi))]))
}

/**
 * Seeded routine history for days 1..SIM_DAYS-1 (today, day 30, starts empty).
 * Storylines: the flight engineer misses "Protect sleep window" and the check-in
 * from day 22; the mission specialist skips exercise on day 29 (fever). Others
 * are mostly consistent with occasional realistic misses.
 */
export function generateRoutine(seed: number = SIM_SEED, days: number = SIM_DAYS): RoutineLog {
  const rand = mulberry32(seed ^ 0x7a5c)
  const missRate: Record<string, number> = { exercise: 0.07, nutrition: 0.08, sleep: 0.05, checkin: 0.06, connection: 0.3 }
  const hour: Record<string, number> = { exercise: 10, nutrition: 13, sleep: 21, checkin: 8, connection: 19 }
  const log: RoutineLog = {}
  for (const crew of CREW) {
    log[crew.id] = {}
    for (let day = 1; day < days; day++) {
      const entry: Record<string, string> = {}
      for (const task of Object.keys(missRate)) {
        const missed = rand() < missRate[task]
        const storyMiss =
          (crew.id === STORYLINES.sleepDebt.crewId && day >= STORYLINES.sleepDebt.fromDay && (task === 'sleep' || task === 'checkin')) ||
          (crew.id === STORYLINES.fever.crewId && day === STORYLINES.fever.days[0] && task === 'exercise')
        if (!missed && !storyMiss) entry[task] = new Date(MISSION_EPOCH + (day - 1) * DAY_MS + hour[task] * 3_600_000).toISOString()
      }
      log[crew.id][day] = entry
    }
  }
  return log
}
