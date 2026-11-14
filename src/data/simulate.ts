/**
 * SIMULATED DATASET GENERATOR.
 *
 * Produces 30 mission days of readings for the four fictional crew members.
 * Output is fully determined by `seed`, so every run of the app and every
 * test sees the same numbers.
 *
 * The generator ranges below describe what *typical healthy adult* data
 * looks like so the demo is believable. They are NOT clinical thresholds
 * and must never be used to assign a status (see data/thresholds.ts).
 */
import { between, gaussian, mulberry32 } from '../lib/prng'
import type { BodyZone, ImagingModality, ScalarVitalType, VitalReading } from '../types'
import { CREW } from './crew'

export const SIM_SEED = 20261004
export const SIM_DAYS = 30
/** Fictional mission start. Day 1 begins at this instant. */
export const MISSION_EPOCH = Date.UTC(2031, 2, 1, 0, 0, 0)

const DAY_MS = 86_400_000

/** Per-crew baseline: centre value and day-to-day spread for each daily vital. */
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
    hr: between(rand, 56, 68),
    sys: between(rand, 110, 124),
    dia: between(rand, 68, 80),
    hrv: between(rand, 38, 70),
    glucose: between(rand, 84, 98),
    temp: between(rand, 36.6, 37.1),
    sleep: between(rand, 6.2, 7.2),
    mood: between(rand, 3.4, 4.3),
    cog: between(rand, 78, 90),
  }
}

/**
 * Demo storyline (simulated): crew-03 accumulates sleep debt from day 22,
 * with knock-on effects on heart rate, HRV, mood and cognition. Gives
 * Phase 2 trend views something real to find. Returns 0 outside the window.
 */
function strain(crewId: string, day: number): number {
  if (crewId !== 'crew-03' || day < 22) return 0
  return (day - 21) / (SIM_DAYS - 21) // ramps 0 -> 1 over days 22..30
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round = (v: number, dp: number) => Math.round(v * 10 ** dp) / 10 ** dp

const IMAGING_PLAN: { zone: BodyZone; modality: ImagingModality; note: string }[] = [
  { zone: 'head-eyes', modality: 'fundus-photo', note: 'Scheduled eye check. Images stored onboard.' },
  { zone: 'chest-heart', modality: 'ultrasound', note: 'Scheduled cardiac ultrasound. Images stored onboard.' },
  { zone: 'neck', modality: 'ultrasound', note: 'Scheduled neck vein ultrasound. Images stored onboard.' },
  { zone: 'spine-back', modality: 'ultrasound', note: 'Scheduled spine ultrasound. Images stored onboard.' },
]
/** Imaging sessions are every 7 days, offset per crew so they do not all scan on the same day. */
const IMAGING_EVERY = 7

export function generateReadings(seed: number = SIM_SEED, days: number = SIM_DAYS): VitalReading[] {
  const rand = mulberry32(seed)
  const out: VitalReading[] = []

  CREW.forEach((crew, crewIndex) => {
    const p = makeProfile(rand)

    for (let day = 1; day <= days; day++) {
      const s = strain(crew.id, day)
      // Morning measurement around 07:00 mission time, +/- up to 30 minutes.
      const at = MISSION_EPOCH + (day - 1) * DAY_MS + 7 * 3_600_000 + Math.round(between(rand, -30, 30)) * 60_000
      const timestamp = new Date(at).toISOString()
      const base = { crewId: crew.id, missionDay: day, timestamp, simulated: true as const }
      const n = () => gaussian(rand)

      const scalar = (vital: ScalarVitalType, value: number): VitalReading => ({
        ...base,
        id: `${crew.id}-${vital}-d${day}`,
        kind: 'scalar',
        vital,
        value,
      })

      out.push(
        scalar('heartRate', Math.round(clamp(p.hr + 3 * n() + 9 * s, 40, 140))),
        {
          ...base,
          id: `${crew.id}-bloodPressure-d${day}`,
          kind: 'pressure',
          vital: 'bloodPressure',
          systolic: Math.round(clamp(p.sys + 4 * n() + 6 * s, 85, 190)),
          diastolic: Math.round(clamp(p.dia + 3 * n() + 4 * s, 50, 110)),
        },
        scalar('hrv', Math.round(clamp(p.hrv + 6 * n() - 14 * s, 10, 140))),
        scalar('coreTemperature', round(clamp(p.temp + 0.15 * n(), 35.5, 39.5), 1)),
        scalar('bloodGlucose', Math.round(clamp(p.glucose + 5 * n(), 60, 180))),
        scalar('sleepHours', round(clamp(p.sleep + 0.5 * n() - 2 * s, 3, 9.5), 1)),
        scalar('mood', Math.round(clamp(p.mood + 0.5 * n() - 1.2 * s, 1, 5))),
        scalar('cognitiveReadiness', Math.round(clamp(p.cog + 4 * n() - 12 * s, 30, 100))),
      )

      if ((day + crewIndex * 2) % IMAGING_EVERY === 3) {
        const plan = IMAGING_PLAN[Math.floor((day + crewIndex * 2) / IMAGING_EVERY) % IMAGING_PLAN.length]
        out.push({ ...base, id: `${crew.id}-imagingLog-d${day}`, kind: 'imaging', vital: 'imagingLog', ...plan })
      }
    }
  })

  return out
}
