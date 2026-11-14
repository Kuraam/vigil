# VIGIL Phase 3: Triage, protocols, environment priorities, Routine, Downlink

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Turn ratings into action: an alert queue with guided 4-part protocols and a comm-delay escalation rule, environment hazard priorities, a gamified daily Routine that feeds exercise adherence, and a plain-text Downlink brief.

**Architecture:** All logic is pure and tested in `src/lib/` (`health.ts`, `alerts.ts`, `protocolRun.ts`, `escalation.ts`, `routine.ts`, `brief.ts`); content is data in `src/data/` (`protocols.ts`, `priorities.ts`, `routineTasks.ts`). The store adds `routine`, `runs`, `speWarning` and `briefQuestions` (data version 3). Pages consume one pure `computeCrewHealth()` so the single-crew and whole-crew views agree.

**Spec:** the Phase 3 brief (user message, 2026-11-14). Protocol text uses only the supplied content.

## Global Constraints
- No medication names or doses. Treatment line, verbatim: "Use the onboard medical kit only as directed by the crew medical officer or flight surgeon."
- Every protocol carries "Concept guidance for demonstration. Not medical advice."
- Any red-flag "yes" escalates immediately. Earth reply ETA = 2 × one-way delay.
- Status never colour alone; calm professional gamification (no cartoon styling).
- Same seed; new random streams (SpO2, routine) use their own PRNG so Phase 2 storylines are unchanged.

## Decisions
- Core routine tasks (for streaks): all except "Crew connection" (bonus).
- "Log morning vitals" is derived from readings; "Vision self-check" is done when a vision answer exists that day. Others are checkboxes.
- Exercise adherence window = mission days (today − 6) … today.
- Alerts without a matching protocol (e.g. low temperature) still show, with the escalation rule.

## Review Focus
1. Resume: reopening an alert with an unfinished run resumes it, not a new run. Test in protocolRun.test.ts.
2. Re-measure inside a protocol updates status and the alert at once. Smoke test.
3. Station vs Mars escalation text and ETA. Test in escalation.test.ts.
4. Stale Phase 2 saved data is regenerated (version 3). Test in persistence.test.ts.
5. Brief stays plain text with timestamps and size. Test in brief.test.ts.

## Tasks
1. Indicators: SpO2, vision self-check, exercise adherence (thresholds, sources, sim, status, tests). Commit.
2. Routine model + seeded history + streak/adherence/points maths (tests). Commit.
3. Store v3 + `computeCrewHealth` + zones re-linked. Commit.
4. Alerts, protocols, escalation, protocol runs (tests) + Triage page and runner. Commit, push.
5. Environment priorities + escalation badge + due-now in top bar. Commit.
6. Routine page. Commit, push.
7. Downlink brief (tests) + page. Commit.
8. Smoke end-to-end path, verify dev/preview/prod, push.
