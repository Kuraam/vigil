import { Activity, CalendarCheck, PersonStanding, SatelliteDish, Stethoscope } from 'lucide-react'
import type { UpcomingSection } from './EmptyState'

/** Copy for the sections that arrive after Phase 1. Keep in step with the README roadmap. */
export const UPCOMING: Record<'bodyMap' | 'vitals' | 'triage' | 'routine' | 'downlink', UpcomingSection> = {
  bodyMap: {
    title: 'Body Map',
    icon: PersonStanding,
    phase: 2,
    purpose: 'Point to where it hurts or what changed, and see everything VIGIL knows about that part of the body.',
    planned: [
      'Select a body zone to log a symptom in plain words',
      'See imaging log entries and related vitals for that zone',
      'Spot zones linked to the hazards of the current environment',
    ],
  },
  vitals: {
    title: 'Vitals',
    icon: Activity,
    phase: 2,
    purpose: 'Follow each vital across the mission and see when it leaves its sourced range.',
    planned: [
      'View 30-day trends for every vital, one chart per reading',
      'Compare against threshold bands, each with its cited source',
      'Log a manual reading when a sensor is unavailable',
    ],
  },
  triage: {
    title: 'Triage',
    icon: Stethoscope,
    phase: 3,
    purpose: 'Work through a health concern step by step, without waiting for Earth to answer.',
    planned: [
      'Answer guided questions for common in-flight problems',
      'Get a clear next step: act now, monitor, or log for later',
      'Record what was done so the next crew shift can pick it up',
    ],
  },
  routine: {
    title: 'Routine',
    icon: CalendarCheck,
    phase: 3,
    purpose: 'Keep up the daily countermeasures that hold off the five hazards of spaceflight.',
    planned: [
      'See today’s exercise, sleep and radiation-shelter tasks',
      'Check off tasks and see how each one maps to a hazard',
      'Adjust the plan when a crew member’s readings drift',
    ],
  },
  downlink: {
    title: 'Downlink',
    icon: SatelliteDish,
    phase: 4,
    purpose: 'Package a health summary for Earth that survives the signal delay and limited bandwidth.',
    planned: [
      'Build a compact summary for the next communication window',
      'Preview exactly what flight surgeons on Earth will receive',
      'Track what has been sent and what is still waiting',
    ],
  },
}
