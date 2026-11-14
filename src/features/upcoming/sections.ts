import { CalendarCheck, SatelliteDish, Stethoscope } from 'lucide-react'
import type { UpcomingSection } from './EmptyState'

/** Copy for the sections that arrive after Phase 1. Keep in step with the README roadmap. */
export const UPCOMING: Record<'triage' | 'routine' | 'downlink', UpcomingSection> = {
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
    purpose: 'Keep up the daily countermeasures that help the crew cope with the five hazards of spaceflight.',
    planned: [
      'Work through a daily checklist of countermeasure tasks',
      'See which hazard each task addresses',
      'Keep a streak of completed days',
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
