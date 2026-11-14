/**
 * Renders docs/deck/index.html (7 slides, 1920x1080) to PDF with playwright-core
 * and copies it to public/ so the live app serves /VIGIL-demo-deck.pdf.
 * Fails if the PDF does not have exactly 7 pages.
 * Usage: npm run deck
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean)
  .find((p) => existsSync(p))

const SRC = resolve('docs/deck/index.html')
const OUT = 'docs/VIGIL-demo-deck.pdf'
const browser = await chromium.launch({ executablePath })
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.goto(pathToFileURL(SRC).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const slides = await page.locator('section.slide').count()
  if (slides !== 7) throw new Error(`Deck must have exactly 7 slides, found ${slides}`)
  await page.pdf({ path: OUT, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true })
} finally {
  await browser.close()
}

const pages = (readFileSync(OUT, 'latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length
if (pages !== 7) throw new Error(`PDF has ${pages} pages, expected 7`)
copyFileSync(OUT, 'public/VIGIL-demo-deck.pdf')
console.log(`${OUT}: ${pages} pages; copied to public/VIGIL-demo-deck.pdf`)
