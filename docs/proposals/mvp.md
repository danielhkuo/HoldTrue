# Proposal: the path to the MVP

**Status: drafted 2026-08-25. The owner has not ruled on it. `docs/decisions.md` owns the build
order. This file proposes entries. It does not set them.**

## Where the product stands

Both phases run. The end-to-end check of 2026-08-25 passed all six gates against the real
service. The review found the planted gap and named the missing step, with the unverified label,
after the child failed to drive the person to it. That is the product doing its one job: the
child makes the person produce, and the review finds the step the person never said.

The code is not the blocker. Three things block the MVP.

## Blocker 1: three open decisions

Decisions 2, 3 and 4 in `docs/decisions.md` stay open. This proposal recommends an answer for
each. The owner rules.

- **The quiet child (2).** Ship the MVP with the button only. Rule 44 already says the quiet
  child is a later build. No new work.
- **The topic gate (3).** Ship the MVP with the curated list only. The "Something else" button
  stays as it is. A typed topic needs the gate, and the gate is out of scope.
- **The end phase with the toggle off (4).** Keep it on. One observation supports it: the
  2026-08-25 run found the gap with the startup model and labeled the finding unverified. One
  observation is not a measurement. Blocker 3 buys more.

## Blocker 2: no real person has ever used the product

Every transcript in this repository is a machine talking to itself. The MVP gate is three real
sessions: the owner, typed input, three curated topics, the review read on the screen. The app
saves nothing, so the owner takes their own notes. Each session ends with one question: did the
review name a step you truly could not say? A "no" becomes a case in `docs/cases.md`.

## Blocker 3: the end phase has one observation

Run `npm run e2e` nine times: three topics, three runs each. Count on the screen, by hand: the
review ran, the review named the planted step, the label was right. Rule 29 holds. The counts
stay engineering counts. If the gap-named count is low with the toggle off, decision 4 reopens.

## Not in the MVP

Voice input. The omniscient toggle with a real provider key in daily use. The quiet child. The
topic gate. Electron packaging: `npm run app` and a browser is the MVP delivery. Case M4 closure
quality: the Close step runs, and nobody has judged its statements; that is a study for later.

## The order this proposes

1. The owner rules on decisions 2, 3 and 4.
2. The nine end-to-end runs. Half a day.
3. The three real sessions. One evening.
4. The cases from step 3 become the next build list.
