/**
 * VIGIL walkthrough video, recorded from the live app (no app code is changed).
 *
 * One Playwright page with recordVideo (1600x900) runs the 12 scenes against
 * VIDEO_URL (default https://vigil-pandas.vercel.app) in a fresh context, so the
 * seeded demo state opens on Arjun Sethi in the dark theme. A recording-only
 * overlay (captions, click ring, spotlight, corner label) is injected with
 * page.evaluate. Title/problem/end cards are page.setContent() in the same page.
 *
 * Output: "docs/video/VIGIL walkthrough.mp4" (H.264 1920x1080, 30 fps, CRF 20, no
 * audio) and "docs/video/VIGIL walkthrough.srt", plus .tmp/video/scenes.json for
 * the still check (scripts/video/check.mjs). Usage: npm run video
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { endCard, problemCard, titleCard } from './cards.mjs'
import { findTool } from './ffmpeg.mjs'
import { installOverlay } from './overlay.mjs'
import { toSrt } from './srt.mjs'

const BASE = (process.env.VIDEO_URL ?? 'https://vigil-pandas.vercel.app').replace(/\/+$/, '')
const OUT_DIR = 'docs/video'
const MP4 = `${OUT_DIR}/VIGIL walkthrough.mp4`
const SRT = `${OUT_DIR}/VIGIL walkthrough.srt`
const RAW = '.tmp/video/raw'
const LABEL = 'Screen recording of VIGIL · captions and editing made with AI assistance (Claude) · simulated data'
const MAX_MB = 50
const CRF = Number(process.env.VIDEO_CRF ?? 20)

const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean)
  .find((p) => existsSync(p))
const ffmpeg = findTool('ffmpeg')

rmSync(RAW, { recursive: true, force: true })
mkdirSync(RAW, { recursive: true })
mkdirSync(OUT_DIR, { recursive: true })

const browser = await chromium.launch({ executablePath })
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  recordVideo: { dir: RAW, size: { width: 1600, height: 900 } },
  colorScheme: 'dark',
})
const page = await context.newPage()
const t0 = Date.now() // the video clock starts with the page
const now = () => (Date.now() - t0) / 1000
const wait = (ms) => page.waitForTimeout(ms)

const consoleErrors = []
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(`${now().toFixed(1)}s ${m.text()}`))
page.on('pageerror', (e) => consoleErrors.push(`${now().toFixed(1)}s ${e.message}`))

// --- timeline log ---------------------------------------------------------
const captions = [] // { text, start, end }
const scenes = [] // { name, start, end }
let open = null
const closeCaption = () => {
  if (open) open.end = now()
  open = null
}
const ensureOverlay = () => page.evaluate(installOverlay, { label: LABEL })

/** Show a caption (keywords in *asterisks*) and hold it long enough to read (>= 3.5 s). */
async function say(text, holdMs = 4000) {
  await ensureOverlay()
  closeCaption()
  await page.evaluate((t) => window.__rec.caption(t), text)
  open = { text: text.replace(/\*/g, ''), start: now(), end: null }
  captions.push(open)
  await wait(Math.max(holdMs, 3500))
}
/** Add a caption-track entry for text that is part of a card (shown on the card itself). */
function cardText(text, start, end) {
  captions.push({ text, start, end })
}
async function quiet() {
  closeCaption()
  await page.evaluate(() => window.__rec?.caption('')).catch(() => {})
}
function scene(name) {
  if (scenes.length) scenes.at(-1).end = now()
  scenes.push({ name, start: now(), end: null })
}

/** Smoothly bring an element into view, then let the scroll finish. */
async function reveal(locator, block = 'center') {
  await locator.evaluate((el, b) => el.scrollIntoView({ behavior: 'smooth', block: b }), block)
  await wait(900)
}
/** Click with a visible ring where the click lands. */
async function click(locator, after = 1200) {
  await locator.scrollIntoViewIfNeeded()
  const b = await locator.boundingBox()
  await ensureOverlay()
  await page.evaluate(([x, y]) => window.__rec.ring(x, y), [b.x + b.width / 2, b.y + b.height / 2])
  await wait(260)
  await locator.click()
  await wait(after)
}
async function spot(locator) {
  const b = await locator.boundingBox()
  await page.evaluate((r) => window.__rec.spot(r), b)
}
const unspot = () => page.evaluate(() => window.__rec?.spot(null))
async function nav(name) {
  await click(page.getByRole('link', { name, exact: true }), 300)
  await page.locator('h1').first().waitFor()
  await wait(1300)
}

try {
  // 1. Title card (0:00-0:08)
  await page.setContent(titleCard())
  await page.evaluate(() => document.fonts.ready)
  await ensureOverlay()
  const trim = now() // everything before this is a blank page
  scene('01-title')
  const titleStart = now()
  await wait(7800)
  cardText('VIGIL: Health monitoring a crew can act on when Earth is minutes away. Pandanauts, NASA Space Apps Challenge 2026', titleStart, now())

  // 2. Problem card (0:08-0:20)
  await page.setContent(problemCard())
  await page.evaluate(() => document.fonts.ready)
  await ensureOverlay()
  scene('02-problem')
  const p1 = now()
  await wait(4800)
  cardText('On the way to Mars, a message to Earth takes up to 22 minutes, one way.', p1, now())
  await page.evaluate(() => document.getElementById('second').classList.add('in'))
  const p2 = now()
  await wait(7000)
  cardText('Five hazards: radiation, isolation, distance, gravity, closed environments. Most astronauts are not doctors.', p2, now())

  // 3. Overview (0:20-0:42)
  await page.goto(`${BASE}/overview`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await ensureOverlay()
  scene('03-overview')
  await wait(1200)
  await spot(page.getByTestId('crew-alerts'))
  await say('*Crew alerts* show who needs help at a glance.', 4200)
  await spot(page.locator('[data-tour="comm"]'))
  await say('*Earth signal* and the *Crew-autonomous* badge: how far help is.', 4600)
  await unspot()
  await spot(page.getByTestId('attention-now'))
  await say('*Attention now*: Arjun has a *38.3 °C fever*.', 4300)
  await unspot()
  await reveal(page.getByTestId('crew-glance'))
  await spot(page.getByTestId('crew-glance').getByRole('button').nth(2))
  await say('Mei has been *losing sleep* since day 22.', 4300)
  await unspot()
  await quiet()

  // 4. Body Map (0:42-1:02)
  await nav('Body Map')
  scene('04-body-map')
  await click(page.locator('ul[aria-labelledby="zones-heading"] button', { hasText: 'Immune system and blood' }), 900)
  await say('Each body system takes the *worst status* of its readings, linked to *NASA’s named risks*.', 6600)
  await click(page.locator('ul[aria-labelledby="zones-heading"] button', { hasText: 'Eyes' }), 900)
  await reveal(page.getByRole('heading', { name: 'What is SANS?' }), 'center')
  await say('Eyes: *SANS*, a NASA-named spaceflight risk.', 5200)
  await quiet()

  // 5. Vitals (1:02-1:15)
  await nav('Vitals')
  scene('05-vitals')
  const hr = page.locator('article', { has: page.getByRole('heading', { name: 'Heart rate', exact: true }) }).first()
  await reveal(hr, 'start')
  await say('*30-day trends* with the safe range shaded.', 4000)
  await click(hr.getByRole('button', { name: 'Threshold sources' }), 700)
  await say('Every threshold shows its *source*.', 4000)
  await quiet()

  // 6. Triage and the fever protocol (1:15-1:50)
  await nav('Triage')
  scene('06-triage')
  await say('Problems sorted, *most urgent first*.', 3800)
  await quiet()
  const fever = page.getByTestId('alert-crew-04:coreTemperature')
  await click(fever.getByRole('button', { name: /Start protocol/ }), 900)
  const runner = page.locator('article', { has: page.locator('#runner-heading') })
  await runner.waitFor()
  await reveal(page.locator('#runner-heading'), 'start')
  await say('Four steps: *confirm*, *check danger signs*, *act*, *escalate*.', 4300)
  for (const flag of ['Confusion', 'Stiff neck', 'Difficulty breathing']) await click(runner.getByRole('group', { name: flag }).getByRole('button', { name: 'No' }), 500)
  const value = runner.getByLabel('Value (°C)')
  await reveal(value, 'center')
  await click(runner.getByLabel('Re-measure core temperature correctly and enter it below.'), 400)
  await value.fill('37.4')
  await wait(500)
  await click(runner.getByRole('button', { name: 'Save reading' }), 700)
  await reveal(runner.getByTestId('runner-current-coreTemperature'), 'center')
  await spot(runner.getByTestId('runner-current-coreTemperature'))
  await say('Re-measured: *37.4 °C*. Status turns *green*.', 4000)
  await unspot()
  for (const step of ['Stop strenuous work.', 'Rest.', 'Hydrate.']) await click(runner.getByLabel(step, { exact: true }), 450)
  await reveal(runner.getByTestId('escalation'), 'start')
  await spot(runner.getByTestId('escalation'))
  await say('On the way to Mars, Earth’s reply is up to *44.6 minutes* away, so the *crew acts first*.', 5800)
  await unspot()
  await quiet()

  // 7. Downlink (1:50-2:05)
  await nav('Downlink')
  scene('07-downlink')
  await click(page.getByRole('button', { name: 'Build brief' }), 900)
  await reveal(page.getByTestId('brief-text'), 'start')
  await say('Everything done, *timestamped*, in a few kilobytes for *Earth’s doctors*.', 6500)
  await quiet()

  // 8. Orbital Station (2:05-2:20)
  await nav('Overview')
  scene('08-orbital-station')
  const envSelect = page.getByLabel('Environment', { exact: true })
  await click(envSelect, 200)
  await page.keyboard.press('Escape')
  await envSelect.selectOption('orbital-station')
  await wait(900)
  await spot(page.locator('[data-tour="comm"]'))
  await say('Near Earth, the advice changes: *Ground-guided*, reply in *under 2 seconds*.', 5000)
  await unspot()
  await reveal(page.getByTestId('hazard-priority'), 'start')
  await spot(page.getByTestId('hazard-priority'))
  await say('Hazards are *re-ranked* for the station, and *radiation days remaining* change.', 4500)
  await unspot()
  await quiet()

  // 9. Routine (2:20-2:30)
  await nav('Routine')
  scene('09-routine')
  await say('Daily prevention: *exercise*, *sleep*, *check-ins*, *streaks*.', 6800)
  await quiet()

  // 10. Offline (2:30-2:42)
  scene('10-offline')
  // The service worker has been precaching since the first visit; make sure it controls the page.
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 30000 })
  await context.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('h1').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  await ensureOverlay()
  await page.locator('[data-testid="connection-badge"][data-kind="offline"]').waitFor()
  await spot(page.getByTestId('connection-badge'))
  await say('Wi-Fi off: *Offline: running on device*.', 3800)
  await unspot()
  await nav('Triage')
  await say('No connection to Earth needed. VIGIL *runs on the device*.', 4200)
  await quiet()

  // 11. Sources (2:42-2:48)
  await nav('Sources')
  scene('11-sources')
  await say('Built on *NASA data* and published health guidelines.', 4600)
  await quiet()

  // 12. End card (2:48-2:55)
  await page.setContent(endCard())
  await page.evaluate(() => document.fonts.ready)
  await ensureOverlay()
  scene('12-end')
  const e0 = now()
  await wait(7000)
  cardText('vigil-pandas.vercel.app · github.com/Kuraam/vigil. Concept demonstration with simulated data. Not a medical device.', e0, now())
  scenes.at(-1).end = now()

  // Close the context to finish the video file.
  const video = page.video()
  await context.close()
  const raw = await video.path()

  // --- find where the title card starts in the raw video ----------------------------
  // The recording starts before the page clock (t0), so the blank lead-in is longer than `trim`.
  // The lead-in is a blank dark page; the title card is the first frame with content.
  // Every timestamp is then shifted by the same offset (the video and page clocks run at the same rate).
  const probe = spawnSync(ffmpeg, ['-hide_banner', '-i', raw, '-vf', 'blackdetect=d=0.2:pix_th=0.12', '-an', '-f', 'null', '-'], { encoding: 'utf8' })
  const lead = probe.stderr.match(/black_start:0(?:\.0+)? black_end:([\d.]+)/)
  const videoStart = lead ? Number(lead[1]) : trim
  const offset = videoStart - trim // add to a page-clock time to get the raw-video time
  console.log(`Title card starts at ${videoStart.toFixed(2)} s in the raw video (page clock ${trim.toFixed(2)} s, offset ${offset.toFixed(2)} s)`)

  // --- encode -----------------------------------------------------------------
  const encode = (crf) =>
    execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-ss', videoStart.toFixed(2), '-t', (scenes.at(-1).end - trim).toFixed(2), '-i', raw, '-vf', 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-an', '-movflags', '+faststart', MP4], { stdio: 'inherit' })
  let crf = CRF
  encode(crf)
  while (statSync(MP4).size > MAX_MB * 1024 * 1024 && crf < 32) {
    crf += 2
    console.log(`MP4 over ${MAX_MB} MB; re-encoding at CRF ${crf}`)
    encode(crf)
  }

  // --- captions (SRT) and scene log, relative to the trimmed video --------------
  writeFileSync(SRT, toSrt(captions.map((c) => ({ text: c.text, start: c.start - trim, end: (c.end ?? c.start + 4) - trim }))))
  writeFileSync('.tmp/video/scenes.json', JSON.stringify({ trim, scenes: scenes.map((s) => ({ ...s, start: s.start - trim, end: s.end - trim })), captions: captions.map((c) => ({ ...c, start: c.start - trim, end: c.end - trim })), consoleErrors, crf }, null, 2))

  console.log(`\n${MP4}: ${(statSync(MP4).size / 1024 / 1024).toFixed(1)} MB at CRF ${crf}`)
  console.log(`${SRT}: ${captions.length} captions`)
  console.log(`Scenes: ${scenes.map((s) => `${s.name} ${(s.start - trim).toFixed(1)}s`).join(', ')}`)
  console.log(consoleErrors.length ? `Console errors:\n  ${consoleErrors.join('\n  ')}` : 'No console errors during the run.')
  if (consoleErrors.length) process.exitCode = 1
} finally {
  await browser.close()
}
