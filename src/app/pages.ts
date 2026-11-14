import { lazy } from 'react'

/*
 * Lazy page components. Each page's code (and Recharts) stays out of the first
 * bundle; the Shell wraps the outlet in <Suspense>, so while a chunk loads the
 * top bar, navigation and footer stay on screen and only the content area shows
 * a skeleton.
 */
const loaders = {
  bodyMap: () => import('../features/bodymap/BodyMapPage').then((m) => ({ default: m.BodyMapPage })),
  vitals: () => import('../features/vitals/VitalsPage').then((m) => ({ default: m.VitalsPage })),
  triage: () => import('../features/triage/TriagePage').then((m) => ({ default: m.TriagePage })),
  routine: () => import('../features/routine/RoutinePage').then((m) => ({ default: m.RoutinePage })),
  downlink: () => import('../features/downlink/DownlinkPage').then((m) => ({ default: m.DownlinkPage })),
  sources: () => import('../features/sources/SourcesPage').then((m) => ({ default: m.SourcesPage })),
}

export const BodyMapPage = lazy(loaders.bodyMap)
export const VitalsPage = lazy(loaders.vitals)
export const TriagePage = lazy(loaders.triage)
export const RoutinePage = lazy(loaders.routine)
export const DownlinkPage = lazy(loaders.downlink)
export const SourcesPage = lazy(loaders.sources)

/** Warm every page chunk once the browser is idle, so later navigation rarely shows the skeleton. */
export function prefetchPages() {
  const run = () => Object.values(loaders).forEach((load) => void load().catch(() => {}))
  const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(run)
  else window.setTimeout(run, 1500)
}
