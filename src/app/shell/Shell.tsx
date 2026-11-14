import { AnimatePresence, motion } from 'motion/react'
import { useLocation, useOutlet } from 'react-router'
import { SideNav } from './SideNav'
import { TopBar } from './TopBar'

export const DISCLAIMER = 'Simulated data. Concept demonstration, not a medical device.'

export function Shell() {
  const location = useLocation()
  const outlet = useOutlet()

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <TopBar />
      <div className="flex flex-1 flex-col md:flex-row">
        <SideNav />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.25, 1, 0.5, 1] }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <footer className="sticky bottom-0 border-t border-line bg-panel px-4 py-2.5 text-sm text-fg-muted sm:px-6">
        {DISCLAIMER}
      </footer>
    </div>
  )
}
