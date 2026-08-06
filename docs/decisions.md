# Decisions

Technical decisions and their reasons. Philosophy: [`philosophy.md`](philosophy.md),
[`features/`](features/). Evidence: [`research/evidence-base.md`](research/evidence-base.md).

**HoldTrue** is the platform. **Feynman** is the first feature.

## Stack

| Decision | Why | Rejected |
|---|---|---|
| **Electron** | Only candidate with first-party documented sidecars, SQLite extensions, three-platform E2E. `node:sqlite` has `loadExtension()`, FTS5 built in. | **React Native**: no Linux path, no `child_process` (Hermes), no in-support Windows/macOS version pair. **Electrobun**: no sidecar docs, Linux testing upstream-blocked, bus factor 1. **Tauri**: SQL plugin can't load extensions (open 2yr), no macOS find-in-page, two macOS 26 crashes. **Flutter**: fallback if Electron becomes untenable. |
| **Ollama, or bring your own API key** | No bundled inference: no signing, no notarization entitlements, no giant installer. Ollama 0.32.4 *is* `llama-server`; bundling llama.cpp buys nothing. | **MLX**, deferred: Apple-only, permanent second code path, Ollama already uses Metal. |
| **Qwen3.5 4B or larger for extraction** | Apache-2.0 at all sizes. Causal extraction collapses below 3B, and 3B to 4B is untested, so 4B is the floor. The app never downloads, stores or bundles a model: Ollama owns that, read `/api/tags` and offer `/api/pull`. | Gemma 4: non-OSI license on weights. |
| **An embedding model served by Ollama** | Embedding a library means sending the whole library, so the cloud path belongs behind the same explicit switch as web retrieval. | Cloud embedding on the default path. |
| **SQLite via `node:sqlite`** | Vectors as blobs, FTS5 keyword half, one flat matmul: 100k × 768 at 2.3 ms. Hybrid keyword+dense, since study material is full of formulas and proper nouns embeddings fumble. | Any vector database. Not warranted at this scale. |
| **PDFium** | The character index *is* the citation offset, exactly what span anchoring needs. | PyMuPDF (AGPL). Not a conflict now that we are AGPL too, but PDFium fits better technically and doesn't entangle forks. |
| **Tavily, off by default** | 1,000 requests/month free, no card, terms permit app integration. | Google CSE (closed to new customers), Brave (free tier killed Feb 2026). |
| **LettuceDetect v2** ⚠ unresolved | 307M, MIT, returns *which spans* are unsupported, not a yes/no. **Two open problems.** It has no runtime here: Ollama does not serve a 307M encoder, and adding ONNX Runtime contradicts the no-bundled-inference decision. And it presupposes a generated statement, which invariant 1 forbids, so span anchoring may already cover it. Resolve before depending on it. | None. |
| **Astryx** (`@astryxdesign/core`) | Not recorded. | None. |
| **AGPL-3.0** | Not recorded. | PolyForm Noncommercial: not OSI, ambiguous for a study tool. |

## Feynman design

Decided 2026-08-03. Feature doc: [`features/feynman.md`](features/feynman.md).

| Decision | Why | Rejected |
|---|---|---|
| **Voice in, not typing** | You do not type at a child sitting in front of you. The role-play is the product, and typing breaks it. That is the whole reason and it is enough. | Typing. Note this is **not** a claim that speech reveals more than writing — that is refuted in the evidence base (D'Mello et al. 2011, no learning difference) and may not appear in this product. The reason is fiction, not diagnosis. |
| ~~**The user corrects the transcript, and the child does the asking**~~ **REVERSED 2026-08-05** | Original reasoning: at 15–25% WER an uncorrected transcript means the user reads words they did not say and is told they are theirs, and Law 2's floor is *"a user reads their own words."* Reversed because it is friction in the one place the session should feel like talking. The reasoning was never refuted — the cost is accepted, not argued away. See the session-shape section below. | Still rejected: a second model reading audio for hesitation — refuted, see the feature doc. |
| **The child knows your source and nothing else** | Naivety is unbuildable: the model is not naive, and pretending it is invites exactly the world-knowledge speech invariant 3 bans. "Knows only your document" is a naivety you can actually build, and it is the only one whose confusion is quotable. | A genuinely naive persona. A persona drawing on world knowledge. |
| **The child asks, never tells** | Link extraction runs ~0.5 F1. A wrong question costs one round trip; a wrong claim tells someone they failed to say what they said. This is an **engineering** rationale — the pedagogical one (*"a leading question beats a stated correction"*) is refuted and unavailable. | Stating the gap directly. |
| **Two checks, in order: structure then truth** | Internal consistency needs no world knowledge, so its trigger is a property of the user's own words — which is what makes a live interrupt legal under invariant 3. It also needs no retrieval, so it is far cheaper than the source check. | One combined check. Folding coherence into Compare. |
| **Clarity is a separate instrument** | Expression and understanding are orthogonal — the feature doc already says holding the mechanism and failing to say it is not a failure of understanding. Separation is also what makes a clarity number legal: invariant 7 bans a grade *beside a diagnosis*, and this one is not beside anything. Being isolated, a wrong count cannot corrupt a finding. | A combined score. Clarity feeding the understanding path. **A clarity eval** — "was this clear" has no ground truth, one labeller, and a model listener is not naive enough to serve as an oracle. `workflow.md` step 9 already forbids an LLM judge. |
| **Clarity reports counts, never verdicts** | "Your sentences averaged 34 words" is a fact. "Your explanation was hard to follow" is an inference needing evidence nobody has. An instrument makes no claim, so it needs no eval. | Any holistic judgement of an explanation's quality. |

**Was one model on the finding path.** Extract, with Cohere, Compare and Clarity all
deterministic. **Superseded 2026-08-05:** the review phase added Contradict, Points and Cover,
so the finding path now calls four models and needs four eval sets. See the next section. The
live phase still calls exactly one.

## Feynman session shape

Decided 2026-08-05. The session splits into a **live phase** while you are talking and a
**review phase** once you have stopped. This supersedes parts of the section above.

| Decision | Why | Rejected |
|---|---|---|
| **Two phases: live, then review** | The structural check needs only the user's own words, so it is cheap and can interrupt. Everything needing the notes — retrieval, contradiction, omission, coverage — moves to a pass that runs after the user stops talking, where being slow costs nothing. This also resolves most of the latency worry: the expensive work no longer happens while someone waits. | One continuous loop with retrieval interleaved. |
| **The child checks structure only** | It looks at whether your own chain closes: you named a thing and never said what it does. No notes, no world knowledge, nothing to be wrong about beyond the shape of what you said. Keeps the live phase fast and keeps invariant 3 trivially satisfied. | The child fact-checking live. |
| **The review phase may be agentic** | Multi-step retrieval — search, read, search again — is strictly better than one shot, and after the user stops talking there is no latency budget to protect. The line is **agentic about what to look for, never about what to say**: authorship stays quoted. | Agentic authorship. An agentic live phase. |
| **The notes are assumed correct** | The app never checks a claim against the world, only against the user's own material. If the notes are wrong the user is taught something wrong, and that is accepted. A future notes-improvement tool is the intended answer and is out of scope here. | Fact-checking against model knowledge. Flagging suspect notes. |
| **Contradiction is a distinct finding from omission** | *Your notes say otherwise* and *your notes connect something you skipped* are different failures. Omission means the explanation was incomplete; contradiction means something is wrong in your head and you would keep believing it. Contradiction is checked first, because being told about a skipped step is strange if the surrounding explanation is mistaken. | Treating both as one comparison. |
| **No upfront transcript correction** | Friction, in the one place the session should feel like talking. **Accepted cost:** thinking-aloud speech transcribes at 15–25% error, so the app will sometimes quote back words the user did not say — the failure this design is least able to absorb. Reverses the 2026-08-03 decision above, which reasoned from Law 2's floor rather than from how it would feel to use. | A full correction pass. **Unresolved:** whether a quote is editable inline at the moment it is shown, which would put the fix only where it bites. |
| ~~**Coverage is reported, and a model decides it**~~ **REVERTED same day** | Amended invariant 7 to permit traceable point-coverage, on the reasoning that findings alone cannot answer *do I need to study this again* — an explanation can contradict nothing, omit nothing detectable, and still miss the mechanism. **Reverted after a four-way design panel:** all four advocates independently declined to use the permission, including the one whose sole assignment was answering that exact question. Nobody wanted what it bought. The question remains real and unanswered. | A holistic rating, still rejected on its own merits: a single global score is unstable run to run and cannot show its own reasoning. |

**Why the revert, in full.** The panel ran four designs against four priorities — user
experience, correctness, ambition, shippability — and each was attacked by a skeptic. The
coverage permission was granted the same morning and was live in the docs the panel read. The
correctness design narrowed it to bare counts; the UX design replaced it with two lists; the
ambitious design added a *new* forbidden-table row banning progress rings over covered points;
the shippable design cut the whole review phase. Four independent routes around a permission
that had just been created for them.

**What this does not settle.** *Do I need to study this again* is still a real question with no
answer in the design. The panel's position is that the answer, if one exists, is the
contradiction check rather than a coverage inventory — a contradiction is diagnostic by
construction, where coverage of well-documented points is not.

**Not settled by any of this.** Coverage tells you what your notes cover. Something you have
wrong that your notes never mention will not surface, so an empty result means *nothing
contradicted your notes*, not *you understand this*. How that is worded is unresolved, and
getting it wrong rebuilds the overconfidence the feature exists to correct.

## Workflow

Operational rules: [`../AGENTS.md`](../AGENTS.md). Reasoning here.

**Tests are the specification, written by hand.** TDFlow (Jan 2026): **94.3% on SWE-Bench
Verified with human-written tests versus 69.8% writing their own**, a 24-point gap; the
bottleneck is now writing valid tests, not resolving issues. In 86,156 test-file patches
across 33,596 agent PRs, **80.2% had weak or no oracle signal**: agents write tests
confirming what the code already does.

The human owns the *oracle*, not the enumeration: scaffolding, fixtures and mechanical table
expansion delegate, deciding what correct means does not. Red-first runs and mutation testing
backstop, so agent-written tests need not all be read.

**Coverage is rejected as a target.** Inozemtseva & Holmes (ICSE 2014): controlling for suite
size collapses its correlation with fault detection, in one project from 0.85 to essentially
zero. Coverage measures execution, never assertion. Mutation testing is the better instrument
but no score target either: Google, across 30,000 developers, found 85% of mutants judged
unproductive and adequacy "neither practical nor desirable."

**Language-agnostic test *frameworks* are ceremony.** Pact needs two independently deployable
teams; Gherkin's value is a non-engineer audience. Neither exists here. Language-agnostic
*fixtures* (golden JSON, thin runner, public APIs) deliver the benefit at zero cost.

**Agent fan-out is for design and review, not construction.** Panels fit arguments, where
independent judgement is the product; for code, ground truth is "do the tests pass," cheaper
and more reliable to run than to convene critics over. Parallel builders also need
independent, well-specified units, which a greenfield repo lacks.

Fan out on four: **the eval set** (100–150 labelled explanations, fully parallel and
independently verifiable), **design decisions**, **daily code review** across dimensions,
findings adversarially verified before being believed, and one deliberate exception, **one**
contest of independent implementations for the extraction pipeline. Construction fan-out is
justified only there: the eval harness supplies the cheap objective judge the rule assumes
missing, so implementations are scored, not argued.

**Visual loop.** Electron speaks CDP natively: `--remote-debugging-port=9333` plus
`agent-browser` closes the build-launch-look cycle. Renderer only, and a screenshot is a weak
oracle: an ergonomic, never a gate.

## macOS

Battery was investigated; the framework is not the variable. An idle webview draws ~25 mW
against a ~3–5 W machine floor, and the only controlled Safari-vs-Chrome test favoured
Chromium by ~9%, inside its own noise. What matters is where the work runs.

- **Indexing in `utilityProcess.fork()`:** real Node, no Blink page scheduler.
  `QOS_CLASS_UTILITY` inside the child; never `QOS_CLASS_BACKGROUND`, which pins to E-cores.
- **App Nap hits menu-bar apps.** No Electron binding: needs a native addon wrapping
  `beginActivityWithOptions`. Take it **per batch**, hold a strong token reference, release
  in `finally`. Never set `NSAppSleepDisabled`.
- **Don't block sleep.** Warning before sleep is near-zero: checkpoint continuously and
  resume. `powerMonitor` gives AC/battery, thermal state, CPU speed-limit; Low Power Mode and
  battery percentage need the same addon.
- **Don't manage Ollama's lifecycle.** A second `ollama serve` fails on the held port. Idle
  cost is tiny: zero with no model loaded, about half an idle text editor with one, where the
  true cost is 4 GB resident. `{"keep_alive": 0}` at session end reclaims it.
- **Tray.** Icon filename must end in `Template` for dark mode. Hold a module-scope reference
  or GC removes it. `setActivationPolicy('accessory')` with `LSUIElement: 1`.
- **Scheduled reminders when quit are impossible**: a LaunchAgent cannot post notifications,
  Apple requires a user context. Stay resident as an accessory menu-bar process via
  `SMAppService`. **Signing is mandatory**: Electron 42 made unsigned apps fail notifications
  outright.
- **File watching:** `@parcel/watcher`. Its `writeSnapshot()` / `getEventsSince()` pair
  reconciles changes made while closed, no full walk. Debounce 300–500 ms per path (atomic
  saves arrive as delete-then-add, not change); content-hash before re-embedding; subtree
  rescan on the dropped-events flag.
- **Focus enforcement:** Screen Time / FamilyControls is iOS and Catalyst only, not macOS.
  Realistic scope: `NSApplicationPresentationOptions` with `disableProcessSwitching` (kills
  ⌘-Tab, no entitlement, needs a native addon since Electron's `setKiosk` doesn't set it).
  System-wide blocking needs a NetworkExtension filter plus an admin helper, a project in
  itself.

## Roadmap constraints

Planned: study calendar, topic parser, document explorer with Obsidian, Pomodoro, focus
enforcement, pinned browser view. Three things must be right **now**; everything else reads
from them.

1. **Content-addressed, stable IDs in the index.** Re-parsing a document must not reshuffle
   topic identity, or the calendar silently breaks months later.
2. **One anchor format everywhere**, `{doc_id, unit_id, char_start, char_end, quote}`, quote
   verified as a literal substring. Feynman cites with it; the topic parser and retrieval
   practice read the same chunks.
3. **Incremental re-indexing.** An Obsidian vault is thousands of constantly changing files;
   a full re-index per save is unusable.

### `doc_id` is the content hash

Decided 2026-08-05, while building Anchor.

`doc_id` is a hash of the document's text, so it identifies **a version of a document**, not a
file on disk. A file that changes gets a new `doc_id`, and every anchor made from the old one
stops resolving — because the existing `doc_id` comparison rejects it, before any text is
compared.

**Why, concretely.** Anchor originally verified a reference by asking *"is the stored text still
at the stored position?"* That is a question about one spot in a file, and it cannot distinguish
*nothing moved* from *something else identical slid into that slot*. This is not hypothetical: it
was found by a test. An edit inserting exactly 19 characters ahead of an anchor at offset 19
slid a **different** occurrence of `water` into precisely the bookmarked position. The stored
text matched, resolution succeeded, and it returned the wrong occurrence with no error. Repeated
words make it likelier, and study notes repeat their key terms constantly.

Hashing asks a question with a real answer instead — *is this the same document I made the
reference from?* — and the collision becomes unreachable, because a changed file never gets as
far as comparing text at a position.

**It costs nothing in Anchor.** No new field, no change to the five-field format, no new code in
`resolveAnchor`. Identity does the work.

**It fails in the safe direction.** A typo fixed elsewhere in the file invalidates anchors that
were still fine. Since anchors are session-scoped and a session is minutes long, discarding a
good reference costs nothing, where keeping a subtly wrong one puts a false quote on screen.

| Rejected | Why |
|---|---|
| Comparing stored text at stored offsets alone | The collision above. Silent, and likelier the more a term repeats. |
| Storing surrounding context to disambiguate | Widens the anchor format past five fields, and the context can itself change. Already rejected once for Anchor. |
| Re-resolving by searching for the quote | Returns a confident wrong occurrence rather than nothing — the failure the whole product is built to avoid. |

**Consequence to handle in Index, not here.** `doc_id` now answers *which version*, so something
else must answer *which file* — the calendar and topic parser have to follow a document across
edits. That is a separate stable identifier, and it belongs to Index. Two documents with
byte-identical content will also share a `doc_id`; harmless for Anchor, since the text is the
same either way, but Index must not assume `doc_id` is unique per path.

Schedule retrieval practice and Feynman sessions **independently**: spacing is well evidenced
for retrieval, but no evidence that repeating an explain-back loop on the same topic helps,
and one finding suggests the effect is not topic-specific.

Obsidian needs no plugin to *read*: a vault is a folder of markdown. A plugin is for writing
back only, and belongs in its own repo.

## Build order

1. **Index and anchor schema.** Everything depends on it.
2. **Extraction harness plus ~100 labelled explanations.** No benchmark exists for the task
   (pulling named concepts and asserted causal links out of a learner's short explanation),
   and the 4B recommendation is extrapolated from adjacent work. If a small local model can't
   do it, the headline feature is cloud-only or doesn't exist: find out before there is a UI
   on top. Also the test suite for the hardest component.
3. **Feynman.**
4. Everything else.

## Open

- **Which STT engine.** Voice is decided; the engine is not. Constrained by accuracy on
  thinking-aloud speech and by the absence of published fairness data on every local option.
- **When the child interrupts.** After the explanation, or mid-sentence. Mid-sentence needs a
  streaming pipeline and is a much bigger build.
- TTS. Unresearched. The child may not need a voice.
- Repo name and the public push. `origin` was repointed to `danielhkuo/HoldTrue`.
