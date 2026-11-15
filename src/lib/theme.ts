import { create } from 'zustand'

export type Theme = 'dark' | 'light'

/** localStorage key. index.html reads the same key before first paint, so keep them in step. */
export const THEME_KEY = 'vigil-theme'

/** Anything other than an explicit "light" means the default dark theme. */
export function parseTheme(value: unknown): Theme {
  return value === 'light' ? 'light' : 'dark'
}

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return parseTheme(document.documentElement.dataset.theme)
}

/** Apply a theme to the document, remember it, and keep the browser UI colour in step. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage blocked: the choice lasts for this page only */
  }
  const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim()
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}

interface ThemeState {
  theme: Theme
  toggle: () => void
}

/** The theme in React. The initial value comes from the attribute set by the pre-paint script in index.html. */
export const useTheme = create<ThemeState>()((set, get) => ({
  theme: currentTheme(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },
}))
