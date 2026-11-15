import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

/** Manifest colours come from the dark theme tokens, so tokens.css stays the single source of colour. */
const tokensCss = readFileSync(new URL('./src/styles/tokens.css', import.meta.url), 'utf8')
const darkTokens = tokensCss.slice(tokensCss.indexOf('@theme'), tokensCss.indexOf("[data-theme='light']"))
const token = (name: string) => {
  const m = darkTokens.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`tokens.css: --color-${name} not found`)
  return m[1]
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // A new version waits for the crew to choose "Reload": never an automatic reload mid-protocol.
      registerType: 'prompt',
      injectRegister: false,
      // The glob below already precaches the icons; this avoids listing them twice.
      includeManifestIcons: false,
      manifest: {
        name: 'VIGIL: Crew Health Console',
        short_name: 'VIGIL',
        description: 'Earth-independent crew health console. Works with no connection to Earth. Simulated data; not a medical device.',
        start_url: '/overview',
        scope: '/',
        display: 'standalone',
        background_color: token('bg'),
        theme_color: token('bg'),
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the app needs: HTML, every JS chunk (lazy routes included), CSS, the bundled
        // IBM Plex woff2 fonts, icons and the manifest. The deck (PDF, PowerPoint, /deck/) and
        // screenshots are not precached.
        globPatterns: ['**/*.{html,js,css,woff2,svg,png}'],
        globIgnores: ['**/*.pdf', '**/*.pptx', 'screenshots/**', 'deck/**'],
        // Every app route (and unknown paths) loads offline from the cached index.html.
        navigateFallback: 'index.html',
        // ...but the deck files and the /deck/ presentation must reach the network, not the app shell.
        navigateFallbackDenylist: [/\.pdf$/i, /\.pptx$/i, /^\/screenshots\//, /^\/deck(\/|$)/],
        // First visit: the new worker takes control at once, so offline works without a reload.
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
