import { Link } from 'react-router'
import { STATUS_STYLE } from '../../components/statusStyle'
import { useCrewAttention } from '../../lib/useCrewHealth'

/**
 * Crew-wide alert count, coloured by the worst status (icon + words, never colour alone).
 * Opens Triage in whole-crew view.
 */
export function CrewAlertIndicator() {
  const { totals } = useCrewAttention()
  const { icon: Icon, text, chip } = STATUS_STYLE[totals.worst]
  const clear = totals.action + totals.watch === 0
  const words = clear ? 'all nominal' : `${totals.action} Action · ${totals.watch} Watch`

  return (
    <div className="min-w-0">
      <span className="field-label block" aria-hidden>
        Crew alerts
      </span>
      <Link
        to="/triage?view=crew-all"
        data-testid="crew-alerts"
        aria-label={`Crew alerts: ${clear ? 'all nominal' : `${totals.action} action, ${totals.watch} watch`}. Open Triage for the whole crew.`}
        className={`mt-0.5 inline-flex h-11 items-center gap-2 rounded-md border px-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:brightness-125 ${chip}`}
      >
        <Icon aria-hidden className={`size-4 shrink-0 ${text}`} strokeWidth={2.25} />
        <span className="text-fg">Crew:</span>{' '}
        <span className={`readout ${text}`}>{words}</span>
      </Link>
    </div>
  )
}
