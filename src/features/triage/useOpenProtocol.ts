import type { Alert } from '../../lib/alerts'
import { missionNowMs } from '../../lib/missionTime'
import { findResumable, startRun } from '../../lib/protocolRun'
import { useVigilStore } from '../../lib/store'
import { useMissionHealth } from '../../lib/useCrewHealth'

/**
 * Start (or resume) the protocol for an alert and return the run id.
 * Shared by Triage and the Overview "Attention now" strip so both open the same run.
 */
export function useOpenProtocol() {
  const runs = useVigilStore((s) => s.runs)
  const saveRun = useVigilStore((s) => s.saveRun)
  const { missionDay } = useMissionHealth()
  return (a: Alert): string | undefined => {
    if (!a.protocolId) return undefined
    const existing = findResumable(runs, a.crewId, a.protocolId)
    if (existing) return existing.id
    const run = startRun(a.protocolId, a.crewId, a.key, new Date(missionNowMs(missionDay)).toISOString())
    saveRun(run)
    return run.id
  }
}
