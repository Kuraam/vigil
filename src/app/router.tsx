import { createBrowserRouter, Navigate } from 'react-router'
import { OverviewPage } from '../features/overview/OverviewPage'
import { EmptyState } from '../features/upcoming/EmptyState'
import { UPCOMING } from '../features/upcoming/sections'
import { Shell } from './shell/Shell'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'body-map', lazy: async () => ({ Component: (await import('../features/bodymap/BodyMapPage')).BodyMapPage }) },
      // Lazy routes keep Recharts and page code out of the first bundle.
      { path: 'vitals', lazy: async () => ({ Component: (await import('../features/vitals/VitalsPage')).VitalsPage }) },
      { path: 'triage', element: <EmptyState section={UPCOMING.triage} /> },
      { path: 'routine', element: <EmptyState section={UPCOMING.routine} /> },
      { path: 'downlink', element: <EmptyState section={UPCOMING.downlink} /> },
      { path: 'sources', lazy: async () => ({ Component: (await import('../features/sources/SourcesPage')).SourcesPage }) },
      // Unknown paths fall back to the Overview rather than a blank screen.
      { path: '*', element: <Navigate to="/overview" replace /> },
    ],
  },
])
