import type { Hazard } from '../types'

const HRP_SOURCE = 'NASA Human Research Program, “5 Hazards of Human Spaceflight”'

/** The five NASA HRP hazards, summarised in plain language for a non-physician crew member. */
export const HAZARDS: Hazard[] = [
  {
    id: 'space-radiation',
    name: 'Space Radiation',
    summary:
      'Beyond Earth’s magnetic field, galactic cosmic rays and solar particle events raise long-term cancer risk and may affect the nervous system.',
    watchFor: ['Fatigue', 'Nausea', 'Cognitive readiness', 'Skin'],
    source: HRP_SOURCE,
  },
  {
    id: 'isolation-confinement',
    name: 'Isolation and Confinement',
    summary:
      'Months in a small crew and tight quarters can wear on mood, sleep, attention and how the team works together.',
    watchFor: ['Mood', 'Sleep', 'Cognitive readiness'],
    source: HRP_SOURCE,
  },
  {
    id: 'distance-from-earth',
    name: 'Distance from Earth',
    summary: 'Signal delay and no quick return mean the crew must recognise and manage medical problems on their own.',
    watchFor: ['All vitals', 'Medical supplies', 'Comm delay'],
    source: HRP_SOURCE,
  },
  {
    id: 'gravity-fields',
    name: 'Gravity Fields',
    summary: 'Moving between gravity levels shifts body fluids and affects bone, muscle, balance, the heart and vision.',
    watchFor: ['Blood pressure', 'Heart rate', 'Eyes', 'Spine'],
    source: HRP_SOURCE,
  },
  {
    id: 'hostile-closed-environments',
    name: 'Hostile/Closed Environments',
    summary: 'Air quality, carbon dioxide, noise, temperature and microbes inside the vehicle all shape crew health.',
    watchFor: ['Core temperature', 'Sleep', 'Skin', 'Headache'],
    source: HRP_SOURCE,
  },
]
