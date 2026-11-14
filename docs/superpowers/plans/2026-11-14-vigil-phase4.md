# VIGIL Phase 4: Demo polish and pitch readiness

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** A judge opening the link cold understands VIGIL in a minute; the repo, README, submission text, screenshots and a 7-slide deck are ready to submit.

**Architecture:** Team identity lives in one file, `team.json` (repo root). The app imports it; `scripts/sync-team.mjs` writes it into README, submission files and the deck between `<!-- team:start -->` / `<!-- team:end -->` markers. The tour is a non-modal, keyboard-operable panel driven by a small unpersisted Zustand store; each stop navigates, sets demo state and highlights a `data-tour` target. Screenshots and the deck PDF are produced by playwright-core scripts so they can be regenerated.

## Global Constraints
- Team name: Pandanauts (replaces "Team Pandas" everywhere). Members exactly as supplied.
- Deck: exactly 7 slides, 16:9, real screenshots only, no NASA logos, no AI images.
- Footer disclaimer on every page; reduced motion respected; tour skippable with Escape.
- Submission text: plain English, no hype words.

## Tasks
1. Rename to Pandanauts; `team.json`; sync script. Commit.
2. Protocols: vision change, low exercise adherence (+ tests). Reset demo data with confirm (+ test). Commit.
3. Start-here panel and 6-stop tour (+ smoke). Commit, push.
4. Polish pass at 1440 / 1024 / 768 / 390 px; fix issues. Commit.
5. Screenshots script (1920×1080, seeded state) → docs/screenshots/. Commit.
6. Deck HTML in docs/deck/, render to PDF (7 pages) → docs/ and public/. Commit.
7. README final; docs/submission/*.md. Commit, push.
8. Verify: typecheck, lint, tests, build, smoke on dev/preview/prod, PDF and repo open with no login.
