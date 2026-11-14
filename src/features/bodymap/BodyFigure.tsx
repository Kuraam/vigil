import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { BodyZone, Status } from '../../types'
import { useTokens } from '../vitals/useTokens'

/*
 * Original, gender-neutral front-view figure in the console's line style.
 * No face: the head is a plain oval; the only head details are the brain and
 * eyes zones. The silhouette is built from soft overlapping shapes and drawn as
 * one outline (see SkinLayer). Shapes are mouse targets; keyboard users select
 * zones from the labelled list beside the figure, so the SVG is aria-hidden.
 */

const W = 200
const H = 460

/** Mirror a path drawn on the viewer's right (x > 100) to the left. Paths use only M/C/L/Z with "x y" pairs. */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${W - Number(x)} ${y}`)

/** A rounded capsule between two points: used for bones. */
function capsule(x1: number, y1: number, x2: number, y2: number, r: number): string {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const nx = -Math.sin(a) * r
  const ny = Math.cos(a) * r
  const p = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`
  return `M ${p(x1 + nx, y1 + ny)} L ${p(x2 + nx, y2 + ny)} A ${r} ${r} 0 0 0 ${p(x2 - nx, y2 - ny)} L ${p(x1 - nx, y1 - ny)} A ${r} ${r} 0 0 0 ${p(x1 + nx, y1 + ny)} Z`
}

// --- Silhouette parts (viewer's right; mirrored for the left) ---------------
const HEAD = { cx: 100, cy: 40, rx: 23, ry: 28 }
const NECK = 'M 90 62 C 90 74, 89 82, 82 90 L 118 90 C 111 82, 110 74, 110 62 Z'
const TORSO =
  'M 78 88 C 68 90, 58 93, 52 103 C 47 112, 48 124, 54 134 C 58 160, 62 186, 64 200 C 62 220, 57 240, 60 258 C 70 270, 86 275, 100 275 ' +
  'C 114 275, 130 270, 140 258 C 143 240, 138 220, 136 200 C 138 186, 142 160, 146 134 C 152 124, 153 112, 148 103 C 142 93, 132 90, 122 88 Z'
const ARM_R =
  'M 134 98 C 150 93, 160 104, 160 122 C 162 150, 164 176, 165 198 C 167 220, 170 240, 171 256 C 176 264, 176 279, 169 285 ' +
  'C 163 289, 157 281, 158 268 C 158 262, 157 258, 156 254 C 154 236, 152 218, 151 200 C 149 178, 146 156, 144 138 C 142 128, 138 118, 134 110 Z'
const LEG_R =
  'M 100 268 C 104 300, 106 330, 107 352 C 108 382, 110 410, 111 428 C 111 438, 116 445, 127 445 C 136 445, 135 436, 129 430 ' +
  'C 127 410, 129 384, 131 356 C 135 330, 141 300, 141 254 Z'
const SILHOUETTE = [NECK, TORSO, ARM_R, mirror(ARM_R), LEG_R, mirror(LEG_R)]

// --- Zones ---------------------------------------------------------------
const BRAIN = 'M 80 34 C 80 21, 91 15, 100 15 C 109 15, 120 21, 120 34 C 120 42, 112 45, 100 44 C 88 45, 80 42, 80 34 Z'
const EYE_R = 'M 104 55 C 107 51, 112 51, 115 55 C 112 58.5, 107 58.5, 104 55 Z'
const LUNG_R = 'M 104 104 C 104 99, 113 97, 121 102 C 133 109, 137 128, 137 150 C 137 165, 130 172, 120 170 C 112 168, 106 165, 104 158 Z'
const HEART = 'M 109 140 C 108 133, 100 131, 97 137 C 95 143, 100 151, 110 160 C 119 152, 124 145, 122 138 C 120 132, 112 133, 109 140 Z'
const GUT = 'M 80 198 C 80 187, 92 182, 100 184 C 110 182, 121 187, 120 198 C 122 216, 118 238, 100 241 C 82 238, 78 216, 80 198 Z'
const GUT_COILS = 'M 87 204 C 95 198, 104 210, 113 204 M 86 218 C 95 212, 105 224, 114 218 M 89 231 C 96 226, 104 236, 111 231'
const PELVIS = 'M 75 250 C 80 243, 92 246, 100 252 C 108 246, 120 243, 125 250 C 123 261, 112 266, 100 264 C 88 266, 77 261, 75 250 Z'
const BONES = [
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => capsule(100, 94 + i * 11, 100, 100 + i * 11, 3)), // spine (thoracic)
  PELVIS,
  capsule(104, 93, 136, 99, 2.6), // clavicles
  capsule(96, 93, 64, 99, 2.6),
  capsule(152, 116, 157, 190, 3.4), // upper arms
  capsule(48, 116, 43, 190, 3.4),
  capsule(159, 206, 164, 250, 3), // forearms
  capsule(41, 206, 36, 250, 3),
  capsule(121, 282, 119, 344, 4.2), // thighs
  capsule(79, 282, 81, 344, 4.2),
  capsule(119, 360, 120, 422, 3.4), // lower legs
  capsule(81, 360, 80, 422, 3.4),
]
const NODES: [number, number][] = [
  [91, 78],
  [109, 78],
  [61, 128],
  [139, 128],
  [84, 272],
  [116, 272],
]

/** Where each zone's name refers to, for the hover caption's marker. */
const ANCHOR: Record<BodyZone, [number, number]> = {
  'brain-behaviour': [100, 30],
  eyes: [110, 55],
  lungs: [126, 128],
  'heart-circulation': [110, 147],
  'gut-nutrition': [100, 212],
  'bones-muscles': [154, 154],
  'immune-blood': [127, 182],
  'skin-temperature': [62, 200],
}

/** Fit the figure to the space left in the viewport (so it is never cut off on short screens). */
function useFitHeight(min = 260, max = 470) {
  const ref = useRef<HTMLDivElement>(null)
  const [h, setH] = useState(max)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      // 40 px for the caption, 24 px breathing room at the bottom.
      setH(Math.round(Math.max(min, Math.min(max, window.innerHeight - top - 64))))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [min, max])
  return { ref, h }
}

export function BodyFigure({
  statuses,
  selected,
  hovered,
  onSelect,
  onHover,
  names,
}: {
  statuses: Record<BodyZone, Status>
  selected: BodyZone
  hovered: BodyZone | null
  onSelect: (z: BodyZone) => void
  onHover: (z: BodyZone | null) => void
  names: Record<BodyZone, string>
}) {
  const c = useTokens()
  const { ref, h } = useFitHeight()
  const tone: Record<Status, string> = { nominal: c.nominal, watch: c.watch, action: c.action, nodata: c.nodata }
  const statusWord: Record<Status, string> = { nominal: 'Nominal', watch: 'Watch', action: 'Action', nodata: 'No data' }

  const zone = (z: BodyZone, children: ReactNode) => {
    const color = tone[statuses[z]]
    const isSel = z === selected
    const isHot = z === hovered
    return (
      <g
        data-zone={z}
        onClick={() => onSelect(z)}
        onMouseEnter={() => onHover(z)}
        onMouseLeave={() => onHover(null)}
        className={`cursor-pointer ${isSel ? 'zone-pulse' : ''}`}
        fill={color}
        fillOpacity={isSel ? 0.42 : isHot ? 0.34 : 0.2}
        stroke={isSel ? c.accent : color}
        strokeWidth={isSel ? 2.4 : isHot ? 1.8 : 1.2}
        strokeLinejoin="round"
        style={{ transition: 'fill-opacity 150ms, stroke-width 150ms' }}
      >
        {children}
      </g>
    )
  }

  const skinColor = tone[statuses['skin-temperature']]
  const skinSel = selected === 'skin-temperature'
  const skinHot = hovered === 'skin-temperature'
  const shown = hovered ?? null
  const [ax, ay] = shown ? ANCHOR[shown] : [0, 0]

  return (
    <div ref={ref} className="flex flex-col items-center">
      {/* Caption: the zone under the pointer or keyboard focus. Fixed height, so nothing shifts. */}
      <p aria-hidden data-testid="zone-hover-label" className="mb-2 flex h-6 items-center gap-1.5 text-sm whitespace-nowrap">
        {shown ? (
          <>
            <span className="font-medium text-fg">{names[shown]}</span>
            <span className="text-fg-muted">{statusWord[statuses[shown]]}</span>
          </>
        ) : (
          <span className="text-fg-faint">Point to a body system</span>
        )}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden style={{ height: h }} className="w-auto max-w-full overflow-visible">
        <defs>
          <filter id="skin-glow" x="-20%" y="-10%" width="140%" height="120%">
            <feGaussianBlur stdDeviation={skinSel || skinHot ? 3.5 : 2.2} />
          </filter>
        </defs>

        {/* Skin: one outline around the whole silhouette, with a soft glow in its status colour. */}
        <g
          data-zone="skin-temperature"
          className="cursor-pointer"
          onClick={() => onSelect('skin-temperature')}
          onMouseEnter={() => onHover('skin-temperature')}
          onMouseLeave={() => onHover(null)}
        >
          <g filter="url(#skin-glow)" opacity={skinSel || skinHot ? 0.55 : 0.3} fill={skinColor} stroke={skinColor} strokeWidth={6}>
            <ellipse {...HEAD} />
            {SILHOUETTE.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          {/* Outline: stroke every part, then cover the inner seams with the panel colour. */}
          <g fill={skinSel ? c.accent : skinColor} stroke={skinSel ? c.accent : skinColor} strokeWidth={skinSel ? 4.8 : 3} className={skinSel ? 'zone-pulse' : ''}>
            <ellipse {...HEAD} />
            {SILHOUETTE.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g fill={c.panel}>
            <ellipse {...HEAD} />
            {SILHOUETTE.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          {/* Group opacity, so overlapping parts do not double the tint. */}
          <g fill={skinColor} opacity={skinSel ? 0.16 : 0.08}>
            <ellipse {...HEAD} />
            {SILHOUETTE.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>

        {zone(
          'bones-muscles',
          BONES.map((d) => <path key={d} d={d} />),
        )}
        {zone(
          'gut-nutrition',
          <>
            <path d={GUT} />
            <path d={GUT_COILS} fill="none" strokeLinecap="round" />
          </>,
        )}
        {zone(
          'lungs',
          <>
            <path d={LUNG_R} />
            <path d={mirror(LUNG_R)} />
          </>,
        )}
        {zone('heart-circulation', <path d={HEART} />)}
        {zone(
          'brain-behaviour',
          <>
            <path d={BRAIN} />
            <path d="M 100 17 C 98 26, 102 34, 100 43" fill="none" strokeLinecap="round" />
          </>,
        )}
        {zone(
          'eyes',
          <>
            <path d={EYE_R} />
            <path d={mirror(EYE_R)} />
          </>,
        )}
        {zone(
          'immune-blood',
          <>
            {NODES.map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={4.2} />
            ))}
            {/* Spleen, under the lower ribs on the body's left (viewer's right). */}
            <ellipse cx={127} cy={182} rx={5} ry={9} transform="rotate(-18 127 182)" />
          </>,
        )}

        {/* Marker for the zone named in the caption. */}
        {shown && (
          <circle cx={ax} cy={ay} r={3} fill={c.fg} stroke={c.panel} strokeWidth={1.5} pointerEvents="none" />
        )}
      </svg>
    </div>
  )
}
