# VIGIL

**Live demo:** https://vigil-pandas.vercel.app
**Repository:** https://github.com/Kuraam/vigil

**An Earth-independent crew health console.** VIGIL helps astronauts who are not physicians check their own health and decide what to do when Earth is too far away to ask in time.

Built for the 2026 NASA Space Apps Challenge, *Create Health Monitoring Software for Astronauts on Space Missions*.

> **Simulated data. Concept demonstration, not a medical device.**
> Every crew member and reading in this build is fictional and generated from a fixed seed. Status thresholds are cited; tiers marked "VIGIL triage rule" are team-defined and not clinically validated.

## What works today (Phases 1 to 3)

- **Mission shell.** Mission day, a ticking mission elapsed time (MET), crew and environment selectors, and the one-way signal delay to Earth on a 0 to 22.3 minute scale.
- **Overview.** Status summary and the latest reading of all nine vitals, rated nominal, watch or action against cited thresholds (most urgent first), a radiation dose panel, and the five NASA HRP hazards.
- **Radiation.** Career dose against the 600 mSv limit (NASA-STD-3001), today's dose rate for the selected environment, and days left at that rate. Switching environment changes the rate and days left.
- **Vitals.** A 30-day trend chart per vital with the nominal band shaded, threshold lines, the personal baseline where the rules use it, the source of every threshold, a data table, and a keyboard form to log a new reading. The imaging log lists scans; they are logged, never rated.
- **Body Map.** An original SVG figure with eight body systems. Each system takes the worst status of its linked readings and links to the named NASA HRP risks, the hazards that affect it, and how the selected environment changes things.
- **Triage.** An alert queue (selected crew member or whole crew), Action first. Each alert opens a guided protocol (confirm, assess, act, escalate) with a timestamp per step, saved and resumable. Re-measuring inside a protocol updates status at once. VIGIL never names medications; protocols are labelled "Concept guidance for demonstration. Not medical advice."
- **Comm-delay escalation.** Earth reply ETA is the round trip. Orbital Station is ground-guided; every Mars environment is crew-autonomous first. A badge in the top bar shows the mode.
- **Environment priorities.** The Overview ranks the five hazards for the selected environment (team-defined), and the Routine follows the top-ranked hazard.
- **Routine.** A daily checklist with points, personal and crew streaks, a 7-day adherence bar and milestones. Exercise adherence feeds the Bones and muscles zone. A "due now" count in the top bar opens it.
- **Downlink.** A compact plain-text brief for one crew member or the whole crew, with protocol steps and timestamps, 7-day trends, dose and adherence. Copy, print or save as PDF, size in KB and arrival time.
- **Sources.** Every source, grouped, with where it is used, plus the About statement and the AI-use disclosure.
- **Demo storylines.** The flight engineer's sleep debt turns sleep from watch (day 22) to action (day 27), with missed sleep and check-in tasks. The mission specialist runs 38.3 °C and 108 bpm on days 29-30 and skips exercise on day 29.
- **Demo path.** Select Arjun Sethi, open Triage, start the fever protocol, enter a re-measured temperature, then build the Downlink brief.
- **Offline.** No backend, no auth, no network calls. Fonts and icons are bundled.
- **State persists** (crew, environment, readings, logged entries) in `localStorage`.
- **Accessibility.** Full keyboard navigation with a skip link and visible focus ring. Hit targets are at least 44 px. Reduced motion is respected. Status is always shown with an icon, a label and a colour; charts have a text summary and a data table.

## Run it

Requires Node 20.19+ (developed on Node 24).

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command             | What it does                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                                                   |
| `npm run build`     | Type check, then production build into `dist/`                               |
| `npm run preview`   | Serve the production build locally                                           |
| `npm run typecheck` | TypeScript project check (`tsc -b`)                                          |
| `npm run lint`      | Lint with oxlint                                                             |
| `npm test`          | Unit tests for the domain layer (Vitest)                                     |
| `npm run smoke`     | Opens every route in local Chrome or Edge and fails on any console error. Screenshots go to `.tmp/screens/` |

`npm run smoke` uses an installed Chrome or Edge. Set `CHROME_PATH` if yours is somewhere unusual. By default it starts its own dev server. To check a running build instead, set `SMOKE_URL`:

```bash
npm run build && npm run preview                       # terminal 1
SMOKE_URL=http://localhost:4173 npm run smoke          # terminal 2 (bash)
$env:SMOKE_URL="http://localhost:4173"; npm run smoke  # terminal 2 (PowerShell)
```

**Hosting note:** routes use the History API, so a static host must serve `index.html` for every path. `vite preview` already does this, and `vercel.json` sets the same rewrite on Vercel.

## Folder structure

```
src/
  app/                 App root, router, navigation config
    shell/             Top bar, mission clock, comm delay, side nav, layout
  features/
    overview/          Overview: status summary, readouts, radiation, hazards
    vitals/            Vitals: Recharts trends, log forms, imaging log
    bodymap/           Body Map: SVG figure, zone list, zone panel
    triage/            Alert queue and protocol runner
    routine/           Daily checklist, streaks, adherence
    downlink/          Plain-text brief builder
    sources/           Sources and About page
  components/          Shared UI: StatusChip, PageHeader, SimulatedTag
  data/                Sources registry, thresholds, radiation, hazards, body
                       zones, research, environments, seeded generator
  lib/                 Pure logic: PRNG, status evaluation, formatting,
                       reading helpers, persistence, Zustand store
  types/               Domain model (CrewMember, VitalReading, Hazard, ...)
  styles/tokens.css    Design tokens: the only place colours and fonts are defined
scripts/
  smoke.mjs            Browser route check
  vitest.mjs           Test launcher (Windows drive-letter fix, see below)
docs/superpowers/plans Implementation plan for each phase
```

The domain layer (`types`, `data`, `lib`) has no React imports and is unit tested. The UI reads only from the store and these helpers.

## Key decisions

- **Every number has a source.** `src/data/sources.ts` is the single registry; thresholds, dose rates, delays and notes all point at it, a unit test fails if any threshold cites an unregistered source, and the Sources page renders it.
- **Thresholds are data, rules are code.** `src/data/thresholds.ts` holds each value as `{ value, unit, source }`, exactly as supplied by the team. `src/lib/status.ts` applies them, including the history rules (HRV against a day 1-14 baseline, three short nights for sleep, a three-day mood decline). Values that fall between two given tiers go to the watch tier.
- **Simulated data is deterministic.** `src/data/simulate.ts` generates 4 crew × 30 days from seed `20261004`. Generator ranges only shape believable demo data. Storyline values are fixed overrides. Saved Phase 1 data is regenerated automatically (data version 2).
- **Comm delay is physics, not medicine.** Mars mission profile: transit up to 22.3 min, Mars surface 3.0 to 22.3 min (NASA Mars Relay Network), Orbital Station under 1 s.
- **Status palette is reserved.** Green, amber, red and grey appear only for status, always with a distinct icon shape and a text label. The cyan accent appears only on interactive elements.

## Roadmap

| Phase | Scope |
| ----- | ----- |
| **1. Foundation and mission shell** (done) | Scaffold, domain model, TODO thresholds, simulated dataset, store, shell, Overview, empty states |
| **2. Sourced thresholds and trends** (done) | Cited thresholds, radiation dose tracking, Vitals trends with logging, Body Map with NASA HRP risks, Sources page, demo storylines |
| **3. Act on it** (this build) | Alert queue and guided protocols with comm-delay escalation, environment hazard priorities, Routine with streaks, Downlink brief |
| **4. Downlink and demo** | Compact health summary for the next comm window; delay-aware send queue; final polish and demo script |

## Use of AI tools

VIGIL was built by Team Pandas for NASA Space Apps 2026. Code was written with the assistance of Claude (Anthropic), an AI coding assistant, directed and reviewed by the team. All crew data is simulated. VIGIL is not a medical device.

## Known quirk: Windows drive letter

If a terminal opens the project as `d:\...` instead of `D:\...`, plain `npx vitest` fails every suite with *"Cannot read properties of undefined (reading 'config')"*. Vitest loads its runner twice under two spellings of the same path. `npm test` goes through `scripts/vitest.mjs`, which normalises the drive letter, so use that.
