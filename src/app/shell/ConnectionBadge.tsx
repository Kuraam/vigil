import { CloudDownload, Wifi, WifiOff } from 'lucide-react'
import { connectionView } from '../../lib/connection'
import { usePwa } from '../../lib/pwa'

const STYLE = {
  online: { icon: Wifi, tone: 'text-fg-muted border-line-strong' },
  preparing: { icon: CloudDownload, tone: 'text-fg-muted border-line-strong' },
  // Offline is the headline state: accent outline, never a warning colour (it is not a fault).
  offline: { icon: WifiOff, tone: 'text-fg border-accent' },
}

/**
 * Connection status: icon + words, never colour alone. Below `sm` only the icon shows;
 * the words stay available to screen readers.
 */
export function ConnectionBadge() {
  const online = usePwa((s) => s.online)
  const sw = usePwa((s) => s.pwa.sw)
  const view = connectionView({ online, sw })
  const { icon: Icon, tone } = STYLE[view.kind]
  return (
    <p
      role="status"
      data-testid="connection-badge"
      data-kind={view.kind}
      data-sw={sw}
      title={view.kind === 'offline' ? 'No network: every page, protocol and the Downlink brief keep working on this device.' : undefined}
      className={`inline-flex h-6 w-fit items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap ${tone}`}
    >
      <Icon aria-hidden className={`size-3.5 shrink-0 ${view.kind === 'offline' ? 'text-accent' : ''}`} />
      <span className="sr-only sm:not-sr-only">{view.label}</span>
    </p>
  )
}
