import { useEffect, useRef, type ReactNode } from 'react'

let firstRender = true

/**
 * Page title + one-line description. After in-app navigation, focus moves to
 * the heading so keyboard and screen-reader users land on the new page.
 */
export function PageHeader({ title, description, aside }: { title: string; description?: ReactNode; aside?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (firstRender) {
      firstRender = false
      return
    }
    ref.current?.focus({ preventScroll: true })
  }, [])

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
