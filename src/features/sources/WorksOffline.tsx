import { Download, WifiOff } from 'lucide-react'
import { usePwa } from '../../lib/pwa'

/** "Works offline" part of About VIGIL, with the install button when the browser offers one. */
export function WorksOffline() {
  const canInstall = usePwa((s) => s.installEvent !== null && !s.installed)
  const install = usePwa((s) => s.install)
  return (
    <div data-testid="works-offline" className="mt-4 border-t border-line pt-4">
      <h3 className="flex items-center gap-2 font-semibold text-fg">
        <WifiOff aria-hidden className="size-4 text-accent" />
        Works offline
      </h3>
      <p className="mt-1 max-w-[70ch] text-fg-muted">
        After the first visit, VIGIL is stored on this device: every page, protocol and the Downlink brief work with no
        connection to Earth. No health data leaves the device.
      </p>
      {canInstall && (
        <button
          type="button"
          onClick={() => void install()}
          data-testid="install-app"
          className="mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-accent px-4 font-medium text-fg hover:bg-accent hover:text-accent-ink"
        >
          <Download aria-hidden className="size-4" />
          Install app
        </button>
      )}
    </div>
  )
}
