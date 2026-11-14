import { Activity, CalendarCheck, Gauge, PersonStanding, SatelliteDish, Stethoscope, type LucideIcon } from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
}

/** Left navigation, in mission order. */
export const NAV: NavItem[] = [
  { path: '/overview', label: 'Overview', icon: Gauge },
  { path: '/body-map', label: 'Body Map', icon: PersonStanding },
  { path: '/vitals', label: 'Vitals', icon: Activity },
  { path: '/triage', label: 'Triage', icon: Stethoscope },
  { path: '/routine', label: 'Routine', icon: CalendarCheck },
  { path: '/downlink', label: 'Downlink', icon: SatelliteDish },
]
