import type { BodyZone, EnvironmentId, HazardId, ImagingModality, RatedVitalType } from '../types'
import { DOSE_RATES } from './radiation'
import { HRP_RISKS_URL } from './sources'

/** A named NASA HRP risk, with the exact name from the Risks of Human Spaceflight page. */
export interface ZoneRisk {
  name: string
  /** One plain-English line. Definitional only: no statistics, no new claims. */
  description: string
  url: string
}

export interface ZoneHazard {
  hazard: HazardId
  /** How it affects this zone, worded from the NASA 5 Hazards page. */
  how: string
}

/** What a zone's status is rolled up from. */
export type ZoneIndicator = RatedVitalType | 'radiation' | 'exerciseAdherence'

export interface ZoneInfo {
  id: BodyZone
  name: string
  /** What this part of the body does, in plain English. */
  does: string
  risks: ZoneRisk[]
  hazards: ZoneHazard[]
  indicators: ZoneIndicator[]
  imaging: ImagingModality[]
  /** Shown when nothing VIGIL tracks rolls up into this zone. */
  untrackedNote?: string
}

const risk = (name: string, description: string): ZoneRisk => ({ name, description, url: HRP_RISKS_URL })

// Hazard lines reused across zones, worded from the NASA 5 Hazards page.
const H = {
  isolation: { hazard: 'isolation-confinement', how: 'Small crews in close quarters for long periods can show behavioural changes.' },
  gravityBalance: { hazard: 'gravity-fields', how: 'The inner ear must adapt to each new gravity level, including on return to Earth.' },
  gravityOrgans: { hazard: 'gravity-fields', how: 'Organs must adapt to each new gravity level, including on return to Earth.' },
  gravityBones: { hazard: 'gravity-fields', how: 'Muscles and bones must adapt to each new gravity level, including on return to Earth.' },
  radiation: { hazard: 'space-radiation', how: 'Invisible, and considered one of the most hazardous aspects of spaceflight.' },
  closedPressure: { hazard: 'hostile-closed-environments', how: 'Pressure inside the vehicle matters: it is both home and machine.' },
  closedMicrobes: { hazard: 'hostile-closed-environments', how: 'Microbes inside the vehicle matter: it is both home and machine.' },
  closedTemperature: { hazard: 'hostile-closed-environments', how: 'Temperature and microbes inside the vehicle matter: it is both home and machine.' },
  distance: { hazard: 'distance-from-earth', how: 'Planning and self-sufficiency are key when Earth is far away.' },
} satisfies Record<string, ZoneHazard>

export const BODY_ZONES: ZoneInfo[] = [
  {
    id: 'brain-behaviour',
    name: 'Brain and behaviour',
    does: 'Your brain handles thinking, memory, mood, sleep and balance, and how you work with the rest of the crew.',
    risks: [
      risk('Behavioral Changes and Psychiatric Disorders', 'Changes in mood, thinking or behaviour that affect health or the mission.'),
      risk('Inadequate Sleep and Irregular Schedules', 'Not getting enough sleep, or sleeping at irregular times.'),
      risk('Inadequate Teamwork', 'The crew not working well together as a team.'),
      risk('Altered Sensorimotor and Vestibular Function', 'Changes in balance, coordination and the inner ear’s sense of motion.'),
    ],
    hazards: [H.isolation, H.gravityBalance],
    indicators: ['mood', 'cognitiveReadiness', 'sleepHours'],
    imaging: [],
  },
  {
    id: 'eyes',
    name: 'Eyes',
    does: 'Your eyes turn light into signals that travel along the optic nerve to the brain, so you can see.',
    risks: [risk('Spaceflight Associated Neuro-ocular Syndrome (SANS)', 'Changes to the eyes and the nerve behind them that are linked to spaceflight.')],
    hazards: [H.gravityOrgans],
    indicators: ['visionCheck'],
    imaging: ['ocular-ultrasound'],
  },
  {
    id: 'heart-circulation',
    name: 'Heart and circulation',
    does: 'Your heart pumps blood through your blood vessels, carrying oxygen and nutrients to every part of the body.',
    risks: [
      risk('Cardiovascular Adaptations', 'How the heart and blood vessels change in response to spaceflight.'),
      risk('Reduced Cardiorespiratory and Musculoskeletal Fitness', 'Loss of heart, lung, muscle and bone fitness.'),
    ],
    hazards: [H.gravityOrgans],
    indicators: ['heartRate', 'bloodPressure', 'hrv'],
    imaging: ['cardiac-ultrasound'],
  },
  {
    id: 'lungs',
    name: 'Lungs',
    does: 'Your lungs take in oxygen from the air you breathe and get rid of carbon dioxide.',
    risks: [
      risk('Hypoxia', 'Not enough oxygen reaching the body’s tissues.'),
      risk('Decompression Sickness', 'Illness caused by a fast drop in the surrounding pressure.'),
    ],
    hazards: [H.closedPressure],
    indicators: ['spo2'],
    imaging: [],
  },
  {
    id: 'gut-nutrition',
    name: 'Gut and nutrition',
    does: 'Your gut breaks food down into the energy and nutrients your body runs on.',
    risks: [
      risk('Inadequate Food and Nutrition', 'Not getting enough food, or not the right nutrients.'),
      risk('Host-Microorganism Interactions', 'How the body and the microbes living in and around it affect each other.'),
    ],
    hazards: [H.closedMicrobes, H.distance],
    indicators: ['bloodGlucose'],
    imaging: [],
  },
  {
    id: 'bones-muscles',
    name: 'Bones and muscles',
    does: 'Your bones hold you up and protect your organs; your muscles move you and keep you strong.',
    risks: [
      risk('Spaceflight-Induced Bone Changes', 'Changes to bone caused by spaceflight.'),
      risk('Reduced Cardiorespiratory and Musculoskeletal Fitness', 'Loss of heart, lung, muscle and bone fitness.'),
      risk('Injury from Dynamic Loads', 'Injury from sudden forces on the body.'),
    ],
    hazards: [H.gravityBones],
    indicators: ['exerciseAdherence'],
    imaging: ['bone'],
  },
  {
    id: 'immune-blood',
    name: 'Immune system and blood',
    does: 'Your immune system fights infection, and your blood carries it, along with oxygen, around the body.',
    risks: [
      risk('Altered Immune System Responses', 'Changes in how the immune system responds. Stress can reactivate dormant viruses.'),
      risk('Radiation-Induced Cancers', 'Cancers caused by exposure to radiation.'),
    ],
    hazards: [H.radiation, H.closedMicrobes],
    indicators: ['radiation', 'coreTemperature'],
    imaging: [],
  },
  {
    id: 'skin-temperature',
    name: 'Skin and temperature regulation',
    does: 'Your skin protects you from the outside world and helps keep your body at a steady temperature.',
    risks: [
      risk('Host-Microorganism Interactions', 'The skin microbiome: the microbes that live on your skin, and how they and your body affect each other.'),
      risk('Altered Immune System Responses', 'Changes in how the immune system responds, which can show up as rashes.'),
    ],
    hazards: [H.closedTemperature],
    indicators: ['coreTemperature'],
    imaging: [],
  },
]

export function getZone(id: BodyZone): ZoneInfo {
  return BODY_ZONES.find((z) => z.id === id) ?? BODY_ZONES[0]
}

export function isBodyZone(id: unknown): id is BodyZone {
  return BODY_ZONES.some((z) => z.id === id)
}

/** Gravity in each environment, from the NASA 5 Hazards page ("three-eighths of Earth’s"). */
const GRAVITY: Record<EnvironmentId, string> = {
  'spacecraft-transit': 'In transit the crew is weightless.',
  'orbital-station': 'In orbit the crew is weightless.',
  'pressurized-rover': 'On Mars, gravity is three-eighths of Earth’s.',
  'surface-base': 'On Mars, gravity is three-eighths of Earth’s.',
}

/**
 * How the selected environment changes this zone's risk. Built only from
 * figures VIGIL already cites: gravity, dose rate and signal delay.
 */
export function environmentEffects(zone: ZoneInfo, env: EnvironmentId, delayLabel: string): string[] {
  const lines: string[] = []
  const hazards = new Set(zone.hazards.map((h) => h.hazard))
  if (hazards.has('gravity-fields')) lines.push(`${GRAVITY[env]} The body adapts again at every change, including the return to Earth.`)
  if (hazards.has('space-radiation')) {
    const r = DOSE_RATES[env]
    // Compare only with the other environment types, never with itself.
    const others = [
      env !== 'spacecraft-transit' && `${DOSE_RATES['spacecraft-transit'].rate.value} in transit`,
      env !== 'surface-base' && env !== 'pressurized-rover' && `${DOSE_RATES['surface-base'].rate.value} on the Mars surface`,
      env !== 'orbital-station' && `${DOSE_RATES['orbital-station'].rate.value} in low Earth orbit`,
    ].filter(Boolean)
    lines.push(
      `Radiation here is about ${r.rate.value} mSv per day${r.range ? ` (range ${r.range[0]}-${r.range[1]})` : ''}, compared with ${others.join(' and ')}.`,
    )
  }
  lines.push(`Help from Earth is ${delayLabel.toLowerCase()} away, one way, so the crew must be ready to act on their own.`)
  return lines
}
