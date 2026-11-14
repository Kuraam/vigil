# VIGIL Phase 1 — Foundation and Mission Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An offline React app that renders the VIGIL mission shell with a working Overview built from a deterministic simulated dataset, and labelled empty states for the other five sections.

**Architecture:** Vite SPA. Pure TypeScript domain layer (`types/`, `data/`, `lib/`) with no React imports, unit-tested with Vitest. A single Zustand store (persisted to localStorage) holds crew selection, environment selection and readings. UI = `app/` (shell, router) + `features/<page>/` + shared `components/`. All colour, type and spacing tokens live in `src/styles/tokens.css` (Tailwind v4 `@theme`).

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Zustand 5 (persist), React Router, Recharts (installed, unused), lucide-react icons, @fontsource IBM Plex Sans / Mono, Vitest, playwright-core (route smoke check against local Chrome).

**Spec:** the Phase 1 brief in the session prompt (user message, 2026-11-14).

## Global Constraints

- No backend, no auth, no network calls at runtime. Fonts and icons bundled (no CDN).
- Thresholds: every range has `value`, `unit`, `source`; numeric values are `null` with a `TODO(Phase 2)` marker. No invented medical numbers.
- Simulated data: 4 fictional crew, 30 mission days, fixed seed; labelled "Simulated" in code and UI.
- Status palette used only for status: nominal green, watch amber, action red, no data grey; always icon + label + colour.
- Footer text exact: `Simulated data. Concept demonstration, not a medical device.`
- Nav order exact: Overview, Body Map, Vitals, Triage, Routine, Downlink.
- Hazards exact: Space Radiation, Isolation and Confinement, Distance from Earth, Gravity Fields, Hostile/Closed Environments.
- Environments exact: Spacecraft Transit, Orbital Station, Pressurized Rover, Surface Base.
- Respect `prefers-reduced-motion`; visible focus ring; hit targets >= 44px.

## Review Focus

1. Thresholds are TODO, so no reading may show nominal/watch/action. Expected: grey chip "Threshold pending". Test in Task 2.
2. Stale or corrupt localStorage (old version, missing crew id). Expected: store falls back to defaults, no crash. Test in Task 3.
3. Imaging log has no numeric value. Expected: Overview shows last entry date and zone, not "NaN". Test in Task 2 (`formatReading`).
4. Unknown route (`/foo`). Expected: redirect to Overview, not a blank page. Checked in Task 6 smoke script.
5. Reduced motion. Expected: page transitions drop to opacity-only/instant. Implemented via `MotionConfig reducedMotion="user"` in Task 4.

---

### Task 1: Scaffold, tokens, git

**Files:** Vite react-ts template at repo root; `src/styles/tokens.css`; `src/index.css`; `vite.config.ts`; `.gitignore`.

- [ ] `npm create vite@latest . -- --template react-ts`, install deps listed above.
- [ ] Add Tailwind v4 via `@tailwindcss/vite`; define tokens in `tokens.css` `@theme`: surfaces `--color-bg #0B0E11`, `--color-panel #12161B`, `--color-raised #191E24`, `--color-line #262D36`, text `--color-fg #E6EAEE`, `--color-fg-muted #9AA5B1`, accent `--color-accent #5CC8E8` (cyan, interactive only), status `--color-nominal #3DD68C`, `--color-watch #F5B544`, `--color-action #FF5D5D`, `--color-nodata #7D8794`; fonts `--font-sans "IBM Plex Sans"`, `--font-mono "IBM Plex Mono"`.
- [ ] Scripts: `dev`, `build`, `preview`, `typecheck` (`tsc -b`), `lint`, `test` (`vitest run`).
- [ ] `git init`; commit "chore: scaffold Vite React TS app with Tailwind tokens".

### Task 2: Domain types, thresholds, simulated data, status logic

**Files:** `src/types/*.ts` (index re-export), `src/data/thresholds.ts`, `src/data/environments.ts`, `src/data/hazards.ts`, `src/data/crew.ts`, `src/data/simulate.ts`, `src/lib/prng.ts`, `src/lib/status.ts`, `src/lib/format.ts`, tests beside each in `*.test.ts`.

**Interfaces (produces):**
- `type Status = 'nominal' | 'watch' | 'action' | 'nodata'`
- `type VitalType = 'bloodPressure' | 'heartRate' | 'hrv' | 'bloodGlucose' | 'coreTemperature' | 'sleepHours' | 'mood' | 'cognitiveReadiness' | 'imagingLog'`
- `type VitalReading` — discriminated on `kind`: `'scalar'` (`value: number`), `'pressure'` (`systolic`, `diastolic`), `'imaging'` (`zone: BodyZone`, `modality`, `note`); common `id, crewId, vital, missionDay, timestamp (ISO), simulated: true`.
- `mulberry32(seed: number): () => number`
- `generateReadings(seed = SIM_SEED, days = 30): VitalReading[]`
- `evaluateStatus(reading: VitalReading | undefined, thresholds: ThresholdConfig): { status: Status; reason: 'no-reading' | 'threshold-pending' | 'in-range' | 'watch-range' | 'action-range' }`
- `latestByVital(readings: VitalReading[], crewId: string): Partial<Record<VitalType, VitalReading>>`
- `formatReading(r: VitalReading): { value: string; unit: string }`

- [ ] Tests (`simulate.test.ts`): same seed → deep-equal output; 4 crew × 30 days present for every scalar vital; every reading has `simulated: true`; values finite.
- [ ] Tests (`status.test.ts`): `undefined` reading → `nodata/no-reading`; any reading with current (all-`null`) thresholds → `nodata/threshold-pending`; with a fixture threshold config containing numbers → nominal/watch/action branches.
- [ ] Tests (`format.test.ts`): pressure → `"118/76"`, `"mmHg"`; imaging → zone label, no `NaN`.
- [ ] Run `npm test` → fails, implement, → passes. Commit "feat: typed domain model, TODO thresholds, seeded simulated dataset".

### Task 3: Store

**Files:** `src/lib/store.ts`, `src/lib/store.test.ts`.
**Produces:** `useVigilStore` with `crewId`, `environmentId`, `readings`, `setCrew(id)`, `setEnvironment(id)`, `resetSimulation()`; persist key `vigil-store`, `version: 1`, `migrate` + `merge` that discard unknown crew/environment ids.
- [ ] Test: merging persisted `{ crewId: 'ghost' }` yields default crew. Implement, pass, commit "feat: persisted Zustand mission store".

### Task 4: Mission shell

**Files:** `src/app/App.tsx`, `src/app/router.tsx`, `src/app/shell/{TopBar,SideNav,Footer,MissionClock,CommDelay,Select}.tsx`, `src/components/{StatusChip,Panel}.tsx`.
- [ ] Router: `/` → redirect `/overview`; six routes; `*` → `/overview`. Skip-link to main. `MotionConfig reducedMotion="user"`; page fade/translate 160ms.
- [ ] TopBar: wordmark, MD + MET (mono, ticking each second, `aria-live="off"`), crew + environment native `<select>`s (keyboard-safe), comm-delay readout from `environments.ts` (light-time, sourced).
- [ ] Commit "feat: mission shell layout and navigation".

### Task 5: Pages

**Files:** `src/features/overview/*`, `src/features/placeholder/EmptyState.tsx`, route entries for Body Map, Vitals, Triage, Routine, Downlink.
- [ ] Overview: crew header, status legend, vital grid (latest value, unit, mission day, 7-day mean delta, StatusChip), hazard panel (5 hazards with short description + NASA HRP source line), "Simulated" badge.
- [ ] Empty states: icon, title, one-paragraph description of the coming feature, phase tag.
- [ ] Commit "feat: overview status summary and phase empty states".

### Task 6: Docs and verification

- [ ] README (what, run, structure, roadmap). Commit "docs: README".
- [ ] `npm run typecheck && npm run lint && npm test && npm run build`.
- [ ] `scripts/smoke.mjs` (playwright-core + local Chrome): load each route + `/foo` on dev server, fail on console error/pageerror, save screenshots to `.tmp/`. Commit "test: route smoke check".
