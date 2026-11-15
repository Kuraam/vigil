/**
 * App icons for the PWA manifest, rendered from the VIGIL mark (the "V" chevron
 * in the top bar) with playwright-core. Original artwork; colours are the dark
 * theme tokens from src/styles/tokens.css.
 *
 * Writes public/icons/icon-192.png, icon-512.png (rounded tile) and
 * icon-maskable-512.png (full bleed, mark inside the 80% safe zone), plus
 * apple-touch-icon.png (180). Re-run after changing the mark: npm run icons
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const tokensCss = readFileSync('src/styles/tokens.css', 'utf8')
const darkBlock = tokensCss.slice(tokensCss.indexOf('@theme'), tokensCss.indexOf("[data-theme='light']"))
const token = (name) => {
  const m = darkBlock.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`token --color-${name} not found`)
  return m[1]
}
const raised = token('raised')
const accent = token('accent')

const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean)
  .find((p) => existsSync(p))

/** The mark from TopBar's Wordmark (viewBox 0 0 32 32), on a rounded tile or full bleed. */
const svg = ({ maskable }) => {
  // Maskable: background fills the square; the chevron is scaled into the central safe zone.
  const tile = maskable ? `<rect width="32" height="32" fill="${raised}"/>` : `<rect width="32" height="32" rx="6" fill="${raised}"/>`
  const mark = `<path d="M7 9l9 15 9-15" fill="none" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
  const body = maskable ? `<g transform="translate(16 16.5) scale(0.72) translate(-16 -16.5)">${mark}</g>` : mark
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">${tile}${body}</svg>`
}

mkdirSync('public/icons', { recursive: true })
const browser = await chromium.launch({ executablePath })
try {
  for (const { file, size, maskable } of [
    { file: 'icon-192.png', size: 192, maskable: false },
    { file: 'icon-512.png', size: 512, maskable: false },
    { file: 'icon-maskable-512.png', size: 512, maskable: true },
    { file: 'apple-touch-icon.png', size: 180, maskable: true },
  ]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } })
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg({ maskable })}</body></html>`)
    await page.screenshot({ path: `public/icons/${file}`, omitBackground: true })
    await page.close()
    console.log(`public/icons/${file} (${size}x${size}${maskable ? ', maskable' : ''})`)
  }
} finally {
  await browser.close()
}
