# VIGIL

**An Earth-independent crew health console.** VIGIL helps astronauts who are not physicians check their own health and decide what to do when Earth is too far away to ask in time.

Built for the 2026 NASA Space Apps Challenge, *Create Health Monitoring Software for Astronauts on Space Missions*.

> **Simulated data. Concept demonstration, not a medical device.**
> Every crew member and reading in this build is fictional and generated from a fixed seed. Status thresholds are deliberately left empty until they can be sourced.

## What works today (Phase 1)

- **Mission shell.** The top bar shows mission day, a ticking mission elapsed time (MET), a crew member selector, an environment selector, and the one-way signal delay to Earth on a 0 to 22.3 minute scale.
- **Overview.** For the selected crew member: a status summary, the latest reading of all nine vitals (with change against the 7-day mean), and the five NASA Human Research Program hazards.
- **Empty states** for Body Map, Vitals, Triage, Routine and Downlink. Each one describes what is coming and in which phase.
- **Offline.** No backend, no auth, no network calls. Fonts and icons are bundled.
- **State persists** (crew, environment, readings) in `localStorage`.
- **Accessibility.** Full keyboard navigation with a skip link and visible focus ring. Hit targets are at least 44 px. Reduced motion is respected. Status is always shown with an icon, a label and a colour.

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

`npm run smoke` uses an installed Chrome or Edge. Set `CHROME_PATH` if yours is somewhere unusual.

**Hosting note:** routes use the History API. A static host must serve `index.html` for unknown paths (`vite preview` already does).

## Folder structure

```
src/
  app/                 App root, router, navigation config
    shell/             Top bar, mission clock, comm delay, side nav, layout
  features/
    overview/          Overview page: status summary, readouts, hazard panel
    upcoming/          Empty states and copy for later-phase sections
  components/          Shared UI: StatusChip, PageHeader, SimulatedTag
  data/                Static and simulated data: crew, vitals, hazards,
                       environments, thresholds (TODO), seeded generator
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

- **Thresholds are `null` until sourced.** `src/data/thresholds.ts` gives every range a `value`, a `unit` and a `source`. All values are `TODO(Phase 2)`. Until they are filled, every reading shows a grey **Not assessed** chip. VIGIL never shows a clinical rating it cannot cite.
- **Simulated data is deterministic.** `src/data/simulate.ts` generates 4 crew × 30 days from seed `20261004`. The ranges in the generator only shape believable demo data; they are not thresholds. One simulated storyline is built in: the flight engineer builds up sleep debt from day 22, which gives Phase 2 trend views a pattern to find.
- **Comm delay is physics, not medicine.** It is light travel time (Earth to Mars 3.0 to 22.3 min; low Earth orbit about 0.24 s). Rover and surface base are assumed to be on Mars.
- **Status palette is reserved.** Green, amber, red and grey appear only for status, always with a distinct icon shape and a text label. The cyan accent appears only on interactive elements.

## Roadmap

| Phase | Scope |
| ----- | ----- |
| **1. Foundation and mission shell** (this build) | Scaffold, domain model, TODO thresholds, simulated dataset, store, shell, Overview, empty states |
| **2. Sourced thresholds and trends** | Fill thresholds from cited sources; Vitals page with 30-day Recharts trends and threshold bands; Body Map with symptom logging and linked imaging |
| **3. Act on it** | Triage decision flows ending in act now, monitor or log; Routine page with countermeasure tasks mapped to the five hazards |
| **4. Downlink and demo** | Compact health summary for the next comm window; delay-aware send queue; final polish and demo script |

## Known quirk: Windows drive letter

If a terminal opens the project as `d:\...` instead of `D:\...`, plain `npx vitest` fails every suite with *"Cannot read properties of undefined (reading 'config')"*. Vitest loads its runner twice under two spellings of the same path. `npm test` goes through `scripts/vitest.mjs`, which normalises the drive letter, so use that.
