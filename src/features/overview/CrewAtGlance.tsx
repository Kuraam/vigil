import { StatusChip } from '../../components/StatusChip'
import { STATUS_STYLE } from '../../components/statusStyle'
import { CREW } from '../../data/crew'
import { useVigilStore } from '../../lib/store'
import { useCrewAttention } from '../../lib/useCrewHealth'

const ACCENT: Record<string, string> = {
  action: 'before:bg-action',
  watch: 'before:bg-watch',
  nominal: 'before:bg-nominal',
  nodata: 'before:bg-nodata',
}

/** One compact card per crew member: worst status and the most urgent issue. Choosing a card selects that crew member. */
export function CrewAtGlance() {
  const { list } = useCrewAttention()
  const crewId = useVigilStore((s) => s.crewId)
  const setCrew = useVigilStore((s) => s.setCrew)

  return (
    <section aria-labelledby="glance-heading" data-testid="crew-glance">
      <h2 id="glance-heading" className="mb-2 text-base font-semibold text-fg">
        Crew at a glance
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((a) => {
          const c = CREW.find((m) => m.id === a.crewId)!
          const on = a.crewId === crewId
          const issue = a.top ? `${a.top.label} ${a.top.value}` : 'All readings nominal'
          const { text } = STATUS_STYLE[a.worst]
          return (
            <li key={a.crewId}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setCrew(a.crewId)}
                aria-label={`${c.name}, ${c.role}. ${a.worst === 'nodata' ? 'No data' : a.worst}. ${issue}.${on ? ' Selected.' : ''}`}
                className={`relative flex h-full w-full cursor-pointer flex-col gap-2 overflow-hidden rounded-lg border bg-panel py-3 pr-3 pl-4 text-left transition-colors before:absolute before:inset-y-0 before:left-0 before:w-1 ${ACCENT[a.worst]} ${
                  on ? 'border-accent bg-raised' : 'border-line hover:border-line-strong hover:bg-raised/60'
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block font-medium text-fg">{c.name}</span>
                    <span className="block text-sm text-fg-muted">
                      {c.role} ({c.callSign})
                    </span>
                  </span>
                  <StatusChip result={{ status: a.worst, reason: a.worst === 'nodata' ? 'no-reading' : 'rated', detail: '' }} />
                </span>
                <span className={`text-sm ${a.top ? text : 'text-fg-muted'}`}>
                  <span className="readout">{issue}</span>
                  {a.action + a.watch > 1 && <span className="text-fg-faint"> +{a.action + a.watch - 1} more</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
