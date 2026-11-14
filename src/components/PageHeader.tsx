import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router'

/** Path of the last page that rendered a header; null until the first page loads. */
let lastPath: string | null = null

/**
 * Page title + one-line description. After in-app navigation to a different
 * route, focus moves to the heading so keyboard and screen-reader users land
 * on the new page. Comparing paths (not a "first render" flag) keeps this
 * correct under React StrictMode, which runs effects twice in development.
 */
export function PageHeader({ title, description, aside }: { title: string; description?: ReactNode; aside?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    if (lastPath !== null && lastPath !== pathname) ref.current?.focus({ preventScroll: true })
    lastPath = pathname
  }, [pathname])

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 ref={ref} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-fg outline-none sm:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1 max-w-[70ch] text-fg-muted">{description}</p>}
      </div>
      {aside && <div className="flex flex-wrap items-center gap-2">{aside}</div>}
    </header>
  )
}
