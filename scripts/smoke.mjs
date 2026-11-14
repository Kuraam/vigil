/**
 * Route smoke check.
 *
 * Opens every route in a real browser by direct URL and fails if the document
 * returns an HTTP error, any page logs a console error or throws, or a page is
 * missing its heading. Targets a fresh Vite dev server by default, or any
 * running deployment when SMOKE_URL is set (preview, Vercel production).
 * Also checks the unknown-route fallback and the crew / environment selectors.
 * Screenshots go to .tmp/screens/ for visual review.
 *
 * Browser: uses CHROME_PATH if set, otherwise the standard Chrome / Edge install
 * locations on Windows, macOS and Linux (playwright-core does not download one).
 *
 * Usage:
 *   npm run smoke                                   # dev server
 *   SMOKE_URL=http://localhost:4173 npm run smoke   # npm run preview
 *   SMOKE_URL=https://example.vercel.app npm run smoke
 */
import { existsSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)

const executablePath = CANDIDATES.find((p) => existsSync(p))
if (!executablePath) {
  console.error('No Chrome/Edge found. Set CHROME_PATH to a Chromium-based browser.')
  process.exit(2)
}

const ROUTES = [
  { path: '/overview', heading: 'Ines Varga' },
  { path: '/body-map', heading: 'Body Map' },
  { path: '/vitals', heading: 'Vitals' },
  { path: '/triage', heading: 'Triage' },
  { path: '/routine', heading: 'Routine' },
  { path: '/downlink', heading: 'Downlink' },
  { path: '/sources', heading: 'Sources' },
]

const OUT = '.tmp/screens'
mkdirSync(OUT, { recursive: true })

const target = process.env.SMOKE_URL?.replace(/\/+$/, '')
const server = target ? null : await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' })
await server?.listen()
const base = target ?? 'http://localhost:5199'
console.log(`Smoke target: ${base}
`)

const browser = await chromium.launch({ executablePath })
const failures = []

async function openPage(viewport = { width: 1440, height: 1000 }) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  return { page, errors }
}

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
  if (!ok) failures.push(name)
}

try {
  // 1. Every route renders its heading with no console errors.
  for (const { path, heading } of ROUTES) {
    const { page, errors } = await openPage()
    const res = await page.goto(base + path, { waitUntil: 'networkidle' })
    check(`${path} HTTP status`, (res?.status() ?? 0) < 400, String(res?.status()))
    const h1 = (await page.locator('h1').first().textContent())?.trim()
    const footer = await page.locator('footer').textContent()
    check(`${path} heading`, h1 === heading, `got "${h1}"`)
    check(`${path} disclaimer`, footer?.includes('Simulated data. Concept demonstration, not a medical device.') ?? false)
    check(`${path} console clean`, errors.length === 0, errors.join(' | '))
    if (path === '/sources') {
      const text = (await page.textContent('main')) ?? ''
      check('/sources AI disclosure', text.includes('Claude (Anthropic), an AI coding assistant'))
      check('/sources endorsement note', text.includes('NASA does not endorse any non-U.S. Government entity.'))
    }
    await page.screenshot({ path: `${OUT}${path}.png`, fullPage: true })
    await page.close()
  }

  // 2. Root and unknown paths fall back to the Overview.
  for (const path of ['/', '/does-not-exist']) {
    const { page, errors } = await openPage()
    const res = await page.goto(base + path, { waitUntil: 'networkidle' })
    check(`${path} HTTP status`, (res?.status() ?? 0) < 400, String(res?.status()))
    // <Navigate> runs in an effect, so wait for the URL rather than sampling it once.
    const redirected = await page
      .waitForURL((u) => u.pathname === '/overview', { timeout: 5000 })
      .then(() => true)
      .catch(() => false)
    check(`${path} redirects to /overview`, redirected, page.url())
    check(`${path} renders Overview`, (await page.locator('h1').first().textContent())?.trim() === 'Ines Varga')
    check(`${path} console clean`, errors.length === 0, errors.join(' | '))
    await page.close()
  }

  // 3. Selectors change global state, and the choice survives a reload (localStorage).
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    await page.getByLabel('Crew member').selectOption('crew-03')
    check('crew select updates Overview', (await page.locator('h1').textContent())?.trim() === 'Mei Tanaka-Ross')
    // Environment drives comm delay and the radiation rate / days remaining.
    const rate = () => page.getByTestId('dose-rate').textContent()
    const days = () => page.getByTestId('dose-days').textContent()
    const transit = { rate: await rate(), days: await days() }
    await page.getByLabel('Environment').selectOption('surface-base')
    const surface = { rate: await rate(), days: await days() }
    check('environment changes radiation rate', transit.rate?.includes('1.84') && surface.rate?.includes('0.64'), `${transit.rate} -> ${surface.rate}`)
    check('environment changes days remaining', transit.days !== surface.days, `${transit.days} -> ${surface.days}`)
    await page.getByLabel('Environment').selectOption('orbital-station')
    check('environment select updates comm delay', (await page.getByRole('banner').textContent())?.includes('Under 1 s') ?? false)
    await page.reload({ waitUntil: 'networkidle' })
    check('selection persists across reload', (await page.locator('h1').textContent())?.trim() === 'Mei Tanaka-Ross')
    check('interaction console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // Storylines show up on screen.
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    const chip = async (title) =>
      (await page.locator('article', { has: page.getByRole('heading', { name: title, exact: true }) }).locator('span[title]').first().textContent())?.trim()
    await page.getByLabel('Crew member').selectOption('crew-03')
    check('FE sleep debt shows Action', (await chip('Sleep')) === 'Action', await chip('Sleep'))
    await page.getByLabel('Crew member').selectOption('crew-04')
    check('MS fever shows Action on core temperature', (await chip('Core temperature')) === 'Action', await chip('Core temperature'))
    check('MS heart rate 108 shows Watch', (await chip('Heart rate')) === 'Watch', await chip('Heart rate'))
    await page.screenshot({ path: `${OUT}/overview-ms-fever.png`, fullPage: true })
    check('storyline console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // Log a reading on Vitals: invalid input is rejected, a valid one updates Vitals, Overview and Body Map.
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/vitals', { waitUntil: 'networkidle' })
    const card = page.locator('article', { has: page.getByRole('heading', { name: 'Heart rate', exact: true }) })
    await card.getByRole('button', { name: 'Log heart rate reading' }).click()
    const input = card.getByLabel('Value (bpm)')
    await input.fill('abc')
    await card.getByRole('button', { name: 'Save reading' }).click()
    check('invalid entry shows an inline error', (await card.textContent())?.includes('Enter a value as a number.') ?? false)
    check('invalid entry is not saved', (await card.locator('[role=status]').textContent())?.trim() === '')
    await input.fill('130')
    await input.press('Enter')
    check('valid entry confirms save', (await card.locator('[role=status]').textContent())?.includes('130 bpm') ?? false)
    check('Vitals chip updates to Action', (await card.locator('header span[title]').first().textContent())?.trim() === 'Action')
    await page.getByRole('link', { name: 'Overview' }).click()
    await page.waitForURL('**/overview')
    const hr = page.locator('article', { has: page.getByRole('heading', { name: 'Heart rate', exact: true }) })
    check('Overview shows the logged reading', (await hr.textContent())?.includes('130') ?? false)
    await page.getByRole('link', { name: 'Body Map' }).click()
    await page.waitForURL('**/body-map')
    const heartBtn = page.getByRole('button', { name: /Heart and circulation/ })
    check('Body Map heart zone rolls up to Action', (await heartBtn.textContent())?.includes('Action') ?? false, await heartBtn.textContent())
    check('logging console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // Body Map: keyboard selection, SANS explanation, environment-specific text.
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/body-map', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /^Eyes/ }).focus()
    await page.keyboard.press('Enter')
    // Selection goes through the URL (?zone=), so wait for it to settle.
    await page.locator('#zone-heading', { hasText: /^Eyes$/ }).waitFor({ timeout: 5000 }).catch(() => {})
    check('keyboard selects Eyes zone', (await page.locator('#zone-heading').textContent())?.trim() === 'Eyes')
    check('Eyes zone explains SANS', (await page.getByRole('heading', { name: 'What is SANS?' }).count()) === 1)
    check('Eyes zone is rated by the vision self-check', (await page.getByRole('button', { name: /^Eyes/ }).textContent())?.includes('Nominal') ?? false)
    await page.getByRole('button', { name: /Bones and muscles/ }).click()
    const envText = () => page.getByTestId('zone-environment').textContent()
    await page.locator('#zone-heading', { hasText: 'Bones and muscles' }).waitFor({ timeout: 5000 }).catch(() => {})
    const before = await envText()
    await page.getByLabel('Environment').selectOption('surface-base')
    const after = await envText()
    check('environment changes zone risk text', before !== after && (after?.includes('three-eighths') ?? false), after?.slice(0, 60))
    check('zone deep link in URL', page.url().includes('zone=bones-muscles'), page.url())
    await page.screenshot({ path: `${OUT}/body-map-bones.png`, fullPage: true })
    check('body map console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // Keyboard: on a fresh page the first focusable element reached by Tab is the skip link.
  // (Headless Chrome can spend the first Tab focusing the document itself.)
  {
    const { page } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    let focused = 'BODY'
    for (let i = 0; i < 3 && focused === 'BODY'; i++) {
      await page.keyboard.press('Tab')
      focused = await page.evaluate(() =>
        document.activeElement === document.body ? 'BODY' : (document.activeElement?.textContent?.trim() ?? ''),
      )
    }
    check('first focusable element is the skip link', focused === 'Skip to content', `got "${focused.slice(0, 40)}"`)
    await page.close()
  }

  // 4. Narrow screen render for review.
  {
    const { page, errors } = await openPage({ width: 390, height: 844 })
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    check('no horizontal scroll at 390px', !overflow)
    check('mobile console clean', errors.length === 0, errors.join(' | '))
    await page.screenshot({ path: `${OUT}/overview-mobile.png`, fullPage: true })
    await page.close()
  }
} finally {
  await browser.close()
  await server?.close()
}

console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll smoke checks passed')
process.exit(failures.length ? 1 : 0)
