import { createBrowserRouter, Navigate } from 'react-router'
import { OverviewPage } from '../features/overview/OverviewPage'
import { BodyMapPage, DownlinkPage, RoutinePage, SourcesPage, TriagePage, VitalsPage } from './pages'
import { Shell } from './shell/Shell'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      // Lazy pages suspend inside the Shell's content area, never the whole app.
      { path: 'body-map', element: <BodyMapPage /> },
      { path: 'vitals', element: <VitalsPage /> },
      { path: 'triage', element: <TriagePage /> },
      { path: 'routine', element: <RoutinePage /> },
      { path: 'downlink', element: <DownlinkPage /> },
      { path: 'sources', element: <SourcesPage /> },
      // Unknown paths fall back to the Overview rather than a blank screen.
      { path: '*', element: <Navigate to="/overview" replace /> },
    ],
  },
])
