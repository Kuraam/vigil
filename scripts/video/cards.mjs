/**
 * Title, problem and end cards: standalone HTML in the VIGIL dark style (same tokens and
 * IBM Plex fonts as the deck). Fonts are embedded as data URLs so the cards render with
 * no network, before the app has loaded.
 */
import { readFileSync } from 'node:fs'

const font = (file) => `data:font/woff2;base64,${readFileSync(`docs/deck/fonts/${file}`).toString('base64')}`

const BASE = `
  @font-face { font-family: 'IBM Plex Sans'; src: url('${font('ibm-plex-sans-latin-400-normal.woff2')}') format('woff2'); font-weight: 400; }
  @font-face { font-family: 'IBM Plex Sans'; src: url('${font('ibm-plex-sans-latin-500-normal.woff2')}') format('woff2'); font-weight: 500; }
  @font-face { font-family: 'IBM Plex Sans'; src: url('${font('ibm-plex-sans-latin-600-normal.woff2')}') format('woff2'); font-weight: 600; }
  @font-face { font-family: 'IBM Plex Mono'; src: url('${font('ibm-plex-mono-latin-400-normal.woff2')}') format('woff2'); font-weight: 400; }
  @font-face { font-family: 'IBM Plex Mono'; src: url('${font('ibm-plex-mono-latin-500-normal.woff2')}') format('woff2'); font-weight: 500; }
  :root { --bg: #0b0e11; --panel: #12161b; --line: #262d36; --fg: #e6eaee; --muted: #9aa5b1; --faint: #7d8794; --accent: #5cc8e8; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: var(--bg); color: var(--fg); font-family: 'IBM Plex Sans', Arial, sans-serif; }
  body { display: flex; flex-direction: column; justify-content: center; padding: 0 128px; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .accent { color: var(--accent); }
  .fade { opacity: 0; transform: translateY(10px); transition: opacity 700ms ease, transform 700ms ease; }
  .fade.in { opacity: 1; transform: none; }
`

const page = (title, css, body) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><style>${BASE}${css}</style></head><body>${body}</body></html>`

/** The VIGIL mark from the app's top bar. */
const MARK = `<svg viewBox="0 0 32 32" width="88" height="88" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#191e24"/><path d="M7 9l9 15 9-15" fill="none" stroke="#5cc8e8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`

export const titleCard = () =>
  page(
    'VIGIL',
    `.word { font-size: 168px; font-weight: 600; letter-spacing: 0.16em; line-height: 1; margin: 28px 0 28px; }
     .tag { font-size: 46px; line-height: 1.25; max-width: 1100px; }
     .team { margin-top: 64px; font-size: 28px; color: var(--muted); }`,
    `${MARK}
     <div class="word">VIGIL</div>
     <div class="tag">Health monitoring a crew can act on when Earth is <span class="accent">minutes away</span>.</div>
     <div class="team mono">Pandanauts · NASA Space Apps Challenge 2026</div>`,
  )

export const problemCard = () =>
  page(
    'The problem',
    `.lead { font-size: 60px; font-weight: 600; line-height: 1.16; max-width: 1260px; }
     .lead .big { color: var(--accent); }
     .hz { display: flex; gap: 18px; margin: 56px 0 30px; flex-wrap: wrap; }
     .hz div { background: var(--panel); border: 2px solid var(--line); border-radius: 12px; padding: 18px 22px; font-size: 26px; font-weight: 500; }
     .note { font-size: 36px; color: var(--muted); }
     .note b { color: var(--fg); font-weight: 600; }`,
    `<div class="lead">On the way to Mars, a message to Earth takes up to <span class="big">22 minutes</span>, one way.</div>
     <div id="second" class="fade">
       <div class="hz"><div>Radiation</div><div>Isolation</div><div>Distance</div><div>Gravity</div><div>Closed environments</div></div>
       <div class="note"><b>Five hazards.</b> Most astronauts are not doctors.</div>
     </div>`,
  )

export const endCard = () =>
  page(
    'VIGIL',
    `.row { display: flex; align-items: center; gap: 28px; }
     .word { font-size: 96px; font-weight: 600; letter-spacing: 0.16em; }
     .links { margin-top: 56px; display: flex; gap: 64px; font-size: 40px; }
     .disc { margin-top: 48px; font-size: 30px; color: var(--muted); }`,
    `<div class="row">${MARK}<div class="word">VIGIL</div></div>
     <div class="links mono"><span class="accent">vigil-pandas.vercel.app</span><span>github.com/Kuraam/vigil</span></div>
     <div class="disc">Concept demonstration with simulated data. Not a medical device.</div>`,
  )
