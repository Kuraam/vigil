import type { EnvironmentId } from '../../types'

export interface TourStep {
  title: string
  caption: string
  /** Route to open, including any query string. */
  path: string
  /** `data-tour` value of the element to highlight. */
  target: string
  crewId?: string
  environmentId?: EnvironmentId
}

/** The 60-second tour. Each stop sets the demo state it needs, then highlights one area. */
export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Overview and signal delay',
    caption:
      'Each crew member’s latest readings are rated against cited thresholds. Top right: Earth is up to 22.3 minutes away one way, so VIGIL works crew-autonomous first.',
    path: '/overview',
    target: 'comm',
    crewId: 'crew-03',
    environmentId: 'spacecraft-transit',
  },
  {
    title: 'The environment changes the priorities',
    caption:
      'On Surface Base the five hazards are re-ranked and radiation drops to 0.64 mSv a day from 1.84, so many more days remain before the career limit.',
    path: '/overview',
    target: 'environment',
    crewId: 'crew-03',
    environmentId: 'surface-base',
  },
  {
    title: 'Body Map',
    caption:
      'Arjun Sethi has a 38.3 °C fever, so his immune system and blood zone is in Action. Each body system links to named NASA HRP risks.',
    path: '/body-map?zone=immune-blood',
    target: 'body-map',
    crewId: 'crew-04',
  },
  {
    title: 'Triage and the fever protocol',
    caption:
      'The fever alert leads the queue with the threshold it crossed and its source. Start protocol walks through confirm, assess, act and escalate.',
    path: '/triage',
    target: 'triage-queue',
    crewId: 'crew-04',
  },
  {
    title: 'Downlink brief',
    caption: 'Build brief packs statuses, alerts, protocol steps and 7-day trends into a few KB of plain text for the next window to Earth.',
    path: '/downlink',
    target: 'downlink-build',
    crewId: 'crew-04',
  },
  {
    title: 'Sources',
    caption: 'Every threshold and figure cites its source: NASA, CSA and clinical guidelines. Team-defined rules are labelled as such.',
    path: '/sources',
    target: 'sources-about',
  },
]
