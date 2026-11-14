/**
 * Every source VIGIL cites, in one place. Thresholds, radiation figures,
 * comm delays and context notes reference these labels, and the Sources page
 * renders this list. If a number in the app has no entry here, it is a bug.
 */
export type SourceGroup = 'challenge' | 'nasa' | 'agency' | 'clinical' | 'team'

export interface Source {
  id: string
  /** Exact citation string shown next to the value. */
  label: string
  group: SourceGroup
  /** Public link, where one exists. */
  url?: string
  /** Where VIGIL uses it, in plain words. */
  usedBy: string[]
}

export const SOURCE_GROUP_LABEL: Record<SourceGroup, string> = {
  challenge: 'Challenge resources',
  nasa: 'NASA',
  agency: 'Other space agencies',
  clinical: 'Clinical guidelines and research',
  team: 'VIGIL team rules',
}

const s = <T extends Record<string, Omit<Source, 'id'>>>(defs: T) =>
  Object.fromEntries(Object.entries(defs).map(([id, d]) => [id, { id, ...d }])) as { [K in keyof T]: Source }

export const HRP_RISKS_URL = 'https://www.nasa.gov/hrp/risks/'
export const HRP_RESEARCH_URL = 'https://www.nasa.gov/hrp/ongoing-hrp-research/'

/** Shown under the Challenge resources group on the Sources page. */
export const ENDORSEMENT_NOTE =
  'NASA does not endorse any non-U.S. Government entity. Non-NASA sources are used under their own terms of use.'

export const SOURCES = s({
  // Challenge resources (official Space Apps 2026 challenge links)
  hrpHazards: {
    label: 'NASA HRP, 5 Hazards of Human Spaceflight',
    group: 'challenge',
    url: 'https://www.nasa.gov/hrp/hazards/',
    usedBy: ['Overview: spaceflight hazards panel'],
  },
  hrpRisks: {
    label: 'NASA HRP, Risks of Human Spaceflight',
    group: 'challenge',
    url: HRP_RISKS_URL,
    usedBy: ['Body Map: named risks for every zone', 'About VIGIL: Risk of Inadequate Systems Operations Support'],
  },
  hrpResearch: {
    label: 'NASA HRP, Ongoing HRP Research',
    group: 'challenge',
    url: HRP_RESEARCH_URL,
    usedBy: ['Research investigations data (used by Routine in phase 3)'],
  },
  csaRadiation: {
    label: 'CSA, Monitoring Radiation for Astronaut Health (2026)',
    group: 'challenge',
    url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
    usedBy: ['Radiation panel: neutron note and CANS spectrometer'],
  },
  csaScience: {
    label: 'CSA, Why Do We Conduct Science Experiments in Space?',
    group: 'challenge',
    url: 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp',
    usedBy: ['Sources: background on why crew health is studied in space'],
  },

  // NASA
  nasaStd3001Career: {
    label: 'NASA-STD-3001 Vol 1 [V1 4030]',
    group: 'nasa',
    usedBy: ['Radiation: career dose limit (600 mSv)'],
  },
  nasaStd3001Spe: {
    label: 'NASA-STD-3001 Vol 1 [V1 4031]',
    group: 'nasa',
    usedBy: ['Radiation: solar particle event limit (250 mSv per event)'],
  },
  radCruise: {
    label: 'NASA MSL/Curiosity RAD, cruise; Zeitlin et al., 2013, Science',
    group: 'nasa',
    usedBy: ['Radiation: Spacecraft Transit dose rate'],
  },
  radGale: {
    label: 'NASA MSL/Curiosity RAD, Gale Crater; Hassler et al., 2014, Science',
    group: 'nasa',
    usedBy: ['Radiation: Pressurized Rover and Surface Base dose rate'],
  },
  issDosimetry: {
    label: 'NASA ISS crew dosimetry',
    group: 'nasa',
    usedBy: ['Radiation: Orbital Station dose rate'],
  },
  marsRelay: {
    label: 'NASA Mars Relay Network: ~3 to ~22 min one-way light time',
    group: 'nasa',
    usedBy: ['Earth signal delay: Spacecraft Transit, Pressurized Rover, Surface Base'],
  },
  basner2015: {
    label: 'Basner et al., 2015 (NASA Cognition test battery)',
    group: 'nasa',
    usedBy: ['Cognitive readiness: context note'],
  },

  // Clinical guidelines and research
  who2011: {
    label: 'WHO Pulse Oximetry Training Manual (2011)',
    group: 'clinical',
    usedBy: ['SpO2: all tiers', 'Triage: low SpO2 protocol, how to measure'],
  },
  ahaMeasureBp: {
    label: 'American Heart Association, how to measure blood pressure',
    group: 'clinical',
    usedBy: ['Triage: high blood pressure protocol, how to measure'],
  },
  ada1515: {
    label: 'American Diabetes Association, 15-15 rule',
    group: 'clinical',
    usedBy: ['Triage: low blood sugar protocol, act step'],
  },
  aha2017: {
    label: 'AHA/ACC 2017 blood pressure categories',
    group: 'clinical',
    usedBy: ['Blood pressure: nominal, watch, action and crisis tiers'],
  },
  ahaLowBp: {
    label: 'American Heart Association, low blood pressure',
    group: 'clinical',
    usedBy: ['Blood pressure: low blood pressure (watch)'],
  },
  ahaHeartRate: {
    label: 'American Heart Association: 60-100 bpm resting',
    group: 'clinical',
    usedBy: ['Resting heart rate: nominal range'],
  },
  ada: {
    label: 'American Diabetes Association, Standards of Care',
    group: 'clinical',
    usedBy: ['Blood glucose: all tiers'],
  },
  cdcFever: {
    label: 'CDC fever definition, 100.4 F / 38.0 C',
    group: 'clinical',
    usedBy: ['Core temperature: fever (action)'],
  },
  hypothermia: {
    label: 'clinical definition of hypothermia',
    group: 'clinical',
    usedBy: ['Core temperature: hypothermia (action)'],
  },
  stahn2017: {
    label: 'Stahn et al., 2017, Scientific Reports',
    group: 'clinical',
    usedBy: ['Core temperature: microgravity context note'],
  },
  aasm2015: {
    label: 'AASM/SRS 2015 consensus: adults need 7+ hours',
    group: 'clinical',
    usedBy: ['Sleep: nominal and watch tiers'],
  },
  barger2014: {
    label: 'Barger et al., 2014, Lancet Neurology',
    group: 'clinical',
    usedBy: ['Sleep: ISS sleep context note'],
  },

  // Team rules
  team: {
    label: 'VIGIL triage rule (team-defined, not clinically validated)',
    group: 'team',
    usedBy: [
      'Resting heart rate: watch and action tiers',
      'HRV: personal baseline and drop tiers',
      'Core temperature: nominal and watch tiers',
      'Sleep: 3 consecutive short nights (action)',
      'Mood: all tiers',
      'Cognitive readiness: all tiers',
      'Radiation: status as a share of the career limit',
      'Vision self-check: a reported change is watch',
      'Exercise adherence: all tiers',
      'Triage: comm-delay escalation rule',
      'Overview: hazard priority in each environment',
      'Routine: points, streaks and milestones',
    ],
  },
  lightTime: {
    label: 'Light travel time via geostationary relay (about 2 × 35,786 km). Excludes ground processing.',
    group: 'team',
    usedBy: ['Earth signal delay: Orbital Station (calculated by the team)'],
  },
})

export type SourceId = keyof typeof SOURCES

export const ALL_SOURCES: Source[] = Object.values(SOURCES)
