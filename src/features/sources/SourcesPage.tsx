import { ExternalLink } from 'lucide-react'
import { PageHeader } from '../../components/PageHeader'
import TEAM from '../../data/team.json'
import { ResetDemo } from './ResetDemo'
import { ALL_SOURCES, ENDORSEMENT_NOTE, SOURCE_GROUP_LABEL, SOURCES, type SourceGroup } from '../../data/sources'

const ORDER: SourceGroup[] = ['challenge', 'nasa', 'agency', 'clinical', 'team']

const GROUP_INTRO: Partial<Record<SourceGroup, string>> = {
  agency: 'The Canadian Space Agency (CSA) articles VIGIL uses are listed under Challenge resources.',
  team: 'Rules the VIGIL team defined to fill gaps between published figures. They are not clinically validated.',
}

/** Sources, grouped, each with where VIGIL uses it; plus the About and AI-use statement required by the Space Apps rules. */
export function SourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sources"
        description="Every figure VIGIL shows comes from one of these sources. Each entry lists where it is used."
      />

      <section aria-labelledby="about-heading" data-tour="sources-about" className="max-w-4xl rounded-lg border border-line bg-panel p-4 sm:p-5">
        <h2 id="about-heading" className="text-lg font-semibold text-fg">
          About VIGIL
        </h2>
        <ul className="mt-2 space-y-1.5 text-fg-muted">
          <li>
            Built by {TEAM.name} for {TEAM.event}: {TEAM.members.map((m) => `${m.name} (${m.role})`).join(', ')}.
          </li>
          <li>
            Code written with the assistance of Claude (Anthropic), an AI coding assistant, directed and reviewed by the
            team.
          </li>
          <li>All crew data is simulated.</li>
          <li>Not a medical device.</li>
          <li>
            VIGIL addresses NASA HRP’s named Risk of Inadequate Systems Operations Support by giving crews the
            information and guidance to act when Earth is minutes away.{' '}
            <a href={SOURCES.hrpRisks.url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
              NASA HRP risks
            </a>
          </li>
        </ul>
      </section>

      <ResetDemo />

      {ORDER.map((group) => {
        const items = ALL_SOURCES.filter((s) => s.group === group)
        return (
          <section key={group} aria-labelledby={`group-${group}`} className="max-w-4xl rounded-lg border border-line bg-panel">
            <div className="px-4 pt-4 sm:px-5">
              <h2 id={`group-${group}`} className="text-base font-semibold text-fg">
                {SOURCE_GROUP_LABEL[group]}
              </h2>
              {group === 'challenge' && <p className="mt-1 text-sm text-fg-muted">{ENDORSEMENT_NOTE}</p>}
              {GROUP_INTRO[group] && <p className="mt-1 text-sm text-fg-muted">{GROUP_INTRO[group]}</p>}
            </div>
            {items.length > 0 ? (
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {items.map((s) => (
                  <li key={s.id} className="px-4 py-3 sm:px-5">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
                        {s.label}
                        <ExternalLink aria-hidden className="mt-1 size-3.5 shrink-0" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <p className="font-medium text-fg">{s.label}</p>
                    )}
                    <p className="mt-1 text-sm text-fg-faint">Used by</p>
                    <ul className="list-disc pl-5 text-sm text-fg-muted">
                      {s.usedBy.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 pt-2 pb-4 text-sm text-fg-muted sm:px-5">None used directly.</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
