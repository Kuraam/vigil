import { useMemo } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { THRESHOLDS } from '../../data/thresholds'
import { missionDayFraction } from '../../lib/missionTime'
import { dailyLatest } from '../../lib/readings'
import type { RatedVitalType, VitalReading } from '../../types'
import type { ChartSpec } from './chartSpec'
import { useTokens } from './useTokens'

interface Point {
  x: number
  day: number
  time: string
  value?: number
  diastolic?: number
  rolling?: number
  logged: boolean
}

/** Chart points: one per reading. HRV also gets its 7-day rolling mean (the value the rule rates). */
function toPoints(vital: RatedVitalType, history: VitalReading[]): Point[] {
  const pts: Point[] = history.map((r) => ({
    x: missionDayFraction(r.timestamp),
    day: r.missionDay,
    time: r.timestamp.slice(11, 16),
    value: r.kind === 'scalar' ? r.value : r.kind === 'pressure' ? r.systolic : undefined,
    diastolic: r.kind === 'pressure' ? r.diastolic : undefined,
    logged: !r.simulated,
  }))
  if (vital === 'hrv') {
    const window = THRESHOLDS.hrv.windowDays.value
    const daily = dailyLatest(history)
    for (const p of pts) {
      const vals = daily.filter((r) => r.missionDay <= p.day && r.missionDay > p.day - window).map((r) => (r.kind === 'scalar' ? r.value : 0))
      if (vals.length) p.rolling = vals.reduce((a, b) => a + b, 0) / vals.length
    }
  }
  return pts
}

export function TrendChart({
  vital,
  history,
  spec,
  unit,
  label,
}: {
  vital: RatedVitalType
  history: VitalReading[]
  spec: ChartSpec
  unit: string
  label: string
}) {
  const c = useTokens()
  const data = useMemo(() => toPoints(vital, history), [vital, history])
  const isBp = vital === 'bloodPressure'
  const isHrv = vital === 'hrv'
  const lastDay = Math.max(30, ...data.map((d) => Math.ceil(d.x)))

  const fmt = (n: number | undefined) => (n === undefined ? '--' : n.toFixed(spec.decimals))

  const tooltip = ({ active, payload }: TooltipContentProps) => {
    if (!active || !payload?.length) return null
    const p = payload[0].payload as Point
    return (
      <div className="rounded-md border border-line-strong bg-raised px-3 py-2 text-sm shadow-lg">
        <div className="text-fg-muted">
          Day {p.day}, {p.time}
          {p.logged ? ' (logged)' : ''}
        </div>
        {isBp ? (
          <div className="readout text-fg">
            {p.value}/{p.diastolic} {unit}
          </div>
        ) : (
          <div className="readout text-fg">
            {fmt(p.value)} {unit}
          </div>
        )}
        {isHrv && p.rolling !== undefined && <div className="readout text-fg-muted">7-day mean {fmt(p.rolling)}</div>}
      </div>
    )
  }

  return (
    <div
      role="img"
      aria-label={`${label} trend over ${lastDay} mission days. ${spec.bands.map((b) => `${b.label} band ${fmt(b.from)} to ${fmt(b.to)}`).join('. ')}. ${spec.rules.map((r) => r.label).join('. ')}.`}
      className="h-56 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={c.line} strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            domain={[1, lastDay + 1]}
            ticks={[1, 5, 10, 15, 20, 25, 30]}
            tickFormatter={(v: number) => `D${Math.floor(v)}`}
            stroke={c.fgFaint}
            tick={{ fill: c.fgFaint, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: c.line }}
          />
          <YAxis
            domain={spec.domain}
            stroke={c.fgFaint}
            tick={{ fill: c.fgFaint, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
            allowDataOverflow
          />
          {spec.bands.map((b) => (
            <ReferenceArea key={b.label} y1={b.from} y2={b.to} fill={c.nominal} fillOpacity={0.09} stroke="none" ifOverflow="hidden" />
          ))}
          {spec.rules.map((r) => (
            <ReferenceLine
              key={r.label}
              y={r.y}
              stroke={r.tone === 'action' ? c.action : c.watch}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{ value: r.label, position: 'insideTopRight', fill: c.fgMuted, fontSize: 11 }}
              ifOverflow="hidden"
            />
          ))}
          {spec.baseline && (
            <ReferenceLine
              y={spec.baseline.y}
              stroke={c.fgMuted}
              strokeDasharray="2 3"
              strokeWidth={1.5}
              label={{ value: spec.baseline.label, position: 'insideBottomLeft', fill: c.fgMuted, fontSize: 11 }}
            />
          )}
          <Tooltip content={tooltip} cursor={{ stroke: c.lineStrong }} isAnimationActive={false} />
          <Line
            type="linear"
            dataKey="value"
            name={isBp ? 'Systolic' : label}
            stroke={c.fg}
            strokeWidth={2}
            dot={{ r: 2.5, fill: c.fg, stroke: c.panel, strokeWidth: 1 }}
            activeDot={{ r: 5, fill: c.fg, stroke: c.panel, strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls
          />
          {isBp && (
            <Line
              type="linear"
              dataKey="diastolic"
              name="Diastolic"
              stroke={c.fgMuted}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 2.5, fill: c.fgMuted, stroke: c.panel, strokeWidth: 1 }}
              activeDot={{ r: 5, fill: c.fgMuted, stroke: c.panel, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          )}
          {isHrv && (
            <Line type="monotone" dataKey="rolling" name="7-day mean" stroke={c.fgMuted} strokeWidth={2} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
