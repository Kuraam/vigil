import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { Compass } from 'lucide-react'
import { useTour } from '../../features/tour/tourStore'
import { NAV } from '../nav'

/**
 * Primary navigation. Vertical rail from `md` up; a horizontal, scrollable
 * strip on narrow screens. The active marker slides to show what changed.
 */
export function SideNav() {
  const startTour = useTour((s) => s.start)
  return (
    <nav aria-label="Primary" className="print:hidden border-b border-line bg-panel md:w-56 md:shrink-0 md:border-r md:border-b-0">
      <ul className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible md:p-3">
        {NAV.map(({ path, label, icon: Icon }) => (
          <li key={path} className="shrink-0">
            <NavLink
              to={path}
              className={({ isActive }) =>
                `relative flex h-11 items-center gap-3 rounded-md px-3 text-base transition-colors ${
                  isActive ? 'bg-raised text-fg' : 'text-fg-muted hover:bg-raised/60 hover:text-fg'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent md:inset-x-auto md:inset-y-2 md:left-0 md:h-auto md:w-0.5"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon aria-hidden className={`size-5 ${isActive ? 'text-accent' : ''}`} />
                  <span className="whitespace-nowrap">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="shrink-0 md:mt-4 md:border-t md:border-line md:pt-3">
          <button
            type="button"
            onClick={startTour}
            className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-base text-fg-muted hover:bg-raised/60 hover:text-fg"
          >
            <Compass aria-hidden className="size-5" />
            <span className="whitespace-nowrap">Take the tour</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
