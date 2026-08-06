# AGENTS.md

HoldTrue is a local-first study application. Electron + TypeScript. macOS is the primary target;
Windows and Linux must work for most features.

**Status: Anchor is built** (`src/index/anchor.ts`, 27 tests, mutation score 100%). Everything else is docs, a pre-commit hook, and two vendored skills.

What is true and what to do. For why, see [`docs/philosophy.md`](docs/philosophy.md),
[`docs/features/feynman.md`](docs/features/feynman.md) and [`docs/decisions.md`](docs/decisions.md);
load them only when challenging a decision or making one they cover.

## Who writes what

**You write the code.** Implementation, refactors, fixtures, setup, teardown, scaffolding,
build config, scripts, docs. That is the bulk of the work and it is yours.

**The human writes the test assertions**, and only those. Specifically: the one sentence
saying what correct means, the two or three examples that encode domain knowledge, and the
invariants stated in plain words. You turn an invariant into a property test once they have
stated it.

That is the whole restriction. It is narrow on purpose. It exists because agents given
human-written tests solve 94.3% of a standard benchmark and 69.8% writing their own, and
because 80.2% of agent-authored test patches in one large study asserted almost nothing.
Nothing else about your work is limited.

---

## Invariants

Not style preferences: a violation is wrong even if it works.

1. **No user-facing text originates from the model.** A user reads their own words, a verbatim
   source quote, or a codebase string. Model output reaching a user indexes owned content, or is
   quarantined.
2. **Quotes are validated as literal substrings** of the source before display; a non-matching
   quote is a rejected extraction, not a warning.
3. **No code path branches toward speech on a domain-knowledge value during elicitation.**
   Knowledge may suppress output, never produce it. Mechanically checkable; there must be a test.
4. **`confidence` means "how strong is my reason to stay quiet."** Not "how sure am I this is
   wrong." Code treating it as the latter is a bug.
5. **Anything that asks the user a question supplies the answer.** No feature ends on a finding.
6. **Findings are phrased at the task, never the person**: "You said X but not how Y", not "your
   explanation was shallow."
7. **No grade, score, or rung is displayed beside a diagnosis.** Briefly amended 2026-08-05 to
   permit traceable point-coverage, then reverted the same day: a four-way design panel
   independently declined to use the permission, including the design whose sole job was
   answering *do I need to study this again*. Reasoning in [`docs/decisions.md`](docs/decisions.md).
8. **Extraction is per-sentence, never one-shot over a whole explanation.**
9. **Never diff two extractions of the user's own words**; compare their explanation against their
   source material. (Both are ~0.5 F1, the difference noise; numbers in the feature doc.)

## Anchor format

One shape everywhere: every citation, extracted item, retrieval result.

```
{ doc_id, unit_id, char_start, char_end, quote }
```

`quote` must be a literal substring of the source at that offset. Build plain text by concatenating
extracted characters yourself, so offsets are yours by construction. IDs are content-addressed:
re-parsing must not reshuffle identity.

## Stack: use these, not the obvious alternative

| Use | Not | Why |
|---|---|---|
| `node:sqlite` | `better-sqlite3` | `loadExtension()` and FTS5 built in; no native rebuild on Electron bumps. **Verified 2026-08-05 inside Electron 43.3.0 / Node 24.18.1 / SQLite 3.53.1**: `ENABLE_FTS5` present, `bm25()` works. Ignore the many Node 22/23-era reports that FTS5 is missing — it was, and no longer is. `loadExtension()` needs `new DatabaseSync(path, { allowExtension: true })`. **Node 24 is the floor**, not 22 |
| Vectors as SQLite blobs + a worker-sharded flat scan | any vector DB | **Measured 2026-08-06**, 100k × 768 float32 in Node on an M5 Max: **52 ms** single-threaded, 12 ms across 4 workers, 6.4 ms across 8. The previously stated "2.3 ms" was unsourced and wrong by ~20×; it implies 67 GFLOP/s, which is a BLAS figure, not a JavaScript one — V8 does not auto-vectorize. The decision survives, the implementation gains `worker_threads` over a `SharedArrayBuffer`, about 40 lines. Expect 150–250 ms single-threaded on a mid-range Windows laptop |
| Hybrid BM25 + dense with RRF | dense only | Formulas, citations, proper nouns are exact-term queries |
| PDFium | PyMuPDF, Marker | Character index *is* the citation offset |
| Ollama over HTTP | bundling inference | Ollama already *is* `llama-server` |
| `utilityProcess.fork()` | renderer, main | Real Node, no Blink page scheduler |
| Qwen3.5 4B or larger for extraction | anything under 4B | Causal extraction collapses below 3B and 3B to 4B is untested, so 4B is the floor. **The app never downloads, stores or bundles a model**; Ollama does. Read `/api/tags` for what is installed, offer `/api/pull` if none is suitable |
| An embedding model served by Ollama | a cloud embedding API by default | Embedding a library sends the whole library: same explicit switch as web retrieval, never the default path |
| `@parcel/watcher` | chokidar | `writeSnapshot()`/`getEventsSince()` handles cold start |
| Tavily, off by default | Google CSE, Brave | The others' free tiers are gone |

### Open questions in this table

None. Both former entries were closed 2026-08-06 and moved to rejected rows in
[`docs/decisions.md`](docs/decisions.md): **LettuceDetect** has no runtime *and* is redundant
given invariant 1 plus the exact-slice rejection in `src/index/anchor.ts`; **Astryx** never had
a recorded reason, a rejected alternative, or an entry in `package.json`.


## macOS rules

- `QOS_CLASS_UTILITY` in the indexing child. **Never `QOS_CLASS_BACKGROUND`**: it pins the process
  to efficiency cores.
- App Nap needs a native addon wrapping `beginActivityWithOptions`. Take it **per batch**, hold a
  strong reference to the token, release in `finally`. Never set `NSAppSleepDisabled`.
- Don't block sleep; checkpoint continuously and resume, since the sleep warning is near-zero.
- Never spawn `ollama serve` (a second fails on the held port). Send `{"keep_alive": 0}` at session
  end.
- Tray icon filenames must end in `Template`; hold a module-scope reference or GC removes the item.
- File watching: debounce 300–500 ms per path (atomic saves arrive as delete-then-add, not change),
  content-hash before re-embedding, subtree rescan on the dropped-events flag.
- **Signing is mandatory.** Electron 42 made unsigned apps fail notifications outright: Developer ID
  and notarization are a hard build requirement, not a release-time nicety.

## Do not build

Highlighting, rereading or summarizing affordances. Expanding intervals; use uniform ones.
Learner-driven scheduling. The Feynman feature on facts, vocabulary, or procedures. Each absence is
deliberate, justified in `docs/philosophy.md`.

## Testing

**Assertions only.** Per "Who writes what": in a test file you own all but the assertions and the
domain-knowledge examples, including more rows of a table they started. If you cannot make a test
pass, say why; never edit the assertion.

**Red-first is enforced.** A new test must be shown failing, with the failure reason, before any
implementation exists. Guards against tests written to confirm current behaviour.

**Banned in any test:** snapshot-only assertions, `toBeDefined()` as the sole check, mock-only tests
that never touch real logic, bare boolean assertions. The documented weak-oracle patterns.

**Coverage is not a target.** Controlling for suite size, its correlation with fault detection is
near zero. Gap-finder only: low is signal, high is not. Mutation testing (Stryker,
`--incremental`, nightly, deterministic core only) is the real check: surviving mutants are bug
reports, the score is noise.

**Fixtures are language-agnostic, frameworks are not.** Golden inputs and outputs as JSON, loaded by
a thin runner. Test public APIs, not internals. No Cucumber, no Pact: neither has the audience or
second team here.

**Property-based tests (fast-check) for anything with arithmetic or boundaries.** Highest value is
offset anchoring, `resolve(anchor(text, span)) === span`, over astral-plane and combining characters:
UTF-16 code-unit vs code-point confusion is silent and example tests never expose it. Also chunk
partitioning, retrieval order invariance, scheduling monotonicity.

**The LLM extraction step gets an eval harness, not tests.** Four layers: schema validation
hard-fails; invariants hard-fail as properties (every span resolves, no dangling endpoints, empty in
→ empty out); quality is aggregate precision/recall/F1 against gold labels, never per-case
pass/fail; regression is measured **paired** against the previous prompt on the same fixed set.
100–150 labelled items. No LLM judge: set comparison against gold.

**Structure.** All indexing, retrieval, extraction and scoring logic is plain TypeScript, no Electron
imports, under Vitest. A module needing Electron loaded to test has its seam in the wrong place.
`utilityProcess` must be a thin shell around a pure module: Playwright cannot evaluate code inside
it.

**Electron traps.** Playwright's Electron support is experimental and cannot intercept native
dialogs: mock at your own IPC layer. IPC structured clone silently drops class instances and
functions: version the channel payload as a schema and test serialization explicitly.

## Visual feedback loop

Electron speaks Chrome DevTools Protocol natively. Dev script runs with
`-- --remote-debugging-port=9333`; `agent-browser connect 9333` gives renderer screenshots and DOM
snapshots.

**A development ergonomic, not verification.** It sees the renderer only, not main or
`utilityProcess`, where most logic lives. A screenshot confirms a span *renders*, never that it is
the *right* span. Never let it gate anything.

## Hooks

Two checks run on every commit from `.githooks/pre-commit`. Enable them once per clone:

```
git config core.hooksPath .githooks
```

The first blocks a commit where a test file and its implementation both change and the test's
assertions were modified: the step 7 failure, an agent editing a test to make it pass. Commit the
test alone, watch it fail, then commit the fix. The second blocks the banned assertion patterns
under Testing.

Only these are non-skippable; everything else is a rule an agent can forget.

## Skills

Skills live in `~/.claude/skills/`: user level, shared machine-wide with every other project.
**Do not edit a skill file to suit this repo.** These rules apply instead.

### Do not use in this repo

**`/tdd`.** It has the agent write the failing assertion, and treats tests-before-implementation as
an anti-pattern in favour of one test and one implementation at a time. Both positions are correct
when one person alternates test and code; neither is correct here, where they are split between human
and an agent and the entire gain comes from the human writing the tests first. If told to use it,
refuse and point at this section.

**`/implement`.** Implementing is not off limits; this skill is: it chains into `/tdd` and commits
unasked. Implement directly.

**`/to-spec`.** Optimises for the fewest possible seams, stating the ideal number is one. This repo
requires the opposite: every piece testable without the others present.

### Use the vendored fork, not the upstream one

Vendored into `.claude/skills/`; use these, not their upstream namesakes:

**`/holdtrue-code-review`** over `/code-review`: adds a refutation stage, every finding attacked
before you see it, only survivors reported. Upstream ships *"Do not merge or rerank findings"* and
hands everything over raw.

**`/holdtrue-diagnosing-bugs`** over `/diagnosing-bugs`: Phase 5 hands the minimised repro to the
human to write the regression assertion. Every other phase is identical.

Both are MIT, from Matt Pocock's collection; attribution in `.claude/skills/LICENSE-mattpocock`.

### Issue tracker

GitHub issues. Skills that read or write tickets (`/triage`, `/to-tickets`, `/wayfinder`) need the
GitHub remote to exist and be reachable.

## Build order

**Single source: [`docs/decisions.md`](docs/decisions.md).** It was written out here too, and the
two drifted until a third copy in the feature doc contradicted both and deferred the project's
one kill switch behind a month of work. Do not restate it again — link to it.
