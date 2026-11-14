# Detailed description

## What it does

VIGIL is a health console for a four-person crew on a Mars mission. It helps astronauts who are not physicians look after themselves and each other when Earth is minutes away. It answers three questions.

**What is my status?** The Overview shows the latest reading of each vital sign (heart rate, blood pressure, heart rate variability, core temperature, blood glucose, sleep, mood, cognitive readiness, blood oxygen and a daily vision self-check). Each reading is rated nominal, watch or action. Every rating uses a colour, an icon and a word, and every threshold shows where it comes from.

**Why does it matter here?** The Body Map groups readings into eight body systems and links each one to the NASA Human Research Program risks that affect it. The crew can switch between four environments (spacecraft transit, orbital station, pressurized rover and Mars surface base). The environment changes the signal delay to Earth, the ranking of the five spaceflight hazards, and the radiation dose rate. The radiation panel shows career dose against NASA's 600 mSv limit and how many days are left at today's rate.

**What do I do now?** The Triage page lists every watch or action reading, most urgent first. Each alert opens a guided protocol in four parts: confirm the reading, check for red-flag symptoms, take low-risk self-care steps, and escalate. Each step is timestamped and saved, so a protocol can be resumed. If Earth is less than a second away, VIGIL tells the crew to consult the flight surgeon now. On the Mars mission it tells them to complete the first steps without waiting, then send a brief. The Downlink page builds that brief as a few kilobytes of plain text.

A Routine page supports prevention with a daily checklist (exercise, sleep, nutrition, check-ins, a vision check), points and streaks. Exercise adherence feeds the rating for bones and muscles.

## How it works

VIGIL is a single-page web app that runs entirely in the browser, with no server or account. Thresholds are stored as data, each value with its unit and source, and a set of pure, unit-tested functions turns readings into ratings, alerts, protocol state and the brief. Where published figures leave a gap, the rule is labelled as a team rule and is not presented as clinical fact. Protocols never name medicines or doses.

The demo uses a seeded simulation of 30 mission days with two storylines: the flight engineer builds up sleep debt from day 22, and the mission specialist develops a 38.3 °C fever on day 29. A guided tour walks a new visitor through the fever case from alert to downlink in about a minute.

## Benefits

- The crew can act on a health concern straight away instead of waiting up to 45 minutes for a reply from Earth.
- Every number is traceable to its source, which helps the crew and the ground trust and check it.
- The brief gives flight surgeons a short, timestamped record of what was measured and what was done.
- Routine and streaks encourage the daily habits that help the body cope with long missions.

## What we hope to achieve

We want to show that an Earth-independent health tool can be clear, honest about its limits, and grounded in NASA data. Next steps would be input from real wearables and medical devices, an offline tablet build, and review of every rule and protocol by flight surgeons.

## Tools, languages and software

TypeScript, React, Vite, Tailwind CSS, Motion, Zustand, React Router, Recharts, lucide-react icons, IBM Plex fonts, Vitest, oxlint and Playwright (for browser tests, screenshots and the deck PDF). Hosted on Vercel, code on GitHub. Code was written with the assistance of Claude (Anthropic), directed and reviewed by the team.

## Team

<!-- team:start -->
**Pandanauts**

- Ahmad Kura Muhammad, Team Lead
- Muhammad Danjuma, [AI Engineer]
<!-- team:end -->

Live app: https://vigil-pandas.vercel.app | Repository: https://github.com/Kuraam/vigil
