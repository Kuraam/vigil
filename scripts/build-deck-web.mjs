/**
 * Browser presentation of the demo deck, served at /deck/.
 *
 * Copies docs/deck/index.html (the same source as the PDF) to public/deck/index.html
 * with its fonts and the screenshots it uses, and adds a small presenter:
 *  - one 16:9 slide at a time, scaled to fit the window (projector or laptop);
 *  - Left/Right, Up/Down, Space, PageUp/PageDown, Home/End change slides;
 *  - F toggles fullscreen; a 1/7 counter; the URL hash keeps the slide (/deck/#3).
 * The slide content is not changed. Usage: npm run deck:web
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const SRC = 'docs/deck/index.html'
const OUT_DIR = 'public/deck'
let html = readFileSync(SRC, 'utf8')

// Images: ../screenshots/x.png -> screenshots/x.png (copied next to the page).
const shots = [...new Set([...html.matchAll(/src="\.\.\/screenshots\/([^"]+)"/g)].map((m) => m[1]))]
html = html.replaceAll('src="../screenshots/', 'src="screenshots/')

rmSync(OUT_DIR, { recursive: true, force: true })
mkdirSync(`${OUT_DIR}/screenshots`, { recursive: true })
cpSync('docs/deck/fonts', `${OUT_DIR}/fonts`, { recursive: true })
for (const s of shots) {
  mkdirSync(dirname(`${OUT_DIR}/screenshots/${s}`), { recursive: true })
  cpSync(`docs/screenshots/${s}`, `${OUT_DIR}/screenshots/${s}`)
}

const PRESENTER_CSS = `
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      /* Presenter: one slide at a time, scaled to the window. */
      html, body { height: 100%; overflow: hidden; }
      body { position: relative; }
      section.slide { display: none; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(var(--scale, 0.5)); transform-origin: center; }
      section.slide.is-current { display: flex; }
      .presenter-bar { position: fixed; right: 16px; bottom: 12px; display: flex; align-items: center; gap: 6px; font: 500 14px var(--mono); color: var(--fg-faint); z-index: 10; }
      .presenter-bar button { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--line-strong); background: var(--panel); color: var(--fg-muted); font: 500 16px var(--mono); cursor: pointer; }
      .presenter-bar button:hover { color: var(--fg); border-color: var(--fg-faint); }
      .presenter-bar button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      .presenter-bar .count { min-width: 3.5em; text-align: center; }
      .presenter-hint { position: fixed; left: 16px; bottom: 12px; font: 400 13px var(--sans); color: var(--fg-faint); z-index: 10; transition: opacity 0.6s; }
      :fullscreen .presenter-bar, :fullscreen .presenter-hint { opacity: 0; }
      :fullscreen .presenter-bar:hover { opacity: 1; }
      @media (prefers-reduced-motion: reduce) { .presenter-hint { transition: none; } }
    </style>
  </head>`

const PRESENTER_JS = `
    <div class="presenter-hint" id="presenter-hint">Arrow keys or Space to move, F for fullscreen</div>
    <nav class="presenter-bar" aria-label="Slides">
      <button type="button" id="prev" aria-label="Previous slide">&lsaquo;</button>
      <span class="count" id="count" aria-live="polite">1/7</span>
      <button type="button" id="next" aria-label="Next slide">&rsaquo;</button>
      <button type="button" id="fs" aria-label="Toggle fullscreen (F)">&#x26F6;</button>
    </nav>
    <script>
      (() => {
        const slides = [...document.querySelectorAll('section.slide')]
        const count = document.getElementById('count')
        let i = 0
        const fromHash = () => {
          const n = parseInt(location.hash.slice(1), 10)
          return Number.isFinite(n) ? Math.min(Math.max(n, 1), slides.length) - 1 : 0
        }
        const fit = () => document.documentElement.style.setProperty('--scale', String(Math.min(innerWidth / 1920, innerHeight / 1080)))
        const show = (n, updateHash = true) => {
          i = Math.min(Math.max(n, 0), slides.length - 1)
          slides.forEach((s, k) => {
            s.classList.toggle('is-current', k === i)
            s.setAttribute('aria-hidden', String(k !== i))
          })
          count.textContent = (i + 1) + '/' + slides.length
          document.title = 'VIGIL demo deck (' + (i + 1) + '/' + slides.length + ')'
          if (updateHash && location.hash !== '#' + (i + 1)) history.replaceState(null, '', '#' + (i + 1))
        }
        const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})
        addEventListener('keydown', (e) => {
          if (e.altKey || e.ctrlKey || e.metaKey) return
          const k = e.key
          if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) show(i + 1)
          else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) show(i - 1)
          else if (k === 'Home') show(0)
          else if (k === 'End') show(slides.length - 1)
          else if (k === 'f' || k === 'F') fullscreen()
          else return
          e.preventDefault()
        })
        document.getElementById('prev').addEventListener('click', () => show(i - 1))
        document.getElementById('next').addEventListener('click', () => show(i + 1))
        document.getElementById('fs').addEventListener('click', fullscreen)
        addEventListener('hashchange', () => show(fromHash(), false))
        addEventListener('resize', fit)
        fit()
        show(fromHash())
        setTimeout(() => (document.getElementById('presenter-hint').style.opacity = '0'), 4000)
      })()
    </script>
  </body>`

html = html.replace('  </head>', PRESENTER_CSS).replace('  </body>', PRESENTER_JS)
writeFileSync(`${OUT_DIR}/index.html`, html)
console.log(`${OUT_DIR}/index.html: presenter with ${shots.length} screenshots and fonts`)
