import type { BodyZone } from '../types'
import { HRP_RESEARCH_URL } from './sources'

export type ResearchStatus = 'NASA research in progress' | 'Ongoing NASA investigation'

/**
 * NASA HRP investigations from the official challenge resource. Phase 3
 * Routine will use these. Anything still under investigation is labelled
 * "NASA research in progress" and must never be shown as a proven treatment.
 */
export interface ResearchItem {
  id: string
  name: string
  description: string
  status: ResearchStatus
  /** Body Map zones the investigation relates to. */
  zones: BodyZone[]
  url: string
}

export const RESEARCH: ResearchItem[] = [
  {
    id: 'archer',
    // Brief listed "ARCHeR (Artemis II)"; the mission name is omitted per the no-mission-identifiers rule.
    name: 'ARCHeR',
    description: 'Tracks crew well-being, activity and sleep.',
    status: 'Ongoing NASA investigation',
    zones: ['brain-behaviour'],
    url: HRP_RESEARCH_URL,
  },
  {
    id: 'b-complex',
    name: 'B-Complex',
    description: 'Tests whether a daily B vitamin may reduce brain and eye changes.',
    status: 'NASA research in progress',
    zones: ['brain-behaviour', 'eyes'],
    url: HRP_RESEARCH_URL,
  },
  {
    id: 'thigh-cuff',
    name: 'Thigh Cuff',
    description: 'Tests whether thigh cuffs keep fluid in the legs to help prevent eye changes.',
    status: 'NASA research in progress',
    zones: ['eyes'],
    url: HRP_RESEARCH_URL,
  },
  {
    id: 'zero-t2',
    name: 'Zero T2',
    description: 'Exercise without a treadmill and its effect on health and performance.',
    status: 'Ongoing NASA investigation',
    zones: ['bones-muscles', 'heart-circulation'],
    url: HRP_RESEARCH_URL,
  },
  {
    id: 'space-gardening',
    name: 'Space Gardening',
    description: 'Whether growing vegetables eases isolation stress.',
    status: 'Ongoing NASA investigation',
    zones: ['brain-behaviour', 'gut-nutrition'],
    url: HRP_RESEARCH_URL,
  },
  {
    id: 'tempus-pro',
    name: 'Tempus Pro',
    description: 'Telemedicine device for remote near real-time diagnosis.',
    status: 'Ongoing NASA investigation',
    zones: [],
    url: HRP_RESEARCH_URL,
  },
]
