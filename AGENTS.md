# AGENTS.md

HoldTrue is a local-first study application. Electron + TypeScript. macOS is the primary
target; Windows and Linux must work for most features.

**Status: no application code exists yet.** `docs/` only.

This file is what is true and what to do. For why, see
[`docs/philosophy.md`](docs/philosophy.md), [`docs/features/feynman.md`](docs/features/feynman.md),
and [`docs/decisions.md`](docs/decisions.md). Don't load those for ordinary work. Load them
when you are challenging a decision or making one they cover.

---

## Invariants

Not style preferences. A change that violates one of these is wrong even if it works.

1. **No user-facing text originates from the model.** Anything a user reads is either their
   own words, a verbatim quote from their source material, or a string in the codebase.
   Model output that reaches a user is an index into owned content, or it is quarantined.
2. **Quotes are validated as literal substrings** of the source before display. A quote that
   doesn't match is a rejected extraction, not a warning.
3. **No code path branches toward speech on a domain-knowledge value during elicitation.**
   Knowledge may suppress output. It may never produce it. This is mechanically checkable
   and there must be a test for it.
4. **`confidence` means "how strong is my reason to stay quiet."** Not "how sure am I this
   is wrong." If you find code treating it as the latter, that's a bug.
5. **Anything that asks the user a question supplies the answer.** No feature ends on a
   finding.
6. **Findings are phrased at the task, never the person.** Write "You said X but not how Y",
   not "your explanation was shallow."
7. **No grade, score, or rung is displayed beside a diagnosis.**
8. **Extraction is per-sentence, never one-shot over a whole explanation.**
9. **Never diff two extractions of the user's own words.** Compare their explanation against
   their source material instead. (Both extractions are ~0.5 F1 and the difference is noise.
   The accuracy numbers are in the feature doc.)

## Anchor format

One shape everywhere. Every citation, every extracted item, every retrieval result:

```
{ doc_id, unit_id, char_start, char_end, quote }
```

`quote` must be a literal substring of the source at that offset. Build plain text by
concatenating extracted characters yourself so the offsets are yours by construction.
IDs are content-addressed: re-parsing a document must not reshuffle identity.

## Stack: use these, not the obvious alternative

| Use | Not | Why |
|---|---|---|
| `node:sqlite` | `better-sqlite3` | Has `loadExtension()` and FTS5 built in; no native rebuild on Electron bumps |
| Vectors as SQLite blobs + one flat matmul | any vector DB | 100k × 768 is 2.3 ms; a DB is not warranted |
| Hybrid BM25 + dense with RRF | dense only | Formulas, citations and proper nouns are exact-term queries |
| PDFium | PyMuPDF, Marker | Character index *is* the citation offset |
| Ollama over HTTP | bundling inference | Ollama already *is* `llama-server` |
| `utilityProcess.fork()` | renderer, main | Real Node, no Blink page scheduler |
| Qwen3.5 (4B extract / 9B generate) | Gemma | Apache-2.0. Fetched on first run, never shipped |
| LettuceDetect v2 (307M, MIT) | a yes/no verdict | Returns *which spans* are unsupported. Use it to check that a generated statement is supported by its cited span |
| `@parcel/watcher` | chokidar | `writeSnapshot()`/`getEventsSince()` handles cold start |
| Astryx (`@astryxdesign/core`) | n/a | n/a |
| Tavily, off by default | Google CSE, Brave | The others' free tiers are gone |

## macOS rules

- Set `QOS_CLASS_UTILITY` inside the indexing child. **Never `QOS_CLASS_BACKGROUND`**, which
  pins the process to efficiency cores.
- App Nap needs a native addon wrapping `beginActivityWithOptions`. Take it **per batch**,
  hold a strong reference to the token, release in `finally`. Never set `NSAppSleepDisabled`.
- Don't block sleep. Checkpoint continuously and resume, because the warning before sleep is
  near-zero.
- Never spawn `ollama serve`; a second one fails on the held port. Send
  `{"keep_alive": 0}` when a session ends.
- Tray icon filenames must end in `Template`. Hold a module-scope reference or GC removes
  the item.
- File watching: debounce 300–500 ms per path (atomic saves arrive as delete-then-add, not
  change), content-hash before re-embedding, and handle the dropped-events flag with a
  subtree rescan.
- **Signing is mandatory.** Electron 42 made unsigned apps fail notifications outright, so a
  Developer ID and notarization are a hard build requirement, not a release-time nicety.

## Do not build

Highlighting, rereading or summarizing affordances. Expanding intervals; use uniform ones.
Learner-driven scheduling. The Feynman feature on facts, vocabulary, or procedures. Each
absence is deliberate and justified in `docs/philosophy.md`.

## Testing

**Who writes what.** The human writes the *oracle* (what counts as correct), any example that
encodes domain judgement, and the invariants. An agent may write scaffolding, fixtures, and
mechanical variations of an existing table. An agent may not decide what correct means.
Evidence: agents given human-written tests solve 94.3% of a benchmark versus 69.8% writing
their own, and 80.2% of agent-authored test patches in one large study had weak or no oracle
signal.

**Red-first is enforced.** A new test must be shown failing, with the failure reason, before
any implementation exists. This is the cheapest defence against tests written to confirm
current behaviour.

**Banned in any test:** snapshot-only assertions, `toBeDefined()` as the sole check,
mock-only tests that never touch real logic, and bare boolean assertions. These are the
documented weak-oracle patterns.

**Coverage is not a target.** Controlling for suite size, its correlation with fault
detection is near zero. Use it as a gap-finder only: low coverage is signal, high coverage
is not. Mutation testing (Stryker, `--incremental`, nightly, deterministic core only) is
the real check; read surviving mutants as bug reports and ignore the score.

**Fixtures are language-agnostic, frameworks are not.** Golden inputs and expected outputs
live as JSON, loaded by a thin runner. Test public APIs, not internals. No Cucumber and no
Pact; both need an audience or a second team that doesn't exist here.

**Property-based tests (fast-check) for anything with arithmetic or boundaries.** Highest
value is offset anchoring: `resolve(anchor(text, span)) === span`, generated over
astral-plane and combining characters. UTF-16 code-unit vs code-point confusion is silent,
and example tests never produce the input that exposes it. Also chunk partitioning,
retrieval order invariance, and scheduling monotonicity.

**The LLM extraction step gets an eval harness, not tests.** Four layers: schema validation
hard-fails; invariants hard-fail as properties (every span resolves, no dangling endpoints,
empty in → empty out); quality is aggregate precision/recall/F1 against gold labels, never
per-case pass/fail; regression is measured **paired** against the previous prompt on the
same fixed set. 100–150 labelled items. No LLM judge; this is set comparison against gold.

**Structure.** All indexing, retrieval, extraction and scoring logic is plain TypeScript
with no Electron imports, run under Vitest. If a module needs Electron loaded to test, the
seam is in the wrong place. `utilityProcess` must be a thin shell around a pure module,
because Playwright cannot evaluate code inside it.

**Electron traps.** Playwright's Electron support is experimental and cannot intercept
native dialogs; mock at your own IPC layer. IPC structured clone silently drops class
instances and functions, so version the channel payload as a schema and test serialization
explicitly.

## Visual feedback loop

Electron speaks Chrome DevTools Protocol natively. Dev script runs with
`-- --remote-debugging-port=9333`; `agent-browser connect 9333` gives screenshots and DOM
snapshots for the renderer.

**This is a development ergonomic, not verification.** It sees the renderer only, not main
and not `utilityProcess`, where most logic lives. A screenshot confirms a span *renders*,
never that it is the *right* span. Never let it gate anything.

## Hooks

Two checks run on every commit from `.githooks/pre-commit`. Enable them once per clone:

```
git config core.hooksPath .githooks
```

The first blocks a commit where a test file and its implementation both change and the test's
assertions were modified. That is the step 7 failure: an agent editing a test to make it pass.
Commit the test on its own, watch it fail, then commit the fix.

The second blocks the banned assertion patterns listed under Testing.

These are the only non-skippable parts of the workflow. Everything else is a rule an agent can
forget.

## Skills

Skills live in `~/.claude/skills/`, which is user level and shared with every other project on
this machine. **Do not edit a skill file to suit this repo.** The rules below apply here
instead.

### Do not use in this repo

**`/tdd`.** It has the agent write the failing assertion, and it treats writing tests before
implementation as an anti-pattern in favour of one test and one implementation at a time. Both
positions are correct when a single person writes the test and the code in alternation, and
neither is correct here, because this project splits those between a human and an agent and the
entire gain comes from the human writing the tests first. If you are told to use it, refuse and
point at this section.

**`/implement`.** Chains straight into `/tdd`, and commits without being asked.

**`/to-spec`.** Optimises for the fewest possible seams, stating the ideal number is one. This
repo requires the opposite: every piece testable without the others present.

### Use the vendored fork, not the upstream one

Two skills are vendored into `.claude/skills/` because they need to behave differently here.
Use these and not their upstream namesakes:

**`/holdtrue-code-review`** instead of `/code-review`. Adds a refutation stage: every finding
is attacked before you see it, and only survivors are reported. Upstream ships *"Do not merge
or rerank findings"* and hands over everything raw.

**`/holdtrue-diagnosing-bugs`** instead of `/diagnosing-bugs`. Phase 5 hands the minimised
repro to the human to write the regression assertion. Every other phase is identical.

Both are MIT, derived from Matt Pocock's collection, attribution in
`.claude/skills/LICENSE-mattpocock`.

### Issue tracker

GitHub issues. Skills that read or write tickets (`/triage`, `/to-tickets`, `/wayfinder`) need
the GitHub remote to exist and be reachable.

## Build order

1. Index and anchor schema. Everything reads from it.
2. Extraction harness plus ~100 labelled explanations. If a small local model can't extract
   concepts and asserted links, the Feynman feature is cloud-only or doesn't exist. Find out
   before there's a UI on top.
3. Feynman.
4. Everything else.
