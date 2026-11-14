/**
 * Submission screenshots: 1920x1080, clean seeded state, no browser chrome.
 * Starts its own Vite dev server (or uses SCREENSHOT_URL) and writes
 * docs/screenshots/*.png. Re-run any time: npm run screenshots
 */
import { existsSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const OUT = 'docs/screenshots'
mkdirSync(`${OUT}/deck`, { recursive: true })
const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean)
  .find((p) => existsSync(p))

const target = process.env.SCREENSHOT_URL?.replace(/\/+$/, '')
const server = target ? null : await createServer({ server: { port: 5196, strictPort: true }, logLevel: 'error' })
await server?.listen()
const base = target ?? 'http://localhost:5196'
const browser = await chromium.launch({ executablePath })

/** Fresh seeded state; the first-visit panel is dismissed so screens show the product. */
async function freshPage() {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  await context.addInitScript(() => localStorage.setItem('vigil-start-dismissed', '1'))
  return context.newPage()
}
const crew = (page, id) => page.getByLabel('Crew member', { exact: true }).selectOption(id)
const env = (page, id) => page.getByLabel('Environment', { exact: true }).selectOption(id)
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` })
const settle = (page) => page.waitForTimeout(400)

try {
  {
    const page = await freshPage()
    await page.goto(`${base}/overview`, { waitUntil: 'networkidle' })
    await crew(page, 'crew-03')
    await settle(page)
    await shot(page, 'overview-transit')
    await env(page, 'surface-base')
    await settle(page)
    await shot(page, 'environment-surface')
    await page.context().close()
  }
  {
    const page = await freshPage()
    await page.goto(`${base}/overview`, { waitUntil: 'networkidle' })
    await crew(page, 'crew-04')
    await page.goto(`${base}/body-map?zone=immune-blood`, { waitUntil: 'networkidle' })
    await settle(page)
    await shot(page, 'body-map-arjun')

    await page.getByRole('link', { name: 'Triage', exact: true }).click()
    await page.getByTestId('alert-crew-04:coreTemperature').waitFor()
    await settle(page)
    await shot(page, 'triage-fever')


    await page.getByTestId('alert-crew-04:coreTemperature').getByRole('button', { name: /Start protocol/ }).click()
    const runner = page.locator('article', { has: page.locator('#runner-heading') })
    await runner.waitFor()
    for (const s of ['Confusion', 'Stiff neck', 'Difficulty breathing']) await runner.getByRole('group', { name: s }).getByRole('button', { name: 'No' }).click()
    await runner.getByLabel('Value (°C)').fill('37.4')
    await runner.getByLabel('Value (°C)').press('Enter')
    await runner.getByLabel('Re-measure core temperature correctly and enter it below.').check()
    for (const s of ['Stop strenuous work.', 'Rest.', 'Hydrate.']) await runner.getByLabel(s, { exact: true }).check()

    // Zoom out for this one shot so the whole runner, title to escalation, fits in 1080 px.
    await page.evaluate(() => {
      document.documentElement.style.zoom = '0.62'
      document.querySelector('#runner-heading')?.closest('article')?.scrollIntoView({ block: 'start' })
    })
    await settle(page)
    await shot(page, 'protocol-running')
    await page.evaluate(() => (document.documentElement.style.zoom = ''))

    await page.getByRole('link', { name: 'Downlink', exact: true }).click()
    await page.getByLabel(/Open questions for the flight surgeon/).fill('Temperature back to 37.4 °C after rest. Should we repeat the check overnight?')
    await page.getByRole('button', { name: 'Build brief' }).click()
    await page.getByTestId('brief-text').waitFor()
    await page.evaluate(() => document.querySelector('#brief-heading')?.scrollIntoView({ block: 'start' }))
    await settle(page)
    await shot(page, 'downlink-brief')

    await page.context().close()
  }
  {
    const page = await freshPage()
    await page.goto(`${base}/overview`, { waitUntil: 'networkidle' })
    await crew(page, 'crew-03')
    await page.goto(`${base}/routine`, { waitUntil: 'networkidle' })
    await settle(page)
    await shot(page, 'routine')
    await page.goto(`${base}/vitals`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.querySelector('#chart-sleepHours')?.closest('article')?.scrollIntoView({ block: 'center' }))
    await settle(page)
    await shot(page, 'vitals-sleep')
    await page.context().close()
  }
  // Deck crops: same fever path in a narrow 560 px viewport at 2x, so each element is legible on a slide.
  {
    const context = await browser.newContext({ viewport: { width: 560, height: 1000 }, deviceScaleFactor: 2 })
    await context.addInitScript(() => localStorage.setItem('vigil-start-dismissed', '1'))
    const page = await context.newPage()
    const crop = (loc, name) => loc.screenshot({ path: `${OUT}/deck/${name}.png` })
    await page.goto(`${base}/overview`, { waitUntil: 'networkidle' })
    await crew(page, 'crew-04')
    await page.goto(`${base}/triage`, { waitUntil: 'networkidle' })
    const alert = page.getByTestId('alert-crew-04:coreTemperature')
    await alert.waitFor()
    await crop(alert, 'alert')
    await alert.getByRole('button', { name: /Start protocol/ }).click()
    const runner = page.locator('article', { has: page.locator('#runner-heading') })
    await runner.waitFor()
    for (const s of ['Confusion', 'Stiff neck', 'Difficulty breathing']) await runner.getByRole('group', { name: s }).getByRole('button', { name: 'No' }).click()
    await runner.getByLabel('Value (°C)').fill('37.4')
    await runner.getByLabel('Value (°C)').press('Enter')
    await runner.getByLabel('Re-measure core temperature correctly and enter it below.').check()
    for (const s of ['Stop strenuous work.', 'Rest.', 'Hydrate.']) await runner.getByLabel(s, { exact: true }).check()
    await settle(page)
    await crop(runner.getByTestId('runner-current-coreTemperature').locator('xpath=..'), 'remeasure')
    await crop(runner.locator('section[aria-labelledby="phase-act"]'), 'protocol-act')
    await page.goto(`${base}/downlink`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Build brief' }).click()
    await crop(page.getByTestId('brief-text'), 'brief')
    await context.close()
  }
  console.log(`Screenshots written to ${OUT}/`)
} finally {
  await browser.close()
  await server?.close()
}
