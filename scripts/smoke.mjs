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
  { path: '/overview', heading: 'Arjun Sethi' },
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
    check(`${path} renders Overview`, (await page.locator('h1').first().textContent())?.trim() === 'Arjun Sethi')
    check(`${path} console clean`, errors.length === 0, errors.join(' | '))
    await page.close()
  }

  // 3. Selectors change global state, and the choice survives a reload (localStorage).
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    await page.getByLabel('Crew member', { exact: true }).selectOption('crew-03')
    check('crew select updates Overview', (await page.locator('h1').textContent())?.trim() === 'Mei Tanaka-Ross')
    // Environment drives comm delay and the radiation rate / days remaining.
    const rate = () => page.getByTestId('dose-rate').textContent()
    const days = () => page.getByTestId('dose-days').textContent()
    const transit = { rate: await rate(), days: await days() }
    await page.getByLabel('Environment', { exact: true }).selectOption('surface-base')
    const surface = { rate: await rate(), days: await days() }
    check('environment changes radiation rate', transit.rate?.includes('1.84') && surface.rate?.includes('0.64'), `${transit.rate} -> ${surface.rate}`)
    check('environment changes days remaining', transit.days !== surface.days, `${transit.days} -> ${surface.days}`)
    await page.getByLabel('Environment', { exact: true }).selectOption('orbital-station')
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
    await page.getByLabel('Crew member', { exact: true }).selectOption('crew-03')
    check('FE sleep debt shows Action', (await chip('Sleep')) === 'Action', await chip('Sleep'))
    await page.getByLabel('Crew member', { exact: true }).selectOption('crew-04')
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
    await page.getByRole('link', { name: 'Overview', exact: true }).click()
    await page.waitForURL('**/overview')
    const hr = page.locator('article', { has: page.getByRole('heading', { name: 'Heart rate', exact: true }) })
    check('Overview shows the logged reading', (await hr.textContent())?.includes('130') ?? false)
    await page.getByRole('link', { name: 'Body Map', exact: true }).click()
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
    await page.getByLabel('Environment', { exact: true }).selectOption('surface-base')
    const after = await envText()
    check('environment changes zone risk text', before !== after && (after?.includes('three-eighths') ?? false), after?.slice(0, 60))
    check('zone deep link in URL', page.url().includes('zone=bones-muscles'), page.url())
    await page.screenshot({ path: `${OUT}/body-map-bones.png`, fullPage: true })
    check('body map console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // END-TO-END: Mission Specialist -> fever alert -> protocol -> re-measure -> status updates -> brief has the steps.
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    await page.getByLabel('Crew member', { exact: true }).selectOption('crew-04')
    await page.getByRole('link', { name: 'Triage', exact: true }).click()
    await page.waitForURL('**/triage')
    const fever = page.getByTestId('alert-crew-04:coreTemperature')
    await fever.waitFor({ timeout: 5000 }).catch(() => {})
    check('E2E: Triage shows the fever alert', (await fever.count()) === 1 && ((await fever.textContent()) ?? '').includes('38.3'))
    const firstAlert = await page.locator('[data-testid^="alert-"]').first().getAttribute('data-testid')
    check('E2E: fever (action) is first in the queue', firstAlert === 'alert-crew-04:coreTemperature', firstAlert)
    await page.screenshot({ path: `${OUT}/triage-ms.png`, fullPage: true })
    await fever.getByRole('button', { name: /Start protocol/ }).click()
    const runner = page.locator('article', { has: page.locator('#runner-heading') })
    await runner.waitFor({ timeout: 5000 })
    check('E2E: protocol runner opens', (await page.locator('#runner-heading').textContent())?.trim() === 'Fever / high core temperature')
    check('E2E: protocol carries the demonstration label', (await runner.textContent())?.includes('Concept guidance for demonstration. Not medical advice.') ?? false)
    await runner.getByRole('group', { name: 'Confusion' }).getByRole('button', { name: 'No' }).click()
    const input = runner.getByLabel('Value (°C)')
    await input.fill('37.4')
    await input.press('Enter')
    const current = runner.getByTestId('runner-current-coreTemperature')
    await page.waitForFunction(() => document.querySelector('[data-testid="runner-current-coreTemperature"]')?.textContent?.includes('37.4'), null, { timeout: 5000 }).catch(() => {})
    check('E2E: re-measured temperature shows in the runner', (await current.textContent())?.includes('37.4') ?? false, await current.textContent())
    check('E2E: status updates to Nominal', (await current.textContent())?.includes('Nominal') ?? false)
    check('E2E: fever alert leaves the queue', (await page.getByTestId('alert-crew-04:coreTemperature').count()) === 0)
    await runner.getByLabel('Rest.', { exact: true }).check()
    await runner.getByLabel('Re-measure core temperature correctly and enter it below.').check()
    check('E2E: step records a mission timestamp', /Done Day 30, \d\d:\d\d:\d\d/.test((await runner.textContent()) ?? ''))
    check('E2E: escalation shows crew-autonomous rule in transit', (await runner.getByTestId('escalation').textContent())?.includes('Crew-autonomous first') ?? false)
    await page.screenshot({ path: `${OUT}/protocol-running.png`, fullPage: true })

    // Resume: start the heart-rate protocol, tick a step, leave, come back.
    await page.getByRole('button', { name: 'Back to alert queue' }).click()
    const hr = page.getByTestId('alert-crew-04:heartRate')
    await hr.getByRole('button', { name: /Start protocol/ }).click()
    await page.locator('#runner-heading', { hasText: 'High heart rate' }).waitFor({ timeout: 5000 })
    await page.locator('article', { has: page.locator('#runner-heading') }).getByLabel('Hydrate.', { exact: true }).check()
    await page.getByRole('link', { name: 'Overview', exact: true }).click()
    await page.waitForURL('**/overview')
    await page.getByRole('link', { name: 'Triage', exact: true }).click()
    await page.waitForURL('**/triage')
    const resume = page.getByTestId('alert-crew-04:heartRate').getByRole('button', { name: /Resume protocol \(1\// })
    check('E2E: unfinished protocol can be resumed', (await resume.count()) === 1)

    await page.getByRole('link', { name: 'Downlink', exact: true }).click()
    await page.waitForURL('**/downlink')
    await page.getByRole('button', { name: 'Build brief' }).click()
    const brief = (await page.getByTestId('brief-text').textContent()) ?? ''
    check('E2E: brief contains the protocol', brief.includes('Fever / high core temperature'))
    check('E2E: brief has timestamped re-measure', /Day 30, \d\d:\d\d:\d\d  Re-measured: Core temperature 37\.4 °C/.test(brief))
    check('E2E: brief has timestamped steps', /Day 30, \d\d:\d\d:\d\d  Rest\./.test(brief) && /Red flag "Confusion": no/.test(brief))
    check('E2E: brief shows size and arrival time', /KB plain text\. Arrives at Earth in approximately up to 22\.3 min/.test((await page.getByTestId('brief-meta').textContent()) ?? ''))
    check('E2E: brief labelled simulated', brief.includes('Simulated data. Concept demonstration.'))
    await page.screenshot({ path: `${OUT}/downlink-brief.png`, fullPage: true })
    check('E2E console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // Environment priorities, escalation badge, Routine and due-now count.
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    const badge = page.getByTestId('escalation-badge')
    const firstHazard = async () => (await page.getByTestId('hazard-priority').locator('li').first().textContent()) ?? ''
    check('transit: crew-autonomous badge, radiation ranked first', (await badge.textContent())?.trim() === 'Crew-autonomous' && (await firstHazard()).includes('Space Radiation'))
    await page.getByLabel('Environment', { exact: true }).selectOption('orbital-station')
    check('station: ground-guided badge, gravity ranked first', (await badge.textContent())?.trim() === 'Ground-guided' && (await firstHazard()).includes('Gravity Fields'))
    const due = page.getByRole('link', { name: /routine tasks? due now/ })
    const dueBefore = Number((await due.textContent())?.match(/\d+/)?.[0])
    check('due-now count shown', dueBefore > 0, String(dueBefore))
    await due.click()
    await page.waitForURL('**/routine')
    const firstTask = (await page.getByTestId('routine-checklist').locator('li').first().textContent()) ?? ''
    check('Routine priority follows top hazard (station: exercise first)', firstTask.includes('Exercise session'), firstTask.slice(0, 40))
    await page.getByLabel(/^Exercise session/).check()
    const dueAfter = Number((await page.getByRole('link', { name: /routine tasks? due now/ }).textContent())?.match(/\d+/)?.[0])
    check('ticking a task lowers the due-now count', dueAfter === dueBefore - 1, `${dueBefore} -> ${dueAfter}`)
    await page.screenshot({ path: `${OUT}/routine-station.png`, fullPage: true })
    check('routine console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // FIRST VISIT: Start here panel and the full 6-stop tour (keyboard driven).
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    check('Start here panel shows on first visit', await page.getByTestId('start-here').isVisible())
    await page.getByRole('button', { name: 'Take the 60-second tour' }).click()
    const panel = page.getByTestId('tour-panel')
    const stops = [
      { title: 'Overview and signal delay', path: '/overview', target: 'comm' },
      { title: 'The environment changes the priorities', path: '/overview', target: 'environment' },
      { title: 'Body Map', path: '/body-map', target: 'body-map' },
      { title: 'Triage and the fever protocol', path: '/triage', target: 'triage-queue' },
      { title: 'Downlink brief', path: '/downlink', target: 'downlink-build' },
      { title: 'Sources', path: '/sources', target: 'sources-about' },
    ]
    for (const [i, s] of stops.entries()) {
      await page.locator('#tour-title', { hasText: s.title }).waitFor({ timeout: 5000 }).catch(() => {})
      await page.locator(`.tour-highlight[data-tour="${s.target}"]`).waitFor({ timeout: 5000 }).catch(() => {})
      const ok =
        (await page.locator('#tour-title').textContent())?.trim() === s.title &&
        new URL(page.url()).pathname === s.path &&
        (await page.locator(`.tour-highlight[data-tour="${s.target}"]`).count()) === 1
      check(`tour stop ${i + 1}: ${s.title}`, ok, page.url())
      if (i === 1) {
        const ranking = (await page.getByTestId('hazard-priority').locator('li').first().textContent()) ?? ''
        check('tour stop 2 switched to Surface Base (gravity ranked first)', ranking.includes('Gravity Fields'))
      }
      if (i === 2) check('tour stop 3 opens Arjun, immune system and blood', page.url().includes('zone=immune-blood') && ((await page.locator('#zone-heading').textContent()) ?? '').includes('Immune system and blood'))
      // Drive the tour with the keyboard: focus Next/Finish and press Enter.
      await panel.getByRole('button', { name: i === stops.length - 1 ? 'Finish tour' : 'Next' }).focus()
      await page.keyboard.press('Enter')
    }
    check('tour finishes and closes', (await panel.count()) === 0)
    await page.getByRole('button', { name: 'Take the tour' }).click()
    await panel.waitFor({ timeout: 3000 })
    await page.keyboard.press('Escape')
    check('Escape skips the tour', (await panel.count()) === 0)
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    check('Start here stays dismissed after starting the tour', (await page.getByTestId('start-here').count()) === 0)
    check('tour console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // RESET: change demo state, then restore the seeded state through the confirm dialog.
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/vitals', { waitUntil: 'networkidle' })
    await page.getByLabel('Crew member', { exact: true }).selectOption('crew-02')
    const card = page.locator('article', { has: page.getByRole('heading', { name: 'Heart rate', exact: true }) })
    await card.getByRole('button', { name: 'Log heart rate reading' }).click()
    await card.getByLabel('Value (bpm)').fill('150')
    await card.getByLabel('Value (bpm)').press('Enter')
    await page.getByRole('link', { name: 'Sources', exact: true }).click()
    await page.waitForURL('**/sources')
    await page.getByRole('button', { name: 'Reset demo data' }).click()
    check('reset asks for confirmation', await page.getByRole('dialog', { name: 'Reset demo data?' }).isVisible())
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
    check('cancel keeps changes', (await page.getByLabel('Crew member', { exact: true }).inputValue()) === 'crew-02')
    await page.getByRole('button', { name: 'Reset demo data' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Reset', exact: true }).click()
    check('reset restores default crew (Arjun Sethi)', (await page.getByLabel('Crew member', { exact: true }).inputValue()) === 'crew-04')
    check('reset confirms in a status message', (await page.getByTestId('reset-demo').textContent())?.includes('Demo data reset') ?? false)
    await page.getByLabel('Crew member', { exact: true }).selectOption('crew-02')
    await page.getByRole('link', { name: 'Overview', exact: true }).click()
    const hr = page.locator('article', { has: page.getByRole('heading', { name: 'Heart rate', exact: true }) })
    check('reset removed the logged reading', !((await hr.textContent()) ?? '').includes('150'), await hr.textContent())
    check('reset console clean', errors.length === 0, errors.join(' | '))
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

  // UI POLISH: crew attention, no blank screens, Body Map fit and hover, alert sources, Start here, Downlink preview.
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    // First visit opens on the fever case, with the Attention now strip.
    check('first visit selects Arjun Sethi', (await page.getByLabel('Crew member', { exact: true }).inputValue()) === 'crew-04')
    const strip = page.getByTestId('attention-now')
    const stripText = (await strip.textContent()) ?? ''
    check('Attention now shows the fever and its threshold', stripText.includes('38.3') && stripText.includes('Fever: 38.0 °C or higher') && stripText.includes('CDC fever definition'), stripText.slice(0, 80))
    // Top bar crew indicator: counts, worst-status icon and words, opens whole-crew Triage.
    const indicator = page.getByTestId('crew-alerts')
    const indText = ((await indicator.textContent()) ?? '').replace(/\s+/g, ' ')
    check('top bar crew indicator shows Action and Watch counts', /Crew: \d+ Action · \d+ Watch/.test(indText), indText)
    // Crew at a glance: four cards; choosing one selects that crew member.
    const cards = page.getByTestId('crew-glance').getByRole('button')
    check('Crew at a glance shows 4 crew cards', (await cards.count()) === 4)
    check('Arjun card names the top issue', ((await cards.nth(3).textContent()) ?? '').includes('Core temperature 38.3'))
    await cards.nth(2).click()
    check('crew card selects that crew member', (await page.locator('h1').textContent())?.trim() === 'Mei Tanaka-Ross')
    check('Attention now follows the selection (sleep debt)', ((await page.getByTestId('attention-now').textContent()) ?? '').includes('Sleep'))
    await cards.nth(3).click()
    await indicator.click()
    await page.waitForURL('**/triage?view=crew-all')
    check('crew indicator opens Triage in whole-crew view', (await page.getByRole('button', { name: 'Whole crew' }).getAttribute('aria-pressed')) === 'true')
    // Triage cards: crossed-tier source only, full sources behind a disclosure, filled button for Action.
    const fever = page.getByTestId('alert-crew-04:coreTemperature')
    const src = (await fever.getByTestId('alert-source').textContent()) ?? ''
    check('fever alert cites the CDC fever definition only', src.includes('CDC fever definition') && !src.includes('hypothermia'), src)
    check('full sources are hidden until opened', !(await fever.getByText('clinical definition of hypothermia').isVisible()))
    await fever.getByRole('button', { name: 'Sources' }).click()
    check('Sources disclosure lists every threshold source', await fever.getByText('clinical definition of hypothermia').isVisible())
    const cls = (await fever.getByRole('button', { name: /Start protocol/ }).getAttribute('class')) ?? ''
    check('Action alert has a filled Start protocol button', cls.includes('bg-accent'))
    check('Action alert card has the red accent bar', ((await fever.getAttribute('class')) ?? '').includes('border-l-action'))
    // Attention now → Start protocol opens the fever runner.
    await page.getByRole('link', { name: 'Overview', exact: true }).click()
    await page.waitForURL('**/overview')
    await page.getByTestId('attention-now').getByRole('button', { name: /Start protocol/ }).click()
    await page.waitForURL(/\/triage\?run=/)
    await page.locator('#runner-heading').waitFor({ timeout: 5000 }).catch(() => {})
    check('Attention now opens the fever protocol in Triage', (await page.locator('#runner-heading').textContent())?.trim() === 'Fever / high core temperature')
    // Downlink: a checklist with live counts before the brief is built.
    await page.getByRole('link', { name: 'Downlink', exact: true }).click()
    await page.waitForURL('**/downlink')
    const preview = (await page.getByTestId('brief-preview').textContent()) ?? ''
    check('Downlink preview lists alerts, runs and trends', /1 Action alert, 2 Watch/.test(preview) && /1 protocol run/.test(preview) && /7-day trends for \d+ vitals/.test(preview), preview.slice(0, 120))
    check('Downlink preview shows the arrival estimate', /Arrives at Earth in approximately up to 22\.3 min/.test((await page.getByTestId('brief-eta').textContent()) ?? ''))
    await page.getByRole('button', { name: 'Build brief' }).click()
    check('preview gives way to the built brief', (await page.getByTestId('brief-preview').count()) === 0 && (await page.getByTestId('brief-text').count()) === 1)
    // Footer is in the page flow, never covering content.
    check('footer is not fixed or sticky', (await page.locator('footer').evaluate((el) => getComputedStyle(el).position)) === 'static')
    check('scrollbar gutter is reserved', (await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter)).includes('stable'))
    check('polish console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // Start here tiles are links.
  {
    const { page, errors } = await openPage()
    await page.goto(base + '/overview', { waitUntil: 'networkidle' })
    const tiles = page.getByTestId('start-here').getByRole('link')
    check('Start here has 3 question links', (await tiles.count()) === 3)
    await tiles.nth(1).click()
    await page.waitForURL('**/body-map')
    check('"Why does it matter here?" opens Body Map', await page.locator('h1', { hasText: 'Body Map' }).waitFor({ timeout: 5000 }).then(() => true, () => false))
    await page.goBack()
    await page.locator('h1', { hasText: 'Arjun Sethi' }).waitFor({ timeout: 5000 })
    await page.getByTestId('start-here').getByRole('link').nth(2).click()
    await page.waitForURL('**/triage')
    check('"What do I do now?" opens Triage', await page.locator('h1', { hasText: 'Triage' }).waitFor({ timeout: 5000 }).then(() => true, () => false))
    await page.goBack()
    await page.locator('h1', { hasText: 'Arjun Sethi' }).waitFor({ timeout: 5000 })
    await page.getByTestId('start-here').getByRole('link').nth(0).click()
    check('"What is my status?" focuses the readings', (await page.evaluate(() => document.activeElement?.id)) === 'readings-heading')
    check('start-here console clean', errors.length === 0, errors.join(' | '))
    await page.evaluate(() => localStorage.clear())
    await page.close()
  }

  // No blank screens: while a page chunk loads, the shell stays and the content area shows a skeleton.
  {
    const { page, errors } = await openPage()
    let release
    const gate = new Promise((r) => (release = r))
    await page.route(/VitalsPage/, async (route) => {
      await gate
      await route.continue()
    })
    await page.goto(base + '/vitals', { waitUntil: 'domcontentloaded' })
    await page.getByTestId('page-skeleton').waitFor({ timeout: 8000 }).catch(() => {})
    check('shell stays rendered while a page loads', (await page.getByRole('banner').count()) === 1 && (await page.getByRole('navigation', { name: 'Primary' }).count()) === 1 && (await page.locator('footer').count()) === 1)
    check('content area shows a skeleton while loading', (await page.getByTestId('page-skeleton').count()) === 1)
    release()
    await page.locator('h1', { hasText: 'Vitals' }).waitFor({ timeout: 8000 }).catch(() => {})
    check('page replaces the skeleton when loaded', (await page.getByTestId('page-skeleton').count()) === 0 && (await page.locator('h1').textContent())?.trim() === 'Vitals')
    const legend = (await page.locator('article', { has: page.getByRole('heading', { name: 'Heart rate', exact: true }) }).getByTestId('chart-legend').textContent()) ?? ''
    check('chart reference lines are named in a legend', legend.includes('Personal baseline') && legend.includes('Action above 120'), legend)
    check('skeleton console clean', errors.length === 0, errors.join(' | '))
    await page.close()
  }

  // Body Map figure fits the screen and names the zone under the pointer or focus.
  for (const viewport of [{ width: 1366, height: 645 }, { width: 1440, height: 900 }]) {
    const { page, errors } = await openPage(viewport)
    await page.goto(base + '/body-map', { waitUntil: 'networkidle' })
    const box = await page.locator('svg[viewBox="0 0 200 460"]').boundingBox()
    check(`Body Map figure fully visible at ${viewport.width}x${viewport.height}`, !!box && box.y >= 0 && box.y + box.height <= viewport.height, JSON.stringify(box))
    if (viewport.width === 1366) {
      await page.getByRole('button', { name: /^Lungs/ }).hover()
      check('hovering a zone names it beside the figure', ((await page.getByTestId('zone-hover-label').textContent()) ?? '').includes('Lungs'))
      await page.getByRole('button', { name: /^Eyes/ }).focus()
      check('focusing a zone names it beside the figure', ((await page.getByTestId('zone-hover-label').textContent()) ?? '').includes('Eyes'))
      await page.locator('[data-zone="gut-nutrition"]').click()
      await page.locator('#zone-heading', { hasText: 'Gut and nutrition' }).waitFor({ timeout: 5000 }).catch(() => {})
      check('clicking a figure zone selects it', (await page.locator('#zone-heading').textContent())?.trim() === 'Gut and nutrition')
      check('selected zone pulses', (await page.locator('g[data-zone="gut-nutrition"]').getAttribute('class'))?.includes('zone-pulse') ?? false)
    }
    check(`body map fit console clean ${viewport.width}`, errors.length === 0, errors.join(' | '))
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
