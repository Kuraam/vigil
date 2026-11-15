import { useMemo } from 'react'
import { useTheme } from '../../lib/theme'

const NAMES = {
  fg: '--color-fg',
  fgMuted: '--color-fg-muted',
  fgFaint: '--color-fg-faint',
  line: '--color-line',
  lineStrong: '--color-line-strong',
  panel: '--color-panel',
  nominal: '--color-nominal',
  watch: '--color-watch',
  action: '--color-action',
  nodata: '--color-nodata',
  accent: '--color-accent',
} as const

export type Tokens = Record<keyof typeof NAMES, string>

/**
 * Design tokens as concrete colours for SVG attributes (Recharts sets
 * presentation attributes, where CSS var() is not reliable). Read from the CSS
 * variables in tokens.css, so tokens.css stays the single source of colour.
 * Re-read whenever the theme changes, so charts and the Body Map follow it.
 */
export function useTokens(): Tokens {
  const theme = useTheme((s) => s.theme)
  return useMemo(() => {
    const css = typeof window === 'undefined' ? null : getComputedStyle(document.documentElement)
    // No colour literals here: if a variable cannot be read, fall back to the text colour.
    const read = (name: string) => css?.getPropertyValue(name).trim() || 'currentColor'
    return Object.fromEntries(Object.entries(NAMES).map(([k, v]) => [k, read(v)])) as Tokens
    // theme is the dependency that matters: the variables change with it.
  }, [theme])
}
