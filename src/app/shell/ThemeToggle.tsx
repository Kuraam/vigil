import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../lib/theme'

/** Switch between the dark (default) and light themes. The icon shows the theme you will switch to. */
export function ThemeToggle() {
  const theme = useTheme((s) => s.theme)
  const toggle = useTheme((s) => s.toggle)
  const next = theme === 'dark' ? 'light' : 'dark'
  const Icon = next === 'light' ? Sun : Moon
  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="theme-toggle"
      data-theme-current={theme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-md border border-line-strong text-fg-muted transition-colors hover:border-fg-faint hover:text-fg"
    >
      <Icon aria-hidden className="size-5" />
    </button>
  )
}
