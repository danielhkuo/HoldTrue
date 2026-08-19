# AGENTS.md

Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend most of the response on the main answer. When asked to explain something, give a high-level summary unless an in-depth explanation is specifically requested.

HoldTrue is a local-first study application. Electron + TypeScript. macOS is the primary target;
Windows and Linux must work for most features.

**Status: Anchor is built** (`src/index/anchor.ts`, 30 tests, mutation score 100%) — still correct,
still the right module the moment a quote is shown, but as of 2026-08-07 it is optional
infrastructure rather than the shape everything a user reads is built from. See *Anchor format*
below. **Corrected 2026-08-12:** `src/` now holds fourteen files — eleven modules and three test files.
`index/anchor.ts`, plus `feynman/`'s extract, validate, normalise, cohere, tally, model, words,
notice, voice and demo; `notice`, `voice` and `words` are retired by `child-speech.md` ruling 11 and
not yet deleted, and `cohere` is a skeleton with no spec and no tests. The rest is docs, a
pre-commit hook, and three skills in `.claude/skills/`.

**What runs, as of 2026-08-19: the child, and one model call per turn.** Extract, validate, Cohere,
the tally, Supply and Contradict are **dormant** — off the live path, not deleted, and each returns
only when someone shows it improves what the child says. The child and its prompt are the product,
so a prompt change is product work rather than tuning. The decision, the probe results behind it and
the re-admission rule are one row in [`docs/decisions.md`](docs/decisions.md), *The child is the
product, and determinism returns as prompt material*; read it before touching anything under `src/feynman/`.
Several sections below were written for the pipeline while it was live. Every one that the pivot
reaches is marked with its date, and nothing is deleted — a rule governing a dormant piece still
governs it the moment the piece comes back.

**Read this before anything else: on 2026-08-07 the notes-only constraint was repealed.** The old
Law 2 — *every sentence traces to the user, to a quoted passage in their material, or to plain
code* — is gone in its entirety, and model knowledge is now the default source of a finding. A
different Law 2 stands in its place in [`docs/philosophy.md`](docs/philosophy.md); do not assume you
know what it says from the number. Local-first is untouched: nothing leaves the device unless you turn
something on, and the floor is the best model the machine can run, not a cloud call. Retrieval
against the user's material survives as an optional path, not the default one. Several rules below
were written under the old constraint. Every one that changed is marked with its date and its
reason, and nothing was deleted quietly — if a rule you remember is missing, look for it struck
through rather than assuming it still binds.

What is true and what to do. For why, see [`docs/philosophy.md`](docs/philosophy.md),
[`docs/features/feynman.md`](docs/features/feynman.md) and [`docs/decisions.md`](docs/decisions.md);
load them when challenging a decision or making one they cover — and load `philosophy.md` before
assuming anything about where a sentence is allowed to come from, since that is the part that moved.

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

**Numbers are permanent addresses, not positions in a list.** The 2026-08-07 pivot repealed two of
these and split a third, and nothing was renumbered. Ten documents cite invariants by number —
`docs/specs/supply.md`, far the heaviest and the one that quotes every invariant it cites in full;
`docs/decisions.md`; `docs/features/feynman.md`; `docs/philosophy.md`; `docs/specs/anchor.md`;
`docs/specs/extract.md`; `docs/specs/child-speech.md`; `docs/research/extraction-benchmarks.md`;
`measurements/within-sentence/README.md`; `docs/workflow.md` — as do `src/index/anchor.ts`, its test
file, `src/feynman/validate.ts`, `src/feynman/validate.test.ts`, `src/feynman/tally.ts`,
`src/feynman/tally.test.ts`, `measurements/within-sentence/rate.mjs` (invariant 8 is its kill number),
`.claude/skills/holdtrue-workflow/SKILL.md` and the wayfinder archive. **Seven entries added
2026-08-12**, in two passes, by running the grep below, which is what the next paragraph asks of every reader and
what nobody had done since the roster was written.

**That roster is the instrument, so keep it complete.** It exists so that whoever repeals, narrows
or renumbers a rule can walk every citation of it and leave none stale — the failure mode is silent,
so a missing entry costs more than it looks like it should. Re-derive rather than trust it,
`grep -rIn -E "[Ii]nvariants? [0-9]" . --exclude-dir=.git`, and write back whatever the grep finds
that this list does not name. `/holdtrue-workflow` requires a piece to cite the invariants that
apply **by number and quoted in full**, because a number tells you where a rule lives and not
whether it is still in force, and `/holdtrue-code-review` requires every finding to cite one.
Renumbering would silently redirect all of that to a different rule, which is a worse failure than a
list with holes in it, because nothing would break loudly. So a repealed invariant keeps its number
and its strikethrough permanently: an agent who remembers "invariant 1" from a previous session
finds the repeal where the rule used to be.

1. ~~**No user-facing text originates from the model.**~~ **REPEALED 2026-08-07.** It was Law 2
   restated — the old Law 2, repealed entire the same day. It said: a user reads their own words, a
   verbatim source quote, or a codebase string; model output reaching a user indexes owned content
   or is quarantined. What it bought was that a confident falsehood had no route to the screen —
   hallucination was a validation failure, not a judgement call. That guard is now model capability,
   and the owner has explicitly assigned the choice of model to the user. **Do not re-import this
   from memory.** If you are about to write "invariant 1 forbids that", read
   [`docs/philosophy.md`](docs/philosophy.md) first: what replaced it lives there, and it is not
   this.
2. **Quotes are validated as literal substrings** of the source before display; a non-matching
   quote is a rejected extraction, not a warning. **Scope narrowed 2026-08-07, not repealed.** It
   used to cover nearly everything a user read, because nearly everything a user read was a quote.
   The default path now shows findings that quote nothing, so the invariant does not reach them. It
   binds unchanged wherever something *is* quoted: the optional RAG path, any citation, any span
   shown from the user's own transcript. `src/index/anchor.ts` is still where it is enforced for the
   whole codebase, and that has not moved.
3. ~~**No code path branches toward speech on a domain-knowledge value during elicitation.**~~
   **REPEALED 2026-08-07 as stated.** It was the old Law 2's mechanism — knowledge may suppress output,
   never produce it — and with model knowledge as the default source of a finding, a path from
   knowledge to speech is the design rather than the bug. **What it leaves is a hole worth naming.**
   This was the only invariant here that was mechanically checkable and said so: *there must be a
   test*. Whatever governs when the model may speak from its own knowledge should be checkable the
   same way, or the repo loses a check and will not notice, because nothing fails when a check stops
   existing. Nothing regressed on 2026-08-07 — `src/` held only `anchor.ts` and its test then, so the
   demanded test was never written. What was repealed is an accepted obligation, and an obligation is
   exactly the kind of thing that disappears without a failure. **The replacement is open and is
   deliberately not designed here.** Do not invent it in passing. Two rulings in
   `docs/decisions.md` — the connective table as a mute, and the child checking structure only —
   cite this invariant as their reason; whether they survive on other grounds is that file's
   business, not this one's.
4. **`confidence` means "how strong is my reason to stay quiet."** Not "how sure am I this is
   wrong." Code treating it as the latter is a bug. **Marked for review 2026-08-07; in force until
   reviewed.** Brake pressure was the old Law 2's consequence — a value that could only reduce
   output could not produce a confident wrong correction — and that law is gone, so the stated
   rationale went with it. The practice may well be right on its own terms: a model that now authors the finding has
   more reason to carry a brake, not less. But it is currently a rule with no argument under it,
   which this repo treats as not yet a decision. Do not silently keep it under the old reason and do
   not delete it on the strength of the reason having failed; if you need it settled, settle it in
   `docs/decisions.md` first.
5. **Anything that asks the user a question supplies the answer.** No feature ends on a finding.
6. **Findings are phrased at the task, never the person**: "You said X but not how Y", not "your
   explanation was shallow."
7. **No grade, score, or rung is displayed beside a diagnosis, unless the score has ground truth
   the diagnosis does not.** **Amended 2026-08-10**, and the exception currently admits exactly one
   thing: the **catch rate** on planted errors, where the system knows what it planted. Everything
   else stays banned beside a finding — no rating of an explanation, no progress ring, no clarity
   count — because none of those has ground truth. The amendment is not free and its cost is
   recorded in [`docs/philosophy.md`](docs/philosophy.md), which is where the rule now lives: it was
   taken **against** the grades-versus-comments evidence, not around it. Do not widen the exception
   from this sentence. Briefly amended once before, on 2026-08-05, to permit traceable
   point-coverage, then reverted the same day: a four-way design panel independently declined to use
   the permission, including the design whose sole job was answering *do I need to study this
   again*. Reasoning for both in [`docs/decisions.md`](docs/decisions.md).
8. **Extraction is per-sentence, never one-shot over a whole explanation.** **Unwarranted pending
   measurement, 2026-08-07.** It still governs — write per-sentence extraction, and do not widen
   what Extract reads on your own authority — but the published figure quoted as its warrant was
   traced to a keyword-filtered corpus of biomedical abstracts that cannot carry it, and the
   invariant was written four days before that citation arrived, so it was never derived from it
   either. Do not argue it either way from a published number. What settles it is the measurement
   in [`measurements/within-sentence/README.md`](measurements/within-sentence/README.md); why the
   warrant fell is in [`docs/decisions.md`](docs/decisions.md). Until that measurement runs, a
   design resting on this invariant being settled is resting on nothing. **Re-checked against the
   pivot, 2026-08-07: unchanged.** Extract still reads the user's own explanation, sentence by
   sentence, and the user's explanation is the input this governs. What moved is the other side —
   the source-side extraction is off the default path — and that does not reach this rule. The
   pending measurement is still pending; the pivot neither settles it nor excuses it. **Governs a
   dormant piece as of 2026-08-19.** Extract is off the live path, so nothing this invariant binds
   is currently running. It is not repealed and not weakened — when Extract returns it returns
   per-sentence, and it returns with this measurement still owed. Dormancy is not settlement, and a
   piece coming back does not get to arrive with the rule quietly widened.
9. **Never diff two extractions of the user's own words.** (Both extractions carry enough error that
   their difference is mostly extractor noise. The figures are in the feature doc; one of them was
   quoted as a frontier-model score until 2026-08-07, when it was traced to a 2020 system, so do not
   carry that reading of it anywhere.) ~~*compare their explanation against their source
   material*~~ — **that clause repealed 2026-08-07**, and the invariant split there. The clause was
   a prescription rather than a prohibition, and it named the only comparison the old architecture
   allowed; there is no source material on the default path now. The prohibition above it stands
   untouched, on reasoning that never involved the source: two noisy extractions of the same words
   have a difference that is mostly noise, whatever else exists. Where the optional RAG path does
   supply a source, comparing against it remains available — it is simply no longer what this
   invariant is *for*.

**Checked against the pivot and unchanged: 5, 6 and 7.** Re-derived, not assumed. Invariant 5 is
Law 1, which survives entire and binds harder now: what supplies the answer moved from a retrieved
passage to the model, but *something must supply it* was always the whole rule, and a model that
opens a gap it cannot close is exactly the failure Law 1 names. Invariant 6 governs the grammar of a
finding, not its provenance — a finding sourced from model knowledge can be phrased at the person
just as easily as one sourced from a note, so it needs the rule as much as before. Invariant 7 rests
on the grades-versus-comments evidence and on the EU AI Act's high-risk annex, neither of which says
anything about where a sentence originates; its 2026-08-05 amendment and same-day reversal stand as
recorded.

**Checked against the 2026-08-19 pivot: 2, 5, 6 and 7 bind the child; 8 and 9 govern dormant
pieces.** Re-derived, not assumed, and one of them lost its mechanism rather than its force.

- **5 still binds and now has nothing mechanical under it.** It is Law 1, and Law 1 was carried by
  Feynman's review phase, which produces nothing today. What supplies the answer is the child's
  prompt. The rule is unchanged; where it rests, and why that is weaker, is recorded in
  [`docs/philosophy.md`](docs/philosophy.md) under Law 1. **Do not read the missing mechanism as a
  relaxed rule.** A question the child cannot close is still a violation, and it is now a violation
  nothing will catch for you.
- **6 binds unchanged**, and reaches more text than before: every sentence a user reads is the
  child's, so the grammar rule is the only thing standing between a finding-shaped remark and a
  remark about the person.
- **7 binds, and its exception currently admits nothing.** The one score it permits beside a
  diagnosis is the catch rate on planted errors, and the plant ledger is dormant, so there is no
  score to display and no diagnosis to display it beside. Do not widen the exception to fill the
  gap.
- **2 binds wherever anything is quoted**, which on today's path means a span of the user's own
  transcript and nothing else. `src/index/anchor.ts` is still the enforcement point.
- **8 and 9 are unchanged and currently idle.** Both govern Extract, which is off the live path.
  Their reasoning is untouched by the pivot and travels back with the piece.

## Anchor format

One shape for anything that carries a source: every citation, every extracted item, every retrieval
result.

```
{ doc_id, unit_id, char_start, char_end, quote }
```

`quote` must be a literal substring of the source at that offset. Build plain text by concatenating
extracted characters yourself, so offsets are yours by construction. IDs are content-addressed:
re-parsing must not reshuffle identity.

**Demoted 2026-08-07, not deleted, and not weakened where it still applies.** This section used to
open *one shape everywhere*, on the premise that everything a user read was a span into something.
The default path now shows findings drawn from model knowledge, which have no source and therefore
no offsets, so this stopped being the shape everything reads from. It remains the only shape for
anything that does have a source: quotes on the optional RAG path, and the spans into the user's own
transcript that Extract still produces, which invariants 8 and 9 both presuppose. `src/index/anchor.ts`
is built, correct and untouched by the pivot — 30 tests, mutation score 100% — and it is still the
right module the first time a quote is shown to anyone, which is the case the format exists for.
**Open:** whether a finding with no source carries an anchor at all, and if not, what identifies it
for the UI, and for the narrow measurements a sourceless finding can still be scored by — the
quality eval of the finding itself is skipped by decision and is not what makes this urgent. Not
answered here.

## Stack: use these, not the obvious alternative

| Use | Not | Why |
|---|---|---|
| `node:sqlite` | `better-sqlite3` | `loadExtension()` and FTS5 built in; no native rebuild on Electron bumps. **Verified 2026-08-05 inside Electron 43.3.0 / Node 24.18.1 / SQLite 3.53.1**: `ENABLE_FTS5` present, `bm25()` works. Ignore the many Node 22/23-era reports that FTS5 is missing — it was, and no longer is. `loadExtension()` needs `new DatabaseSync(path, { allowExtension: true })`. **Node 24 is the floor**, not 22 |
| Vectors as SQLite blobs + a worker-sharded flat scan | any vector DB | **Measured 2026-08-06**, 100k × 768 float32 in Node on an M5 Max: **52 ms** single-threaded, 12 ms across 4 workers, 6.4 ms across 8. The previously stated "2.3 ms" was unsourced and wrong by ~20×; it implies 67 GFLOP/s, which is a BLAS figure, not a JavaScript one — V8 does not auto-vectorize. The decision survives, the implementation gains `worker_threads` over a `SharedArrayBuffer`, about 40 lines. Expect 150–250 ms single-threaded on a mid-range Windows laptop |
| Hybrid BM25 + dense with RRF | dense only | Formulas, citations, proper nouns are exact-term queries |
| PDFium | PyMuPDF, Marker | Character index *is* the citation offset |
| Ollama over HTTP | bundling inference | Ollama already *is* `llama-server` |
| `utilityProcess.fork()` | renderer, main | Real Node, no Blink page scheduler |
| ~~Qwen3.5 4B or larger for extraction~~ **superseded 2026-08-07** — the strongest model the machine can actually hold | a pinned small model, or one chosen to leave headroom | The pivot makes model capability the guard, so the floor moved from *large enough to extract* to *the best thing that fits*. On the development machine, an M5 Max with 36 GB, that is a **27–32B-class model at 4-bit, roughly 20 GB resident**, sharing 36 GB with a `whisper-server` sidecar and Electron — the owner's statement of the envelope, not a measurement. Class and memory budget only: **no model name and no benchmarked figure**, because neither has been measured here, and this table has already had one unsourced number traced and corrected — the "2.3 ms" in the vector-scan row, wrong by roughly 20×. The superseded row's reason, *"causal extraction collapses below 3B"*, was uncited when written and is still uncited; it is not evidence for the new floor either, and it should not be carried forward as though it were. **The app never downloads, stores or bundles a model**; Ollama does. Read `/api/tags` for what is installed, offer `/api/pull` if none is suitable |
| An embedding model served by Ollama | a cloud embedding API by default | Embedding a library sends the whole library: same explicit switch as web retrieval, never the default path |
| `@parcel/watcher` | chokidar | `writeSnapshot()`/`getEventsSince()` handles cold start |
| Tavily, off by default | Google CSE, Brave | The others' free tiers are gone |

### Open questions in this table

**The model floor, reopened 2026-08-07.** The row above states a class and a memory budget, not a
model and not an observation. Whether a 27–32B-class model at 4-bit genuinely coexists with
`whisper-server` and Electron inside 36 GB is arithmetic that nobody has run, and what the floor
becomes on a machine smaller than this one is unanswered. Both belong in
[`docs/decisions.md`](docs/decisions.md) once someone measures them, not here.

**Several rows describe the index-and-retrieve path**, which the pivot moved off the default. They
are not wrong; they became conditional. Which of them are still on the critical path is a build-order
question, and build order has one home — see the last section of this file.

The two former entries were closed 2026-08-06 and moved to rejected rows in
[`docs/decisions.md`](docs/decisions.md). **Astryx** never had a recorded reason, a rejected
alternative, or an entry in `package.json`, and nothing about that changed. **LettuceDetect** was
rejected for two independent reasons, either sufficient: no runtime — Ollama does not serve a 307M
encoder, and ONNX Runtime contradicts no-bundled-inference — and redundancy, given invariant 1 plus
the exact-slice rejection in `src/index/anchor.ts`. **The redundancy leg went with invariant 1 on
2026-08-07**: it assumed nothing generated reaches the user, which is no longer true. The runtime leg
is untouched and still sufficient on its own, so **the row stays rejected**. But the job it was hired
for — checking a generated statement against a cited span — is a live problem again in a way it was
not on 2026-08-06. Reopening it is `docs/decisions.md`'s business, not this file's.


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

**Checked against the 2026-08-07 pivot: the list survives entire, and nothing joins it.** Every entry
rests on the evidence base, cited in `docs/philosophy.md`, and none of them rested on the old Law 2
or on the user having supplied material — the pivot changed where a sentence may come from, not what the
product refuses to be. Its two neighbours in `docs/philosophy.md` bind harder now rather than less.
**What we refuse to build** is untouched. **What we do not claim** matters more: *"we do not claim
that our diagnosis is a measurement"* was cheap to honour while a diagnosis was a comparison between
two spans, and it is the first thing that slips once a model authors the finding in its own fluent
sentences.

## Testing

**Assertions only.** Per "Who writes what": in a test file you own all but the assertions and the
domain-knowledge examples, including more rows of a table they started. If you cannot make a test
pass, say why; never edit the assertion.

**Red-first is enforced.** A new test must be shown failing, with the failure reason, before any
implementation exists. Guards against tests written to confirm current behaviour.

**Banned in any test:** snapshot-only assertions, `toBeDefined()` as the sole check, mock-only tests
that never touch real logic, bare boolean assertions. The documented weak-oracle patterns.

**Coverage is not a target.** Controlling for suite size, its correlation with fault detection is
near zero. Gap-finder only: low is signal, high is not. Mutation testing (Stryker, deterministic core only) is the real check: surviving mutants are bug
reports, the score is noise. **Run `npm run mutate`, which is a full run.** `--incremental` is
available as `npm run mutate:incremental` but is not the default: its baseline lives in
gitignored `reports/`, so it is machine-local and goes stale silently — it was found reporting
survivors that a fix had already killed.

**Fixtures are language-agnostic, frameworks are not.** Golden inputs and outputs as JSON, loaded by
a thin runner. Test public APIs, not internals. No Cucumber, no Pact: neither has the audience or
second team here.

**Property-based tests (fast-check) for anything with arithmetic or boundaries.** Highest value is
offset anchoring, `resolve(anchor(text, span)) === span`, over astral-plane and combining characters:
UTF-16 code-unit vs code-point confusion is silent and example tests never expose it. Also chunk
partitioning, retrieval order invariance, scheduling monotonicity.

> **The four paragraphs that follow describe work nobody is doing, as of 2026-08-19.** Extract is
> dormant, so its eval harness measures a piece that does not run, and no labelled set is being
> built. Nothing here is repealed and nothing is deleted: this is the protocol Extract owes on the
> day it is re-admitted, and the re-admission rule in [`docs/decisions.md`](docs/decisions.md) asks
> a different question first — whether the signal changes what the child says, for the better,
> across more than one pass. **The child itself has no eval and is not covered by anything below.**
> A prompt change is judged by reading transcripts, which is not a measurement, and the repo should
> stop short of calling it one. `no LLM judge` is the rule most likely to be reached for here and
> it has not moved.

**The LLM extraction step gets an eval harness, not tests.** Four layers: schema validation
hard-fails; invariants hard-fail as properties (every span resolves, no dangling endpoints, empty in
→ empty out); quality is aggregate precision/recall/F1 against gold labels, never per-case
pass/fail; regression is measured **paired** against the previous prompt on the same fixed set.
100–150 labelled items. No LLM judge: set comparison against gold.

**That harness still describes extraction. As of 2026-08-07 it does not describe a finding.** Two
different measurements were designed together in it, and the pivot separated them. Keep them apart;
conflating them is how a piece with a working eval gets treated as if it had none.

**Extract's eval survives the pivot intact.** Its labels are spans into the text Extract reads, and
that text is the user's own explanation — never the notes — so nothing about the notes leaving the
default path reaches it. *Did the extractor find the causal link in this sentence* is answered by
the text in front of you. The spans are still there, the schema still validates, the properties
still hold, the 100–150 labelled items are still labellable, and the paired protocol still works
over a fixed set of real transcripts. The falsification week supplies the first items of that set —
fifteen to twenty explanations with every causal link hand-marked — and its protocol lives in
[`docs/features/feynman.md`](docs/features/feynman.md) and
[`measurements/within-sentence/README.md`](measurements/within-sentence/README.md), which is the
operative document, not in `docs/decisions.md`. Build Extract against the four layers as written.

**What lost its ground truth is the eval of the *finding*, and that one is skipped by decision.**
The question the product actually asks — *did the model find a real gap in this person's
understanding* — was authorised by the user's own material, which Compare then differenced as
deterministic set arithmetic over two link sets. There is no source on the default path, so there is
no second set and no gold label short of a subject expert per case. The owner ruled that eval
skipped rather than left as an absence, with the alternative he declined recorded beside it;
[`docs/decisions.md`](docs/decisions.md) carries the ruling and its costs. Carry the consequence
into a piece loop: such a piece ships **unmeasured by decision**, which is not the same as blocked.
Do not halt a build waiting on a protocol that was decided against, and **do not improvise a
replacement one in the middle of a piece.**

**Unmeasured is not the same as unmeasurable.** Whether a finding names a link the hand marks show
the user *did* state is answerable off those same falsification-week explanations for the cost of
one more column, and [`docs/specs/supply.md`](docs/specs/supply.md) owns that. What has no cheap
instrument is precision on gaps that are genuinely real. Either way, do not reach for the thing the
gap makes tempting: **no LLM judge** is unchanged, and the fact that the pressure to break it just
went up is the reason it is worth restating.

**Calibrate against the weakest supported configuration, not the strongest.** **Reaches the child
as of 2026-08-19**, since the child is what the floor model now has to run: a prompt tuned on a
large model and shipped to the floor is the same mistake this paragraph names, one layer up. The
floor model is the one the harness has to pass, and the argument that a stronger model passes any eval a weaker one
passes holds for **recall** — it does not automatically hold for **precision**, because larger models
are often more fluent and more confidently wrong. Precision is the axis Law 1 charges for: a false
finding opens a gap that does not exist and then closes it with something untrue. Calibrating on the
floor is sound; treating a cloud model as a free pass is not.

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
assertions were modified: an agent editing a test to make it pass. Commit the
test alone, watch it fail, then commit the fix. The second blocks the banned assertion patterns
under Testing.

These two are the only ones a machine enforces at all; everything else is a rule an agent can
forget. **They are not unskippable** — `.githooks/pre-commit` prints the `--no-verify` escape in its
own refusal message, which is deliberate and is not a loophole to reach for.

## Skills

Most skills live in `~/.claude/skills/`: user level, shared machine-wide with every other project.
**Do not edit a user-level skill file to suit this repo.** These rules apply instead.

### Start here

**`/holdtrue-workflow`** is the front door for building anything. It locates the work from the
build order, the feature docs and the map, then runs either the feature entry or the piece loop.
Local to this repo, in `.claude/skills/`, and the only document with numbered steps — a citation
to "step 4" means a step there. [`docs/workflow.md`](docs/workflow.md) is the argument behind it.

**The evidence gate does not reach the roleplay.** That skill's checklist requires a claim about
how people learn to already be in the evidence base, which still holds everywhere it always did.
It does not cover the conversational child: as of 2026-08-07 the roleplay is the product, and it is
justified as **fiction**, the same argument the repo already accepted for voice-in. So do not go
looking for an evidence row behind it, and do not write one. Defending it pedagogically stays
forbidden — the evidence base has no row saying the child teaches better, and two pointing the
other way — and the fiction argument suspends neither Law 1 nor invariant 5, which bound what the
child may ask however central the roleplay becomes. Reasoning in
[`docs/decisions.md`](docs/decisions.md).

**`/wayfinder`** charts a feature's open design questions as tickets. An agent cannot invoke it;
`/holdtrue-workflow` prepares the invocation and the human types it.

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
