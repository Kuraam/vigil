/**
 * Recording-only overlay, injected into the page with page.evaluate (never part of the app):
 * a lower-third caption bar, a pulsing click ring, a spotlight box and the corner label.
 * Idempotent: safe to call again after every navigation, reload or setContent.
 * Colours mirror the VIGIL dark tokens (bg #0b0e11, fg #e6eaee, accent #5cc8e8).
 */
export function installOverlay({ label }) {
  if (document.getElementById('rec-overlay')) return
  const root = document.createElement('div')
  root.id = 'rec-overlay'
  root.setAttribute('aria-hidden', 'true')
  root.innerHTML = `
    <style>
      #rec-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; font-family: 'IBM Plex Sans', 'Segoe UI', Arial, sans-serif; }
      /* Centred over the content area (right of the 224 px side nav): clear of the app's bottom-left toast. */
      #rec-caption { position: absolute; left: calc(50% + 112px); bottom: 34px; transform: translate(-50%, 12px); max-width: 980px; width: max-content;
        padding: 16px 30px 18px; border-radius: 14px; background: rgba(8, 11, 14, 0.86); border: 1px solid rgba(92, 200, 232, 0.35);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45); color: #ffffff; font-size: 31px; line-height: 1.32; font-weight: 500; text-align: center;
        opacity: 0; transition: opacity 260ms ease, transform 260ms ease; text-wrap: balance; }
      #rec-caption.on { opacity: 1; transform: translate(-50%, 0); }
      #rec-caption .k { color: #5cc8e8; font-weight: 600; }
      #rec-label { position: absolute; right: 14px; bottom: 4px; font-size: 12.5px; color: rgba(230, 234, 238, 0.78);
        background: rgba(8, 11, 14, 0.9); padding: 3px 8px; border-radius: 6px; letter-spacing: 0.01em; }
      .rec-ring { position: absolute; width: 28px; height: 28px; margin: -14px 0 0 -14px; border-radius: 50%;
        border: 3px solid #5cc8e8; box-shadow: 0 0 0 4px rgba(92, 200, 232, 0.25); animation: rec-ring 900ms ease-out forwards; }
      @keyframes rec-ring { 0% { transform: scale(0.4); opacity: 1 } 70% { opacity: 0.9 } 100% { transform: scale(2.4); opacity: 0 } }
      #rec-spot { position: absolute; border: 3px solid #5cc8e8; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.28), 0 0 24px rgba(92, 200, 232, 0.55);
        opacity: 0; transition: opacity 300ms ease, left 400ms ease, top 400ms ease, width 400ms ease, height 400ms ease; }
      #rec-spot.on { opacity: 1; }
    </style>
    <div id="rec-spot"></div>
    <div id="rec-caption"></div>
    <div id="rec-label"></div>`
  document.documentElement.appendChild(root)
  root.querySelector('#rec-label').textContent = label

  // Caption text: *word* marks a keyword shown in the accent cyan. Built with text nodes, no HTML parsing.
  const setCaption = (text) => {
    const el = root.querySelector('#rec-caption')
    el.textContent = ''
    text.split(/(\*[^*]+\*)/).forEach((part) => {
      if (!part) return
      if (part.startsWith('*') && part.endsWith('*')) {
        const k = document.createElement('span')
        k.className = 'k'
        k.textContent = part.slice(1, -1)
        el.appendChild(k)
      } else el.appendChild(document.createTextNode(part))
    })
  }
  window.__rec = {
    caption(text) {
      const el = root.querySelector('#rec-caption')
      if (!text) return el.classList.remove('on')
      setCaption(text)
      el.classList.add('on')
    },
    ring(x, y) {
      const r = document.createElement('div')
      r.className = 'rec-ring'
      r.style.left = `${x}px`
      r.style.top = `${y}px`
      root.appendChild(r)
      setTimeout(() => r.remove(), 1000)
    },
    spot(rect) {
      const s = root.querySelector('#rec-spot')
      if (!rect) return s.classList.remove('on')
      const pad = 8
      Object.assign(s.style, { left: `${rect.x - pad}px`, top: `${rect.y - pad}px`, width: `${rect.width + pad * 2}px`, height: `${rect.height + pad * 2}px` })
      s.classList.add('on')
    },
  }
}
