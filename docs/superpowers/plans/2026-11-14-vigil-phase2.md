# VIGIL Phase 2: Sourced thresholds, Vitals trends, Body Map, Radiation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Replace TODO thresholds with the team-supplied sourced values, add radiation dose tracking, a Recharts Vitals page with manual logging, an SVG Body Map, demo storylines and a Sources page.

**Architecture:** Thresholds stay data (`src/data/thresholds.ts`, every number a `{ value, unit, source }`), but evaluation becomes per-vital rules in `src/lib/status.ts` that receive the crew member's history for that vital (needed for HRV baseline, 3-night sleep rule, 3-day mood decline). Every source string comes from one registry (`src/data/sources.ts`) that the Sources page renders. Radiation and zone roll-up are pure functions in `src/lib/`. Vitals page is lazy-loaded so Recharts stays out of the first bundle.

**Spec:** the Phase 2 brief (user message, 2026-11-14), values copied verbatim.

## Global Constraints
- Threshold numbers and source strings exactly as given; team-rule tiers use `VIGIL triage rule (team-defined, not clinically validated)`.
- Same seed (`20261004`); storyline values are deterministic overrides.
- Imaging is never rated: chip reads "Logged".
- No NASA logos, insignia, flags, patches or mission identifiers.
- Status colour never alone (icon + label), keyboard reachable, reduced motion respected.

## Interpretation decisions (gaps between given tiers)
- Continuous values between tiers (e.g. temp 37.55, glucose 99.5) fall into the adjacent watch tier.
- BP low: systolic < 90 or diastolic < 60 = watch. Crisis (>=180 or >=120) = action with a priority flag.
- Sleep: one night < 6 h that is not part of 3 consecutive = watch.
- Mood "3-day decline" = the last three daily readings are strictly decreasing.
- HRV: status uses the mean of the latest 7 days against the day 1-14 mean.
- Radiation 50% and 80% exactly = watch.

## Review Focus
1. Old Phase 1 localStorage (old imaging zones, no storylines) must be discarded: bump data version. Test in persistence.test.ts.
2. Manual reading on the same day as a simulated one must become "latest" (compare timestamps, not days). Test in readings.test.ts.
3. HRV with fewer than 14 baseline days or none: no crash, sensible status. Test in status.test.ts.
4. Invalid form input (empty, text, out of plausible range, systolic <= diastolic): inline error, nothing saved. Smoke test.
5. Environment switch must change radiation rate and days remaining on screen. Smoke test.

## Tasks
1. **Sources + thresholds + status rules** (`data/sources.ts`, `data/thresholds.ts`, `lib/status.ts`, tests for every boundary). Commit.
2. **Simulation storylines + radiation** (`data/simulate.ts`, `lib/radiation.ts`, `data/environments.ts` delays, tests). Commit.
3. **Store: manual readings, data version 2** (`lib/store.ts`, `lib/persistence.ts`). Commit.
4. **Overview update** (coloured chips, radiation panel, context notes). Commit. Deploy milestone 1.
5. **Vitals page** (Recharts trend per vital, info disclosure, log forms, imaging list). Commit.
6. **Body Map** (SVG figure, 8 zones, side panel, roll-up tests). Commit. Deploy milestone 2.
7. **Sources page + About + README AI section + package description**, nav item. Commit.
8. **Verify** typecheck, lint, tests, build, smoke on dev / preview / production. Deploy milestone 3.
