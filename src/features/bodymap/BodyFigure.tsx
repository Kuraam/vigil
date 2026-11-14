import type { BodyZone, Status } from '../../types'
import { useTokens } from '../vitals/useTokens'

/**
 * Original, gender-neutral front-view figure with no face detail. Each zone
 * shape is a mouse target; keyboard users select zones from the labelled list
 * next to the figure (the same selection), so the SVG itself is aria-hidden.
 */
export function BodyFigure({
  statuses,
  selected,
  onSelect,
}: {
  statuses: Record<BodyZone, Status>
  selected: BodyZone
  onSelect: (z: BodyZone) => void
}) {
  const c = useTokens()
  const tone: Record<Status, string> = { nominal: c.nominal, watch: c.watch, action: c.action, nodata: '#8b95a1' }
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#5cc8e8'

  const zoneProps = (z: BodyZone) => {
    const color = tone[statuses[z]]
    const isSel = z === selected
    return {
      fill: color,
      fillOpacity: isSel ? 0.5 : 0.28,
      stroke: isSel ? accent : color,
      strokeWidth: isSel ? 3 : 1.5,
      className: 'cursor-pointer transition-[fill-opacity] duration-150 hover:fill-opacity-50',
      onClick: () => onSelect(z),
      'data-zone': z,
    }
  }

  return (
    <svg viewBox="0 0 200 440" aria-hidden className="h-auto w-full max-w-[13rem]">
      {/* Skin: the whole silhouette (head, neck, torso). Selecting it highlights the outline. */}
      <g {...zoneProps('skin-temperature')}>
        <title>Skin and temperature regulation</title>
        <ellipse cx="100" cy="48" rx="31" ry="37" />
        <rect x="88" y="80" width="24" height="22" rx="6" />
        <path d="M58 104 Q100 92 142 104 L138 176 Q136 220 134 252 L66 252 Q64 220 62 176 Z" />
      </g>

      {/* Bones and muscles: arms and legs. */}
      <g {...zoneProps('bones-muscles')}>
        <title>Bones and muscles</title>
        <path d="M58 106 Q46 110 44 126 L36 252 Q36 262 44 262 Q51 262 52 252 L62 140 Z" />
        <path d="M142 106 Q154 110 156 126 L164 252 Q164 262 156 262 Q149 262 148 252 L138 140 Z" />
        <path d="M68 254 L98 254 L96 410 Q96 422 84 422 Q72 422 72 410 Z" />
        <path d="M102 254 L132 254 L128 410 Q128 422 116 422 Q104 422 104 410 Z" />
      </g>

      {/* Brain and behaviour: upper head. */}
      <path {...zoneProps('brain-behaviour')} d="M70 44 A30 34 0 0 1 130 44 Q100 36 70 44 Z">
        <title>Brain and behaviour</title>
      </path>

      {/* Eyes: a plain band, no facial features. */}
      <rect {...zoneProps('eyes')} x="76" y="49" width="48" height="11" rx="5.5">
        <title>Eyes</title>
      </rect>

      {/* Lungs. */}
      <g {...zoneProps('lungs')}>
        <title>Lungs</title>
        <path d="M96 116 Q76 112 72 132 L70 168 Q72 178 84 176 L96 172 Z" />
        <path d="M104 116 Q124 112 128 132 L130 168 Q128 178 116 176 L104 172 Z" />
      </g>

      {/* Heart, drawn over the lungs. */}
      <path {...zoneProps('heart-circulation')} d="M100 142 Q100 132 110 132 Q120 132 119 143 Q117 156 103 166 Q96 156 96 148 Q96 140 100 142 Z">
        <title>Heart and circulation</title>
      </path>

      {/* Gut and nutrition: abdomen. */}
      <ellipse {...zoneProps('gut-nutrition')} cx="100" cy="212" rx="28" ry="30">
        <title>Gut and nutrition</title>
      </ellipse>

      {/* Immune system and blood: lymph node markers at neck, armpits and groin. */}
      <g {...zoneProps('immune-blood')}>
        <title>Immune system and blood</title>
        {[
          [88, 92],
          [112, 92],
          [66, 116],
          [134, 116],
          [82, 250],
          [118, 250],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />
        ))}
      </g>
    </svg>
  )
}
