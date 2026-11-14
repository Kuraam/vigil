import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'

export interface UpcomingSection {
  title: string
  icon: LucideIcon
  phase: 2 | 3 | 4
  /** What this page does for the crew, in one sentence. */
  purpose: string
  /** Concrete capabilities planned for the page. */
  planned: string[]
}

/** Placeholder for a section that arrives in a later phase. Says what is coming, not lorem ipsum. */
export function EmptyState({ section }: { section: UpcomingSection }) {
  const { title, icon: Icon, phase, purpose, planned } = section
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={purpose} />
      <section
        aria-labelledby="planned-heading"
        className="max-w-3xl rounded-lg border border-dashed border-line-strong bg-panel p-6 sm:p-8"
      >
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-md bg-raised">
            <Icon aria-hidden className="size-6 text-fg-muted" />
          </div>
          <div className="min-w-0">
            <h2 id="planned-heading" className="text-lg font-semibold text-fg">
              Arrives in phase {phase}
            </h2>
            <p className="mt-1 text-fg-muted">This section is not built yet. When it lands, it will let the crew:</p>
            <ul className="mt-4 space-y-2">
              {planned.map((item) => (
                <li key={item} className="flex gap-3 text-fg">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-fg-faint" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
