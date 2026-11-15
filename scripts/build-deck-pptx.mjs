/**
 * Editable PowerPoint version of the demo deck.
 *
 * Renders docs/deck/index.html (the source of the official PDF) in Chrome, measures
 * every text block, card and image on each 1920x1080 slide, and rebuilds them with
 * pptxgenjs at the same positions: text as editable text boxes (same words, fonts,
 * sizes and colours), cards as shapes, and the existing screenshots as images
 * (cropped exactly as shown on the slide). 1920 px = 13.333 in, so 1 px = 0.5 pt.
 *
 * Then checks the result: exactly 7 slides, and each slide's text matches the text
 * of the same page in docs/VIGIL-demo-deck.pdf (the PDF itself is never modified).
 *
 * Writes "docs/VIGIL Demo Deck.pptx" and public/VIGIL-demo-deck.pptx.
 * Usage: npm run deck:pptx
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { inflateSync } from 'node:zlib'
import JSZip from 'jszip'
import { chromium } from 'playwright-core'
import PptxGenJS from 'pptxgenjs'

const SRC = resolve('docs/deck/index.html')
const PDF = 'docs/VIGIL-demo-deck.pdf'
const OUT = 'docs/VIGIL Demo Deck.pptx'
const PUBLIC_OUT = 'public/VIGIL-demo-deck.pptx'
const TMP = '.tmp/deck-pptx'
const PX = 13.333 / 1920 // inches per CSS pixel
const PT = 0.5 // points per CSS pixel

const executablePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean)
  .find((p) => existsSync(p))

// ---------------------------------------------------------------------------
// 1. Measure the HTML deck.
// ---------------------------------------------------------------------------
rmSync(TMP, { recursive: true, force: true })
mkdirSync(TMP, { recursive: true })
const browser = await chromium.launch({ executablePath })
let slides
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
  await page.goto(pathToFileURL(SRC).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  // One slide per screen, so element screenshots and coordinates are slide-relative.
  await page.addStyleTag({ content: 'section.slide { display: none !important } section.slide.cur { display: flex !important }' })
  const count = await page.locator('section.slide').count()
  if (count !== 7) throw new Error(`Deck must have 7 slides, found ${count}`)
  slides = []
  for (let i = 0; i < count; i++) {
    await page.evaluate((n) => document.querySelectorAll('section.slide').forEach((s, j) => s.classList.toggle('cur', j === n)), i)
    const data = await page.evaluate(() => {
      const slide = document.querySelector('section.slide.cur')
      const rgbHex = (c) => {
        const m = c.match(/\d+(\.\d+)?/g)
        if (!m) return null
        if (m.length === 4 && Number(m[3]) === 0) return null
        return m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase()
      }
      const box = (el) => {
        const r = el.getBoundingClientRect()
        return { x: r.left, y: r.top, w: r.width, h: r.height }
      }
      const style = (el) => {
        const cs = getComputedStyle(el)
        const size = parseFloat(cs.fontSize)
        return {
          face: cs.fontFamily.includes('Mono') ? 'IBM Plex Mono' : 'IBM Plex Sans',
          size,
          color: rgbHex(cs.color),
          bold: Number(cs.fontWeight) >= 600,
          spacing: cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing),
          lineHeight: cs.lineHeight === 'normal' ? size * 1.3 : parseFloat(cs.lineHeight),
        }
      }
      const out = { bg: rgbHex(getComputedStyle(slide).backgroundColor), shapes: [], texts: [], images: [], bullets: [] }
      // Cards and hazard tiles.
      for (const el of slide.querySelectorAll('.card, .hazards > div')) {
        const cs = getComputedStyle(el)
        out.shapes.push({ ...box(el), fill: rgbHex(cs.backgroundColor), line: rgbHex(cs.borderTopColor), lineW: parseFloat(cs.borderTopWidth), radius: parseFloat(cs.borderTopLeftRadius) })
      }
      // Square bullets drawn by ul.clean li::before.
      for (const li of slide.querySelectorAll('ul.clean li')) {
        const b = getComputedStyle(li, '::before')
        const r = li.getBoundingClientRect()
        out.bullets.push({ x: r.left + parseFloat(b.left), y: r.top + parseFloat(b.top), w: parseFloat(b.width), h: parseFloat(b.height), fill: rgbHex(b.backgroundColor) })
      }
      // Text blocks: elements with their own text; inline children become runs.
      const hasOwnText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
      const done = new Set()
      for (const el of slide.querySelectorAll('*')) {
        if (done.has(el) || el.tagName === 'IMG' || !hasOwnText(el)) continue
        if ([...done].some((d) => d.contains(el))) continue
        done.add(el)
        const runs = []
        const walk = (node, inherited) => {
          for (const n of node.childNodes) {
            if (n.nodeType === 3) {
              const t = n.textContent.replace(/\s+/g, ' ')
              if (t) runs.push({ text: t, ...inherited })
            } else if (n.nodeType === 1) walk(n, style(n))
          }
        }
        walk(el, style(el))
        if (runs.length) {
          runs[0].text = runs[0].text.trimStart()
          runs[runs.length - 1].text = runs[runs.length - 1].text.trimEnd()
        }
        out.texts.push({ ...box(el), ...style(el), runs })
      }
      return out
    })
    // Images: screenshot each one as displayed (crop, border and rounded corners included).
    const imgs = page.locator('section.slide.cur img')
    for (let k = 0; k < (await imgs.count()); k++) {
      const img = imgs.nth(k)
      const b = await img.evaluate((el) => {
        const r = el.getBoundingClientRect()
        // Clip to the slide: the title slide's screenshot runs off the right edge.
        const x = Math.max(0, r.left)
        const y = Math.max(0, r.top)
        return { x, y, w: Math.min(1920, r.right) - x, h: Math.min(1080, r.bottom) - y }
      })
      const path = `${TMP}/slide${i + 1}-img${k + 1}.png`
      await page.screenshot({ path, clip: { x: b.x, y: b.y, width: b.w, height: b.h } })
      data.images.push({ ...b, path })
    }
    slides.push(data)
  }
} finally {
  await browser.close()
}

// ---------------------------------------------------------------------------
// 2. Build the PowerPoint.
// ---------------------------------------------------------------------------
const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE' // 13.333 x 7.5 in, 16:9
pptx.title = 'VIGIL demo deck'
pptx.company = 'Pandanauts'
// Theme fonts are Arial, so new text and any substitution fall back to Arial; the deck's
// own text names IBM Plex Sans / IBM Plex Mono, used where they are installed.
pptx.theme = { headFontFace: 'Arial', bodyFontFace: 'Arial' }
const inch = (px) => Math.round(px * PX * 1000) / 1000

for (const s of slides) {
  const slide = pptx.addSlide()
  slide.background = { color: s.bg ?? '0B0E11' }
  for (const sh of s.shapes)
    slide.addShape(pptx.ShapeType.roundRect, {
      x: inch(sh.x), y: inch(sh.y), w: inch(sh.w), h: inch(sh.h),
      rectRadius: Math.min(0.5, sh.radius / Math.min(sh.w, sh.h)),
      fill: sh.fill ? { color: sh.fill } : { type: 'none' },
      line: sh.line ? { color: sh.line, width: sh.lineW * PT } : { type: 'none' },
    })
  for (const img of s.images) slide.addImage({ path: img.path, x: inch(img.x), y: inch(img.y), w: inch(img.w), h: inch(img.h) })
  for (const b of s.bullets) slide.addShape(pptx.ShapeType.roundRect, { x: inch(b.x), y: inch(b.y), w: inch(b.w), h: inch(b.h), rectRadius: 0.2, fill: { color: b.fill }, line: { type: 'none' } })
  for (const t of s.texts) {
    // PowerPoint measures text slightly differently from Chrome: a little extra width avoids surprise wraps.
    const w = Math.min(t.w * 1.05 + 12, 1920 - t.x)
    slide.addText(
      t.runs.map((r) => ({
        text: r.text,
        options: { fontFace: r.face, fontSize: Math.round(r.size * PT * 10) / 10, color: r.color ?? 'E6EAEE', bold: r.bold, charSpacing: r.spacing ? Math.round(r.spacing * PT * 10) / 10 : undefined },
      })),
      {
        x: inch(t.x), y: inch(t.y), w: inch(w), h: inch(Math.max(t.h, t.lineHeight)),
        margin: 0, valign: 'top', align: 'left', wrap: true, fit: 'none',
        // Exact line pitch from the HTML (PowerPoint's multiple is relative to the font's own line height).
        lineSpacing: Math.round(t.lineHeight * PT * 10) / 10,
      },
    )
  }
}
mkdirSync('public', { recursive: true })
await pptx.writeFile({ fileName: OUT })

// Font fallback: tag every IBM Plex reference with Arial's PANOSE and family, so a machine
// without IBM Plex substitutes Arial (PowerPoint picks substitutes by PANOSE and pitch family).
{
  const z = await JSZip.loadAsync(readFileSync(OUT))
  for (const name of Object.keys(z.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    const xml = await z.file(name).async('string')
    z.file(name, xml.replace(/<a:(latin|ea|cs) typeface="(IBM Plex (?:Sans|Mono))"(?: [^/>]*)?\/>/g, '<a:$1 typeface="$2" panose="020B0604020202020204" pitchFamily="34" charset="0"/>'))
  }
  writeFileSync(OUT, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}
copyFileSync(OUT, PUBLIC_OUT)

// ---------------------------------------------------------------------------
// 3. Check: 7 slides, and each slide's text matches the same page of the PDF.
// ---------------------------------------------------------------------------
const zip = await JSZip.loadAsync(readFileSync(OUT))
const slideFiles = Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
if (slideFiles.length !== 7) throw new Error(`PPTX has ${slideFiles.length} slides, expected 7`)
const unxml = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
const pptxText = []
for (const f of slideFiles) {
  const xml = await zip.file(f).async('string')
  pptxText.push([...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => unxml(m[1])).join(''))
}

const pdfText = extractPdfText(readFileSync(PDF))
if (pdfText.length !== 7) throw new Error(`PDF has ${pdfText.length} pages, expected 7`)
const norm = (s) => s.replace(/\s+/g, '').normalize('NFC')
const sortChars = (s) => [...norm(s)].sort().join('')
let mismatches = 0
for (let i = 0; i < 7; i++) {
  // Same characters on the page (order can differ: PDFs store text in paint order).
  const same = sortChars(pptxText[i]) === sortChars(pdfText[i])
  console.log(`slide ${i + 1}: ${same ? 'text matches the PDF' : 'TEXT DIFFERS from the PDF'} (${norm(pptxText[i]).length} characters)`)
  if (!same) {
    mismatches++
    console.log('  pptx:', norm(pptxText[i]).slice(0, 200))
    console.log('  pdf: ', norm(pdfText[i]).slice(0, 200))
  }
}
if (mismatches) throw new Error(`${mismatches} slide(s) differ from the PDF`)
console.log(`\n${OUT}: 7 slides; copied to ${PUBLIC_OUT}`)

/**
 * Minimal text extraction for the Chrome-generated PDF: inflates content streams and maps
 * glyph ids back to Unicode through each font's ToUnicode CMap. Returns one string per page.
 */
function extractPdfText(buf) {
  const src = buf.toString('latin1')
  const objs = new Map()
  for (const m of src.matchAll(/(\d+) 0 obj\b/g)) {
    const start = m.index + m[0].length
    const end = src.indexOf('endobj', start)
    const body = src.slice(start, end)
    const sIdx = body.indexOf('stream')
    let dict = body
    let stream = null
    if (sIdx >= 0 && body.slice(0, sIdx).includes('<<')) {
      dict = body.slice(0, sIdx)
      let dataStart = start + sIdx + 6
      if (src[dataStart] === '\r') dataStart++
      if (src[dataStart] === '\n') dataStart++
      const len = Number(dict.match(/\/Length (\d+)/)?.[1])
      let raw = buf.subarray(dataStart, Number.isFinite(len) ? dataStart + len : start + body.indexOf('endstream'))
      stream = dict.includes('/FlateDecode') ? inflateSync(raw) : raw
    }
    objs.set(Number(m[1]), { dict, stream })
  }
  const ref = (s) => Number(s.match(/(\d+) 0 R/)?.[1])
  const cmapCache = new Map()
  const cmapFor = (fontId) => {
    if (cmapCache.has(fontId)) return cmapCache.get(fontId)
    const map = new Map()
    const tu = objs.get(fontId)?.dict.match(/\/ToUnicode (\d+) 0 R/)
    const text = tu ? objs.get(Number(tu[1]))?.stream?.toString('latin1') ?? '' : ''
    const hexToStr = (h) => String.fromCodePoint(...(h.match(/.{4}/g) ?? []).map((x) => parseInt(x, 16))).replace(/[\uD800-\uDFFF]/g, '')
    for (const blk of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g))
      for (const p of blk[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g)) map.set(parseInt(p[1], 16), hexToStr(p[2]))
    for (const blk of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g))
      for (const p of blk[1].matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]+)>|\[([^\]]*)\])/g)) {
        const lo = parseInt(p[1], 16)
        const hi = parseInt(p[2], 16)
        if (p[4]) for (let c = lo; c <= hi; c++) map.set(c, String.fromCodePoint(parseInt(p[4], 16) + (c - lo)))
        else [...p[5].matchAll(/<([0-9a-fA-F]+)>/g)].forEach((x, k) => map.set(lo + k, hexToStr(x[1])))
      }
    cmapCache.set(fontId, map)
    return map
  }
  const resolveDict = (s) => (/^\s*\d+ 0 R/.test(s) ? objs.get(ref(s))?.dict ?? '' : s)
  const pagesRoot = [...objs.entries()].find(([, o]) => /\/Type\s*\/Pages/.test(o.dict) && !/\/Parent/.test(o.dict))
  const pageIds = []
  const collect = (id) => {
    const d = objs.get(id).dict
    if (/\/Type\s*\/Pages/.test(d)) for (const k of d.match(/\/Kids\s*\[([^\]]*)\]/)[1].matchAll(/(\d+) 0 R/g)) collect(Number(k[1]))
    else pageIds.push(id)
  }
  collect(pagesRoot[0])
  return pageIds.map((pid) => {
    const pd = objs.get(pid).dict
    const resMatch = pd.match(/\/Resources\s*(\d+ 0 R|<<[\s\S]*>>)/)
    const res = resMatch ? resolveDict(resMatch[1]) : ''
    const fontDictSrc = res.match(/\/Font\s*(\d+ 0 R|<<[^>]*>>)/)?.[1] ?? ''
    const fontDict = resolveDict(fontDictSrc)
    const fonts = new Map([...fontDict.matchAll(/\/(\w+)\s+(\d+) 0 R/g)].map((m) => [m[1], Number(m[2])]))
    const contents = pd.match(/\/Contents\s*(\[[^\]]*\]|\d+ 0 R)/)?.[1] ?? ''
    const streams = [...contents.matchAll(/(\d+) 0 R/g)].map((m) => objs.get(Number(m[1]))?.stream?.toString('latin1') ?? '')
    let text = ''
    for (const cs of streams) {
      let cmap = new Map()
      for (const tok of cs.matchAll(/\/(\w+)\s+[\d.]+\s+Tf|\[((?:[^\]\\]|\\.)*)\]\s*TJ|<([0-9a-fA-F]*)>\s*Tj/g)) {
        if (tok[1]) cmap = cmapFor(fonts.get(tok[1]))
        else {
          const hexes = tok[2] !== undefined ? [...tok[2].matchAll(/<([0-9a-fA-F]*)>/g)].map((x) => x[1]) : [tok[3]]
          for (const h of hexes) for (const g of h.match(/.{4}/g) ?? []) text += cmap.get(parseInt(g, 16)) ?? ''
          text += ' '
        }
      }
    }
    return text
  })
}
