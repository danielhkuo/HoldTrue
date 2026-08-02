# Decisions

Technical decisions and the reasons behind them. The philosophy lives in
[`philosophy.md`](philosophy.md) and [`features/`](features/), and the evidence lives in
[`research/evidence-base.md`](research/evidence-base.md). This file does not repeat any of
them.

**HoldTrue** is the platform. **Feynman** is the first feature.

## Stack

| Decision | Why | Rejected |
|---|---|---|
| **Electron** | The only candidate where sidecars, SQLite extensions, and three-platform E2E testing are all first-party and documented. `node:sqlite` now has `loadExtension()` with FTS5 built in. | **React Native**: no Linux path at all, no `child_process` (Hermes), and no in-support Windows/macOS version pair. **Electrobun**: no sidecar docs, Linux testing upstream-blocked, bus factor 1. **Tauri**: the SQL plugin can't load extensions (open 2yr), no macOS find-in-page, two macOS 26 crashes. **Flutter** is the fallback if Electron becomes untenable. |
| **Ollama, or bring your own API key** | No bundled inference, which means no signing, no notarization entitlements, and no giant installer. Ollama 0.32.4 *is* `llama-server`, so bundling llama.cpp buys nothing. | **MLX**, deferred: Apple-only, a permanent second code path, and Ollama already uses Metal. |
| **Qwen3.5 (4B extract, 9B generate)** | Apache-2.0 across all sizes. Fetched on first run, never shipped. | Gemma 4: non-OSI license on weights. |
| **SQLite via `node:sqlite`** | Vectors as blobs, FTS5 for the keyword half, and one flat matmul for search. 100k × 768 measures at 2.3 ms. Hybrid keyword+dense, because study material is full of formulas and proper nouns that embeddings fumble. | Any vector database. Not warranted at this scale. |
| **PDFium** | The character index *is* the citation offset, which is exactly what span anchoring needs. | PyMuPDF, which is AGPL. That is no longer a licensing conflict since we are AGPL too, but PDFium is still the better technical fit and doesn't entangle forks. |
| **Tavily, off by default** | 1,000 requests/month free, no card, and its terms permit app integration. | Google CSE (closed to new customers), Brave (free tier killed Feb 2026). |
| **LettuceDetect v2** | 307M, MIT, and it returns *which spans* are unsupported rather than a yes/no. | None. |
| **Astryx** (`@astryxdesign/core`) | Not recorded. | None. |
| **AGPL-3.0** | Not recorded. | PolyForm Noncommercial: not OSI, and ambiguous for a study tool. |

## Workflow

The operational rules are in [`../AGENTS.md`](../AGENTS.md). The reasoning behind them is
here.

**Tests are the specification, and they are written by hand.** TDFlow (Jan 2026) measured
agents at **94.3% on SWE-Bench Verified with human-written tests versus 69.8% writing their
own**, a gap of 24 points, and their stated conclusion is that the bottleneck is now writing
valid tests rather than resolving issues. The matching failure mode has been quantified as
well: across 86,156 test-file patches in 33,596 agent PRs, **80.2% had weak or no oracle
signal**. Agents write tests that confirm what the code already does.

The human owns the *oracle*, not the enumeration. Scaffolding, fixtures and mechanical table
expansion can be delegated. Deciding what correct means cannot. Red-first runs and mutation
testing are the mechanical backstops, which is why agent-written tests do not all need
reading.

**Coverage is rejected as a target.** Inozemtseva & Holmes (ICSE 2014) found that once suite
size is controlled for, the correlation with fault detection collapses, in one project from
0.85 to essentially zero. Coverage measures execution, never assertion. Mutation testing is
the better instrument, but it is not a score target either. Google, across 30,000
developers, found developers judged 85% of mutants unproductive and concluded that mutation
adequacy is "neither practical nor desirable."

**Language-agnostic test *frameworks* are rejected as ceremony.** Pact needs two
independently deployable teams, and Gherkin's value is a non-engineer audience. Neither
exists here. Language-agnostic *fixtures* (golden JSON, a thin runner, public APIs) deliver
the actual benefit at zero cost.

**Agent fan-out is for design and review, not construction.** The adversarial panel works
where the artifact is an argument and independent judgement is the product. For code the
ground truth is "do the tests pass," which is cheaper and more reliable to check by running
the tests than by convening critics. Parallel builders also need independent, well-specified
units, which a greenfield repo does not have.

Fan out on four things: **the eval set** (100–150 labelled explanations, which are fully
parallel and independently verifiable), **design decisions**, and **daily code review**
across dimensions, with findings adversarially verified before being believed.

The fourth is a deliberate exception to the rule above: **one** contest of independent
implementations, for the extraction pipeline only. That is construction fan-out, which the
rule otherwise forbids. It is justified there because the eval harness gives that one piece
something the rule assumes is missing, a cheap objective judge, so the implementations can be
scored rather than argued over. Nothing else in the project has that.

**Visual loop.** Electron speaks CDP natively, so `--remote-debugging-port=9333` plus
`agent-browser` closes the build-launch-look cycle. It covers the renderer only, and a
screenshot is a weak oracle. Treat it as an ergonomic, never as a gate.

## macOS

Battery was investigated, and the framework is not the variable. An idle webview draws
~25 mW against a ~3–5 W machine floor, and the only controlled Safari-vs-Chrome test
favoured Chromium by ~9%, which is inside its own noise. What matters is where the work
runs.

- **Indexing goes in `utilityProcess.fork()`.** That gives real Node with no Blink page
  scheduler. Set `QOS_CLASS_UTILITY` inside the child. Never `QOS_CLASS_BACKGROUND`: it pins
  to E-cores.
- **App Nap will hit a menu-bar app.** Electron has no binding for it, so a small native
  addon wrapping `beginActivityWithOptions` is required. Take it **per batch**, hold a
  strong reference to the token, and release in `finally`. Never set `NSAppSleepDisabled`.
- **Don't block sleep.** Checkpoint continuously and resume, because the warning before
  sleep is near-zero. `powerMonitor` supplies AC/battery, thermal state and CPU speed-limit.
  Low Power Mode and battery percentage need the same addon.
- **Ollama: don't manage its lifecycle.** A second `ollama serve` fails on the held port.
  Idle cost is real but tiny: zero with no model loaded, and about half an idle text editor
  with one loaded, where the true cost is 4 GB resident. Send `{"keep_alive": 0}` when a
  session ends to reclaim it.
- **Tray.** The icon filename must end in `Template` for dark mode. Hold a module-scope
  reference or GC removes it. Use `setActivationPolicy('accessory')` with `LSUIElement: 1`.
- **Scheduled reminders when quit are not possible.** A LaunchAgent cannot post
  notifications, because Apple requires a user context. Stay resident as an accessory
  menu-bar process registered via `SMAppService`. **Signing is mandatory**: Electron 42 made
  unsigned apps fail notifications outright.
- **File watching:** use `@parcel/watcher`. Its `writeSnapshot()` / `getEventsSince()` pair
  reconciles changes made while the app was closed without a full walk. Debounce 300–500 ms
  per path, because atomic saves arrive as delete-then-add rather than change, and
  content-hash before re-embedding. Handle the dropped-events flag with a subtree rescan.
- **Focus enforcement:** Screen Time / FamilyControls is iOS and Catalyst only, not macOS.
  The realistic scope is `NSApplicationPresentationOptions` with `disableProcessSwitching`
  (kills ⌘-Tab, no entitlement, needs a native addon since Electron's `setKiosk` doesn't set
  it). Real system-wide blocking is a NetworkExtension filter plus an admin helper, which is
  a project in itself.

## Roadmap constraints

Planned: study calendar, topic parser, document explorer with Obsidian, Pomodoro, focus
enforcement, pinned browser view. Three things have to be right **now**, because everything
else reads from them.

1. **Content-addressed, stable IDs in the index.** Re-parsing a document must not reshuffle
   topic identity, or the calendar silently breaks months later.
2. **One anchor format everywhere**, `{doc_id, unit_id, char_start, char_end, quote}`, with
   the quote verified as a literal substring. Feynman needs it for citations, and the topic
   parser and retrieval practice read the same chunks.
3. **Incremental re-indexing.** An Obsidian vault is thousands of files that change
   constantly. A full re-index per save is unusable.

Separately, schedule retrieval practice and Feynman sessions **independently**. Spacing is
well evidenced for retrieval. There is no evidence that repeating an explain-back loop on
the same topic helps, and one finding suggests the effect is not topic-specific.

Obsidian needs no plugin to *read*, because a vault is a folder of markdown. A plugin is
only for writing back, and it belongs in its own repo.

## Build order

1. **Index and anchor schema.** Everything depends on it.
2. **Extraction harness plus ~100 labelled explanations.** No benchmark exists for this
   exact task, which is pulling named concepts and asserted causal links out of a learner's
   short explanation. The 4B recommendation is extrapolated from adjacent work. If a small
   local model can't do it, the headline feature is cloud-only or doesn't exist. Find that
   out before there is a UI on top. The harness is also the test suite for the hardest
   component.
3. **Feynman.**
4. Everything else.

## Open

- Local STT and TTS. Unresearched.
- Whether a persona asks the probe. The manifesto permits it: a character may ask, but it
  may never assert.
- Repo name and the public push. `origin` points at a deleted remote and must be repointed.
