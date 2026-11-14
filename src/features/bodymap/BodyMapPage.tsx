import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { SimulatedTag } from '../../components/SimulatedTag'
import { STATUS_STYLE, chipLabel } from '../../components/statusStyle'
import { BODY_ZONES, getZone, isBodyZone } from '../../data/bodyZones'
import { useCrewHealth } from '../../lib/useCrewHealth'
import { rollUpZone } from '../../lib/zones'
import type { BodyZone, Status, StatusResult } from '../../types'
import { BodyFigure } from './BodyFigure'
import { ZonePanel } from './ZonePanel'

export function BodyMapPage() {
  const { crew, byVital, dose, exercise, environmentId } = useCrewHealth()
  const [params, setParams] = useSearchParams()
  const raw = params.get('zone')
  const selected: BodyZone = isBodyZone(raw) ? raw : 'heart-circulation'
  const select = (z: BodyZone) => setParams({ zone: z }, { replace: true })

  const zoneStatus = useMemo(() => {
    const out = {} as Record<BodyZone, StatusResult>
    for (const z of BODY_ZONES) {
      const hasImaging = byVital.imagingLog.history.some((r) => r.kind === 'imaging' && z.imaging.includes(r.modality))
      out[z.id] = rollUpZone(
        z.indicators.map((i) => (i === 'radiation' ? dose.status : i === 'exerciseAdherence' ? exercise.result : byVital[i].result)),
        hasImaging,
      )
    }
    return out
  }, [byVital, dose, exercise])
  const statuses = Object.fromEntries(BODY_ZONES.map((z) => [z.id, zoneStatus[z.id].status])) as Record<BodyZone, Status>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Body Map"
        description={`${crew?.name ?? 'Crew member'}: each body system takes the worst status of the readings linked to it. Choose a system to see what affects it.`}
        aside={<SimulatedTag />}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        <div className="rounded-lg border border-line bg-panel p-4 sm:p-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
            <div className="flex justify-center">
              <BodyFigure statuses={statuses} selected={selected} onSelect={select} />
            </div>
            <div>
              <h2 id="zones-heading" className="mb-2 text-base font-semibold text-fg">
                Body systems
              </h2>
              <ul aria-labelledby="zones-heading" className="space-y-1.5">
                {BODY_ZONES.map((z) => {
                  const res = zoneStatus[z.id]
                  const { icon: Icon, text } = STATUS_STYLE[res.status]
                  const isSel = z.id === selected
                  return (
                    <li key={z.id}>
                      <button
                        type="button"
                        aria-pressed={isSel}
                        onClick={() => select(z.id)}
                        className={`flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-md border px-3 py-1.5 text-left transition-colors ${
                          isSel ? 'border-accent bg-raised' : 'border-line hover:border-line-strong hover:bg-raised/60'
                        }`}
                      >
                        <Icon aria-hidden className={`size-4 shrink-0 ${text}`} strokeWidth={2.25} />
                        <span className="min-w-0 flex-1 text-sm text-fg">{z.name}</span>
                        <span className={`text-xs font-medium ${text}`}>{chipLabel(res)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

        <ZonePanel zone={getZone(selected)} status={zoneStatus[selected]} byVital={byVital} dose={dose} exercise={exercise} environmentId={environmentId} />
      </div>
    </div>
  )
}
