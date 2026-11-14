import { useMemo } from 'react'

/** Fallbacks mirror src/styles/tokens.css, used if CSS variables cannot be read. */
const FALLBACK = {
  fg: '#e6eaee',
  fgMuted: '#9aa5b1',
  fgFaint: '#7d8794',
  line: '#262d36',
  lineStrong: '#36404b',
  panel: '#12161b',
  nominal: '#3dd68c',
  watch: '#f5b544',
  action: '#ff6b6b',
  nodata: '#8b95a1',
  accent: '#5cc8e8',
}

/**
 * Design tokens as concrete colours for SVG attributes (Recharts sets
 * presentation attributes, where CSS var() is not reliable). Read once from
 * the CSS variables defined in tokens.css, so tokens.css stays the single source.
 */
export function useTokens(): typeof FALLBACK {
  return useMemo(() => {
    if (typeof window === 'undefined') return FALLBACK
    const css = getComputedStyle(document.documentElement)
    const read = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb
    return {
      fg: read('--color-fg', FALLBACK.fg),
      fgMuted: read('--color-fg-muted', FALLBACK.fgMuted),
      fgFaint: read('--color-fg-faint', FALLBACK.fgFaint),
      line: read('--color-line', FALLBACK.line),
      lineStrong: read('--color-line-strong', FALLBACK.lineStrong),
      panel: read('--color-panel', FALLBACK.panel),
      nominal: read('--color-nominal', FALLBACK.nominal),
      watch: read('--color-watch', FALLBACK.watch),
      action: read('--color-action', FALLBACK.action),
      nodata: read('--color-nodata', FALLBACK.nodata),
      accent: read('--color-accent', FALLBACK.accent),
    }
  }, [])
}
