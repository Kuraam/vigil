/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseTheme } from '../lib/theme'

/** Parse `--color-*: #hex` declarations from one CSS block. */
function colours(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]))
}

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
const dark = colours(css.slice(css.indexOf('@theme'), css.indexOf("[data-theme='light']")))
const light = { ...dark, ...colours(css.slice(css.indexOf("[data-theme='light']"))) }

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
/** A status colour at `t` opacity over a surface: the chip and alert tint backgrounds. */
const tint = (fg: string, bg: string, t: number) =>
  '#' + [1, 3, 5].map((i) => Math.round(parseInt(fg.slice(i, i + 2), 16) * t + parseInt(bg.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, '0')).join('')

const TEXT = ['fg', 'fg-muted', 'fg-faint', 'accent', 'nominal', 'watch', 'action', 'nodata']
const SURFACES = ['bg', 'panel', 'raised']
const STATUS = ['nominal', 'watch', 'action', 'nodata']

describe.each([
  ['dark', dark],
  ['light', light],
])('%s theme tokens', (_, t) => {
  it('defines every colour token', () => {
    for (const k of [...TEXT, ...SURFACES, 'line', 'line-strong', 'accent-ink', 'scrim', 'shadow', 'paper', 'ink']) expect(t[k], k).toMatch(/^#[0-9a-f]{6}$/)
  })
  it.each(TEXT.flatMap((fg) => SURFACES.map((bg) => [fg, bg])))('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5)
  })
  it.each(STATUS)('%s text stays at least 4.5:1 on its own chip tint, and body text on it too', (s) => {
    const chip = tint(t[s], t.panel, 0.12)
    expect(contrast(t[s], chip)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(t.fg, chip)).toBeGreaterThanOrEqual(4.5)
  })
  it('button text on the accent is at least 4.5:1', () => {
    expect(contrast(t['accent-ink'], t.accent)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('light theme', () => {
  it('uses darker status colours than dark mode', () => {
    for (const s of STATUS) expect(lum(light[s])).toBeLessThan(lum(dark[s]))
  })
})

describe('parseTheme', () => {
  it('defaults to dark for anything but "light"', () => {
    expect(parseTheme('light')).toBe('light')
    for (const v of ['dark', null, undefined, '', 'LIGHT', 1]) expect(parseTheme(v)).toBe('dark')
  })
})
