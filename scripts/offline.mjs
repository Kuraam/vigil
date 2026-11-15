/**
 * Offline test: VIGIL must keep working with no connection to Earth.
 *
 *  1. Fresh browser context: open /overview and wait until the service worker
 *     controls the page and the precache is complete ("Ready to work offline.").
 *  2. Take the context offline.
 *  3. Reload, then open every route (and an unknown path) directly by URL.
 *  4. Each renders its heading with no console errors, and the badge reads
 *     "Offline: running on device".
 *  5. Run the whole fever path offline: Triage, fever protocol, re-measure 37.4,
 *     status updates, Downlink brief with the protocol steps.
 *
 * Needs a production build. Usage:
 *   npm run build && npm run offline                       # starts its own vite preview
 *   OFFLINE_URL=https://vigil-pandas.vercel.app npm run offline
 */
import { existsSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { preview } from 'vite'

const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean)
  .find((p) => existsSync(p))
if (!executablePath) {
  console.error('No Chrome/Edge found. Set CHROME_PATH.')
  process.exit(2)
}

const target = process.env.OFFLINE_URL?.replace(/\/+$/, '')
if (!target && !existsSync('dist/sw.js')) {
  console.error('No production build with a service worker. Run npm run build first.')
  process.exit(2)
}
const server = target ? null : await preview({ preview: { port: 4177, strictPort: true }, logLevel: 'error' })
const base = target ?? 'http://localhost:4177'
const OUT = '.tmp/offline'
mkdirSync(OUT, { recursive: true })
console.log(`Offline target: ${base}\n`)

const ROUTES = [
  { path: '/overview', heading: 'Arjun Sethi' },
  { path: '/body-map', heading: 'Body Map' },
  { path: '/vitals', heading: 'Vitals' },
  { path: '/triage', heading: 'Triage' },
  { path: '/routine', heading: 'Routine' },
  { path: '/downlink', heading: 'Downlink' },
  { path: '/sources', heading: 'Sources' },
  { path: '/no-such-page', heading: 'Arjun Sethi' },
]
const OFFLINE_LABEL = 'Offline: running on device'

const failures = []
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
  if (!ok) failures.push(name)
}

const browser = await chromium.launch({ executablePath })
try {
  // A fresh context: no service worker or cache from any earlier run can mask a failure.
  const context = await browser.newContext({ viewport: { width: 1366, height: 645 } })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))

  // 1. First visit, online.
  await page.goto(base + '/overview', { waitUntil: 'networkidle' })
  const controlled = await page
    .waitForFunction(() => navigator.serviceWorker?.controller !== null && navigator.serviceWorker?.controller !== undefined, null, { timeout: 30000 })
    .then(() => true, () => false)
  check('service worker controls the page on first visit', controlled)
  const ready = await page.locator('[data-testid="connection-badge"][data-sw="ready"]').waitFor({ timeout: 30000 }).then(() => true, () => false)
  check('precache complete (badge reports offline mode ready)', ready)
  check('"Ready to work offline." toast shown', ((await page.getByTestId('offline-ready-toast').textContent().catch(() => '')) ?? '').includes('Ready to work offline.'))
  const cached = await page.evaluate(async () => {
    let n = 0
    for (const name of await caches.keys()) n += (await (await caches.open(name)).keys()).length
    return n
  })
  check('precache holds the app (HTML, every chunk, CSS, fonts, icons, manifest)', cached >= 45, `${cached} entries`)
  check('badge reads Online while connected', (await page.getByTestId('connection-badge').textContent())?.trim() === 'Online')
  // The deck PDF is not precached and must not be swallowed by the app-shell fallback.
  const pdf = await context.newPage()
  const pdfRes = await pdf.goto(base + '/VIGIL-demo-deck.pdf').catch(() => null)
  check('online: the deck PDF is still served as a PDF', (pdfRes?.headers()['content-type'] ?? '').includes('application/pdf'), pdfRes?.headers()['content-type'])
  await pdf.close()

  // 2. Lose the connection.
  await context.setOffline(true)

  // 3 + 4. Reload, then every route by direct URL.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('h1', { hasText: 'Arjun Sethi' }).waitFor({ timeout: 10000 }).catch(() => {})
  check('offline: reload renders the Overview', (await page.locator('h1').first().textContent())?.trim() === 'Arjun Sethi')
  for (const { path, heading } of ROUTES) {
    await page.goto(base + path, { waitUntil: 'domcontentloaded' }).catch((e) => errors.push(`goto ${path}: ${e.message}`))
    const shown = await page.locator('h1', { hasText: heading }).first().waitFor({ timeout: 10000 }).then(() => true, () => false)
    const badge = (await page.getByTestId('connection-badge').textContent().catch(() => ''))?.trim()
    check(`offline: ${path} renders "${heading}"`, shown && badge === OFFLINE_LABEL, `badge "${badge}"`)
    if (path !== '/no-such-page') await page.screenshot({ path: `${OUT}${path}.png` })
  }

  // 5. The fever path, entirely offline.
  await page.goto(base + '/overview', { waitUntil: 'domcontentloaded' })
  await page.getByLabel('Crew member', { exact: true }).selectOption('crew-04')
  await page.getByRole('link', { name: 'Triage', exact: true }).click()
  await page.waitForURL('**/triage')
  const fever = page.getByTestId('alert-crew-04:coreTemperature')
  await fever.waitFor({ timeout: 10000 }).catch(() => {})
  check('offline: fever alert in Triage', (await fever.count()) === 1 && ((await fever.textContent()) ?? '').includes('38.3'))
  await fever.getByRole('button', { name: /Start protocol/ }).click()
  const runner = page.locator('article', { has: page.locator('#runner-heading') })
  await runner.waitFor({ timeout: 10000 })
  check('offline: fever protocol opens', (await page.locator('#runner-heading').textContent())?.trim() === 'Fever / high core temperature')
  await runner.getByRole('group', { name: 'Confusion' }).getByRole('button', { name: 'No' }).click()
  await runner.getByLabel('Re-measure core temperature correctly and enter it below.').check()
  await runner.getByLabel('Rest.', { exact: true }).check()
  await runner.getByLabel('Value (°C)').fill('37.4')
  await runner.getByLabel('Value (°C)').press('Enter')
  await page
    .waitForFunction(() => document.querySelector('[data-testid="runner-current-coreTemperature"]')?.textContent?.includes('37.4'), null, { timeout: 10000 })
    .catch(() => {})
  const current = (await runner.getByTestId('runner-current-coreTemperature').textContent()) ?? ''
  check('offline: re-measured 37.4 °C updates the status to Nominal', current.includes('37.4') && current.includes('Nominal'), current)
  await page.getByRole('link', { name: 'Downlink', exact: true }).click()
  await page.waitForURL('**/downlink')
  await page.getByRole('button', { name: 'Build brief' }).click()
  const brief = (await page.getByTestId('brief-text').textContent()) ?? ''
  check('offline: Downlink brief includes the fever protocol', brief.includes('Fever / high core temperature'))
  check('offline: brief has the timestamped re-measure and steps', /Re-measured: Core temperature 37\.4 °C/.test(brief) && /Rest\./.test(brief) && /Red flag "Confusion": no/.test(brief))
  await page.screenshot({ path: `${OUT}/downlink-brief-offline.png` })

  // Narrow screen: the badge shows the icon only, with the words for screen readers.
  await page.setViewportSize({ width: 390, height: 844 })
  const labelWidth = await page.getByTestId('connection-badge').locator('span').evaluate((el) => el.getBoundingClientRect().width)
  const a11yText = (await page.getByTestId('connection-badge').textContent())?.trim()
  check('390 px: badge is icon-only on screen but keeps its words for screen readers', labelWidth <= 1 && a11yText === OFFLINE_LABEL, `label width ${labelWidth}px, text "${a11yText}"`)
  await page.screenshot({ path: `${OUT}/overview-390-offline.png` })

  check('offline: console clean', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
} finally {
  await browser.close()
  await server?.close()
}

console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll offline checks passed')
process.exit(failures.length ? 1 : 0)
