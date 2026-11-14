import { Atom, Box, Globe, MoveDown, Users, type LucideIcon } from 'lucide-react'
import type { HazardId } from '../types'

/** One icon per NASA HRP hazard, shared by the hazard panel and the Body Map. */
export const HAZARD_ICON: Record<HazardId, LucideIcon> = {
  'space-radiation': Atom,
  'isolation-confinement': Users,
  'distance-from-earth': Globe,
  'gravity-fields': MoveDown,
  'hostile-closed-environments': Box,
}
