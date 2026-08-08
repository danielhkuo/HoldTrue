# Decisions

Technical decisions and their reasons. Philosophy: [`philosophy.md`](philosophy.md),
[`features/`](features/). Evidence: [`research/evidence-base.md`](research/evidence-base.md).

**HoldTrue** is the platform. **Feynman** is the first feature.

## The source of the finding

Decided 2026-08-07. This repeals the largest constraint in the repo, so it sits above everything
below it and several rows further down are marked against it. The law it repeals is Law 2 in
[`philosophy.md`](philosophy.md), and whatever rule replaces Law 2 is written there rather than
here — this section records that the decision was taken, what it costs, and what was turned down
along the way.

| Decision | Why | Rejected |
|---|---|---|
| **Model knowledge is the default source of the finding** | The owner's call, and his reason is that confining the finding to the user's own notes was seriously constraining: a gap the notes never mention could not be found at all, which is most of what a person actually has wrong. HoldTrue is an open-source tool, so which model runs is the user's choice and, in his words, *"it's the user's failure to not use an appropriate model."* That is a coherent position for a tool nobody is selling, and it moves the guard against a confident falsehood from the architecture to model capability plus the person who picked the model. It obliges the app to be honest about which model it is running and what that model was calibrated against. **What this does not touch.** Law 1 entire — anything that asks supplies the answer, and it binds harder now, not less. Local-first: nothing leaves the device unless you turn something on. The evidence gate, still scoped to claims about learning. Invariants 5, 6 and 7. Invariant 2 survives with a narrower scope rather than being deleted: wherever something is quoted, it is still validated as a literal substring, there is simply far less quoting. | **A cloud or bring-your-own-key frontier model as the floor.** Declined because local-first survives the pivot on its own reasoning — it was never part of what Law 2 was doing, so repealing Law 2 gives no reason to spend it. **Notes-only retained**, which is the status quo being repealed rather than refuted, so its cost is stated and not argued away: what the project gives up is a *structural* guarantee. If every sentence is the user's own words, a verbatim quote from their material, or a string in the codebase, then a confident falsehood has no route to the screen, and hallucination stops being a judgement call and becomes a validation failure that span anchoring catches mechanically. Nothing enforces that now. The replacement is a bet on the model, and the bet is the user's to lose. |
| **The local floor is the best model the machine can run** | The calibration target is a development machine that is an M5 Max with 36 GB, so the floor is roughly a **27–32B-class model at 4-bit, about 20 GB resident**, sharing those 36 GB with a `whisper-server` sidecar and Electron. The class and the memory budget are the decision. No model is named here and no accuracy figure is quoted, because nothing has been run at that size for this task. The owner's reasoning for calibrating at the floor is that a cloud model will be stronger and so will pass any eval this setup passes. **Recorded with its correction, because the reasoning holds on one axis and not the other.** It holds for **recall** — a stronger model finds at least what a weaker one finds. It does not automatically hold for **precision**, because larger models are frequently more fluent and more confidently wrong, and precision is the axis Law 1 charges for: a wrong repair does not cost a round trip, it teaches a falsehood. Calibrating against the weakest supported configuration is sound. Treating a stronger model as a free pass on the same eval is not. | **Naming a specific model, or writing down a benchmarked figure.** Neither exists yet, and three fabricated figures were traced and corrected in this repo on 2026-08-07 already. **Calibrating against the strongest configuration** and letting the weak end fail quietly, which inverts the direction the error is asymmetric in. **Making cloud the floor**, which is the same rejection as the row above. |
| **RAG is an optional hook, never the default path** | In the owner's words: *"Its hypothetical. Like if someone has that kind of setup, i want them to be able to hook it up. But by default its model knowledge only."* So the default path has no corpus, no retrieval step and no source document, and the finding comes from the model. The retrieval design already decided in this file is not deleted — it is scoped to the optional path, where a quote can still be validated against a real source and invariant 2 still means something. | **Requiring RAG on the default path.** It puts a setup step in front of the first run and makes the headline feature depend on a corpus most people will not have, which is a milder version of the constraint just repealed. **Dropping the RAG path entirely.** It throws away reasoning that is still correct wherever retrieval runs — see the two rows below marked *scoped to the RAG path* — and forecloses the one configuration in which a citation can be mechanically checked. |
| **The eval for the model-knowledge finding is skipped, and the skip is recorded as a decision rather than left as an absence** — decided 2026-08-07 | The owner's call, and his reasoning in his words: building one is what *"full benchmark suites are for"*, he does not want to spend that effort, and *"its not like we can do anything if the current models are insufficient."* **The cost, recorded beside it and not argued away.** The piece that carries the entire authority of the feature will ship with no way to tell whether it works, and there is no number to point at when a finding feels wrong. Law 2 obliges the app to state what the model was calibrated against; for this piece the honest answer is now permanently *nothing*, so `philosophy.md`'s open item on calibration having no procedure is closed for the default-path finding by this row rather than answered by it. **What the skip does not touch.** All three falsification-week measurements survive and are still scheduled — they score the user's own explanation against hand marks on that same explanation, so none of them ever depended on the notes. Extract's own eval survives unchanged: spans into the explanation text, schema validation, the properties, the paired protocol over a fixed set. What is skipped is the measurement of the *finding*, which is the one that never had a gold standard short of a subject expert per case. | **A falsification-scale version, offered and declined: the owner marking real-gap / not-a-gap on findings drawn from his own explanations**, on the ground that he is the subject expert on his own understanding — which is precisely the expert-per-case the full protocol could not afford, available for the length of the falsification week rather than a benchmark suite. Record it as the thing a future reader will most want to know was weighed rather than overlooked. It is **declined, not refuted**: nobody showed it would not work, and it can be picked up later by anyone willing to spend the week. **Leaving the eval as an absence**, which is what a row exists to prevent — a hole in the docs reads as an oversight, and this one is a choice. **An LLM judge**, not reopened and given no fresh consideration here; `AGENTS.md` bans it, and the only thing that changed is that the pressure to reach for it went up. |

## Stack

| Decision | Why | Rejected |
|---|---|---|
| **Electron** | Only candidate with first-party documented sidecars, SQLite extensions, three-platform E2E. `node:sqlite` has `loadExtension()`, FTS5 built in. | **React Native**: no Linux path, no `child_process` (Hermes), no in-support Windows/macOS version pair. **Electrobun**: no sidecar docs, Linux testing upstream-blocked, bus factor 1. **Tauri**: SQL plugin can't load extensions (open 2yr), no macOS find-in-page, two macOS 26 crashes. **Flutter**: fallback if Electron becomes untenable. |
| **Ollama, or bring your own API key** | No bundled inference: no signing, no notarization entitlements, no giant installer. Ollama 0.32.4 *is* `llama-server`; bundling llama.cpp buys nothing. | **MLX**, deferred: Apple-only, permanent second code path, Ollama already uses Metal. |
| ~~**Qwen3.5 4B or larger for extraction**~~ **SUPERSEDED 2026-08-07** | Superseded by the local floor in [the source of the finding](#the-source-of-the-finding). The floor is now a 27–32B-class model at 4-bit, not 4B, because the model is the guard rather than a component behind one. The old stated reason — *"causal extraction collapses below 3B, and 3B to 4B is untested"* — was uncited when it was written and is still uncited, so it is not evidence at the new floor either and should not be carried up. Two things in this row survive untouched and still govern: the licence test, Apache-2.0 at all sizes, and the delivery rule, that the app never downloads, stores or bundles a model — Ollama owns that, read `/api/tags` and offer `/api/pull`. | Gemma 4: non-OSI license on weights. Still rejected, and still on licence grounds, which the pivot does not reach. |
| **An embedding model served by Ollama** | Embedding a library means sending the whole library, so the cloud path belongs behind the same explicit switch as web retrieval. | Cloud embedding on the default path. |
| **SQLite via `node:sqlite`** | Vectors as blobs, FTS5 keyword half, a worker-sharded flat scan. Hybrid keyword+dense, since study material is full of formulas and proper nouns embeddings fumble. Measured timings live in the [`AGENTS.md`](../AGENTS.md) stack table; the "2.3 ms" once stated here was unsourced and wrong by ~20×. | Any vector database. Not warranted at this scale. |
| **PDFium** | The character index *is* the citation offset, exactly what span anchoring needs. | PyMuPDF (AGPL). Not a conflict now that we are AGPL too, but PDFium fits better technically and doesn't entangle forks. |
| **Tavily, off by default** | 1,000 requests/month free, no card, terms permit app integration. | Google CSE (closed to new customers), Brave (free tier killed Feb 2026). |
| ~~**LettuceDetect v2**~~ **REJECTED 2026-08-06** | Two independent reasons, either sufficient. No runtime: Ollama does not serve a 307M encoder, and ONNX Runtime contradicts no-bundled-inference. And redundant: it was hired to check a *generated* statement against its cited span, but invariant 1 forbids generated text reaching the user, and `src/index/anchor.ts` already rejects any quote that is not an exact slice. **Amended 2026-08-07:** the second reason fell with invariant 1, since generated text is now the default output. The rejection stands on the first reason alone, which the pivot does not reach. Note also that the *job* this tool was hired for — checking a generated statement against the passage it cites — is exactly what the optional RAG path would want, so it may be worth a fresh row one day. It would need a runtime answer, and it does not have one. | Kept as an open question for three days with nothing depending on it. |
| ~~**Astryx**~~ **DELETED 2026-08-06** | Never recorded a reason, never recorded a rejected alternative, and never appeared in `package.json` or the lockfile. A row with no reason is not a decision. Re-add it with one if it is wanted. | n/a |
| **AGPL-3.0** | Not recorded. | PolyForm Noncommercial: not OSI, ambiguous for a study tool. |

## Feynman design

Decided 2026-08-03. Feature doc: [`features/feynman.md`](features/feynman.md).

| Decision | Why | Rejected |
|---|---|---|
| **Voice in, not typing** | You do not type at a child sitting in front of you. The role-play is the product, and typing breaks it. That is the whole reason and it is enough. | Typing. Note this is **not** a claim that speech reveals more than writing — that is refuted in the evidence base (D'Mello et al. 2011, no learning difference) and may not appear in this product. The reason is fiction, not diagnosis. |
| ~~**The user corrects the transcript, and the child does the asking**~~ **REVERSED 2026-08-05** | Original reasoning: at 15–25% WER an uncorrected transcript means the user reads words they did not say and is told they are theirs, and Law 2's floor is *"a user reads their own words."* Reversed because it is friction in the one place the session should feel like talking. The reasoning was never refuted — the cost is accepted, not argued away. See the session-shape section below. | Still rejected: a second model reading audio for hesitation — refuted, see the feature doc. |
| ~~**The child knows your source and nothing else**~~ **REPEALED 2026-08-07** | Repealed by [the source of the finding](#the-source-of-the-finding). The row rested on two things that the default path removes. It assumed a document — there is none — and it assumed that anything the child says is a quote, which is what made its confusion "quotable" in the first place. The invariant it was steering around, invariant 3's ban on world-knowledge speech, is itself repealed. What the child knows now, and whether it plays a naive character at all, belongs to [`features/feynman.md`](features/feynman.md) and is deliberately not answered here. | Both alternatives this row once rejected — a genuinely naive persona, and a persona drawing on world knowledge — are now open rather than rejected, and neither has been chosen. The reasoning that killed genuine naivety is the one part of this row that still stands on its own: the model is not naive, and pretending it is does not make it so. |
| **The child asks, never tells** | Causal link extraction is wrong often enough that being wrong is the normal case rather than the edge case. Corrected 2026-08-07: the "~0.5 F1" this row used to cite came from an Open IE benchmark on written text, not from causal extraction at all. The nearest real figures are worse, so the argument survives with more room than it had — supervised systems on EventStoryLine (news, document-level causal pairs) reach 0.52–0.66 F1 within a sentence and 0.33–0.48 across one, and zero-shot GPT-4 manages 11.5 F1 within a sentence on Causal-TimeBank. Nothing is published for spoken learner explanation, so read all of those as a ceiling. A wrong question costs one round trip; a wrong claim tells someone they failed to say what they said. This is an **engineering** rationale — the pedagogical one (*"a leading question beats a stated correction"*) is refuted and unavailable. **Reviewed 2026-08-07 under the pivot: it survives, on half the support it used to have.** Two things held it up, and one of them is gone. The constitutional half was Law 2's consequence *a persona may ask, it may never assert*, which is repealed and now contributes nothing. The engineering half stands, and it stands better at the new floor than one might expect, because the nearest published figure for a large model is the zero-shot GPT-4 line already in this cell — 11.5 F1 within a sentence on Causal-TimeBank — so making the model bigger is not visibly a fix for causal extraction, and the asymmetry the row turns on does not move: a wrong question costs one round trip, a wrong claim tells someone they failed to say what they said. What is no longer true is the calibration. This row was priced against a 4B extractor, nothing has been run at 27–32B, and so its assumed error rate is now an assumption rather than an extrapolation from adjacent work. Since the law that forbade the child asserting is gone, **this row is the only thing left stopping it**; a proposal to relax it is a constitutional change, not a tuning decision. | Stating the gap directly. |
| **Two checks, in order: structure then truth** | Internal consistency needs no world knowledge, so its trigger is a property of the user's own words — which is what makes a live interrupt legal under invariant 3. It also needs no retrieval, so it is far cheaper than the source check. | One combined check. Folding coherence into Compare. |
| **Clarity is a separate instrument** | Expression and understanding are orthogonal — the feature doc already says holding the mechanism and failing to say it is not a failure of understanding. Separation is also what makes a clarity number legal: invariant 7 bans a grade *beside a diagnosis*, and this one is not beside anything. Being isolated, a wrong count cannot corrupt a finding. | A combined score. Clarity feeding the understanding path. **A clarity eval** — "was this clear" has no ground truth, one labeller, and a model listener is not naive enough to serve as an oracle. `AGENTS.md` already forbids an LLM judge. |
| **Clarity reports counts, never verdicts** | "Your sentences averaged 34 words" is a fact. "Your explanation was hard to follow" is an inference needing evidence nobody has. An instrument makes no claim, so it needs no eval. | Any holistic judgement of an explanation's quality. |
| **The corpus is a folder, and a pasted document is a folder of one** — [#20](https://github.com/danielhkuo/HoldTrue/issues/20), decided 2026-08-06, **scoped to the optional RAG path 2026-08-07** | **Scoped, not struck.** The default path has no corpus, so Retrieve has no subject and nothing in this row governs it. Every word of the reasoning below stays valid wherever retrieval does run, which is why it is marked rather than deleted: do not re-derive it, and do not build it before someone decides the RAG path is being built. The original reasoning follows. Picking scopes the *topic*; retrieval searches the folder. That resolves the apparent contradiction between the session's step 1 and Retrieve's row without changing either. Storing a pasted article as a single-note corpus makes scope a **parameter**, not an architecture, so the v1 default stays a cheap product choice. It also keeps the retrieval abstain testable against a real multi-document corpus, which the feature doc calls *"the only thing standing between a growing corpus and a verbatim quote from the wrong note."* | **Single-document v1 with a folder mode later.** It buys a shippable Feynman before Index and sidesteps #25 — but it validates the abstain against the one input where it is not needed, and every threshold tuned there fails to transfer. **Whole-library with no paste path.** Costs the zero-setup first run for an adoption filter that #26's census measured at 13–16% and found non-binding. |
| **The source's causal link comes from Extract, run at session time over retrieved passages** — [#22](https://github.com/danielhkuo/HoldTrue/issues/22), decided 2026-08-06, **scoped to the optional RAG path 2026-08-07** | **Scoped, not struck.** There is no source side on the default path, so there are no retrieved passages, Extract runs over the user's explanation alone, and Compare has no second link set to diff against. What that does to the decomposition is named under **Open** and is not answered here. The reasoning below is untouched by the pivot and remains the answer wherever retrieval runs — in particular the arithmetic that kills an index-time link store, which does not depend on where the finding comes from. The original reasoning follows. One model step on two kinds of input, so Compare becomes set arithmetic over two **link sets** and keeps its property test. Invariant 9 is untouched: it forbids diffing two extractions of the user's *own words*, and the source is not the user's words. | **An index-time link store.** Its distinctive capability is composing A→X in one note with X→B in another, and that dies on its own arithmetic. The arithmetic was re-checked on 2026-08-07 against corrected figures and the kill holds at every one of them, because composition multiplies whatever the single-hop rate is. The most generous published number anywhere near this task is **0.535** — IMoJIE's optimal F1 on the CaRB Open IE benchmark, arXiv:2005.08178, a 2020 BERT-based seq2seq system on written benchmark sentences, and not the "best frontier model" it was once quoted as — which composes to **~0.29** over two hops. Small models sit lower, in the high-20s to mid-30s on CaRB and ReOIE (LLaMA-2-13B 36.2 and 25.7, GPT-3.5 zero-shot 39.1 and 25.9), composing to **0.07–0.13**. The "~0.30 at 8B" originally cited here has no source for 8B specifically and is only directionally plausible; it is not needed, since the conclusion does not turn on which figure in that band is right. Strip composition and it is a cache that a content-hash `doc_id` invalidates wholesale on any edit, against a vault of constantly changing files. **Co-occurrence as a link proxy.** Cheapest and fully deterministic, but it is systematically worst on the 69% of notes that are declarative stubs and definition sheets — a glossary co-locates every term by construction — and a false hit fires a probe with no answer behind it, which is a Law 1 failure. |
| **The roleplay is the product** — decided 2026-08-07 | The owner's call, and the same form of argument the voice row above already accepted: you do not type at a child sitting in front of you, that was the whole reason, and it was enough. It is a **fiction** argument, not a pedagogical one, so it does not pass through the evidence gate, which governs claims about how people learn. What it justifies is spending design effort on the child being a convincing child, and treating a change that makes the fiction thinner as a real cost rather than a free simplification. | **Defending it pedagogically**, which is available to nobody. The evidence base holds no row saying a conversational partner teaches better, and two pointing the other way: Roscoe & Chi's **87% knowledge-telling episodes for audience-directed explanation against 60%** for self-explanation to text, and Alter, Oppenheimer & Zemla 2010, where opening with *"walk me through it step by step"* shrinks our own diagnostic yield. **Reading it as a licence over the constitution.** It suspends neither Law 1 nor invariant 5: those carry their own evidence and bound what the child may ask however central the roleplay becomes. **Corrected 2026-08-07, later the same day.** As written, this row read Law 1 and invariant 5 through the notes-only premise, so "supplies the answer" meant the answer came out of the user's own material. That premise is repealed by [the source of the finding](#the-source-of-the-finding). What survives, and is the whole of what survives, is that **Law 1 binds regardless of where the answer comes from**: whatever the child opens, something has to close, and the fact that the answer is now the model's rather than a quotation from a document neither weakens the obligation nor changes who owes it. If anything it tightens, because the answer is no longer checkable against a source. |
| **The connective table is a mute, never a joiner** — decided 2026-08-07 | A closed-class list of sentence-initial causal connectives earns a place only by *suppressing* output. If sentence N opens with one and Extract returned no cause for N, Cohere must not flag N's subject as an unlinked concept. That produces nothing, asserts nothing and needs no span, which is exactly what invariant 3 permits — knowledge may suppress output, never produce it — and exactly what invariant 4 means by `confidence`, a reason to stay quiet. | **The same table used as a joiner**, reading the connective and attaching the previous sentence as the cause. It recovers only ~10–17% of the links per-sentence extraction loses — the council's 2026-08-07 estimate, not a measurement, and the falsification week's connective column measures it directly for the cost of one extra column. Worse, **it fails silently**: the previous-sentence span it attaches is a genuine substring of the transcript, so a wrong-but-literal link passes invariant 2 and reaches the user looking validated. A mute that misfires costs a question nobody asks; a joiner that misfires puts a false link on screen with a quote under it. |
| **Invariant 8 keeps its constraint and loses its warrant** — decided 2026-08-07 | *"Extraction is per-sentence, never one-shot over a whole explanation"* entered in `5477081`, the initial commit, as a bare line with no argument. The 97/5 figure arrived four days later in `c3822d4` — the commit whose stated purpose was giving every fact a source. Constraint first, justification after, and the justification does not survive tracing; see the paragraphs below this table. **Unwarranted is not wrong.** The invariant stays in force, because nothing has been shown against it and the schema, the anchors and Compare's set arithmetic all rest on per-sentence emission — but it is now held on no published evidence, and it may not be defended by citing 97/5 again. The measurement in [`measurements/within-sentence/`](../measurements/within-sentence/) is what settles it. | **Silent repeal** and **silent retention**, both. Dropping the invariant because its stated reason failed would treat unwarranted as refuted, which it is not; keeping it while leaving the dead figure in place is worse still, since the next reader inherits the number as settled fact. **The soliloquy** — extract over the whole uninterrupted stretch of speech between two child interventions — is not adopted as drawn. It is **circular in the live phase**: a soliloquy is defined by the interventions, and the live phase's job is deciding when to intervene, so it would segment on the thing it is computing. Its boundaries would also derive from interaction history rather than content, contradicting the content-addressed rule in the anchor format. |

**Citations in this table that the 2026-08-07 pivot invalidated.** Recorded here rather than row
by row, because in each case a live decision is resting on a dead reference and the decision itself
is untouched. *Two checks, in order: structure then truth* justified the live interrupt by saying
its trigger is a property of the user's own words, *which is what makes it legal under invariant 3*.
Invariant 3 is repealed, so that legality clause is void, while the ordering argument — a structural
check needs no world knowledge and no retrieval, so it is far cheaper than the other one — is
unaffected. The second check, *truth*, meant the check against the source, and there is no source on
the default path; what it becomes is open. *The connective table is a mute, never a joiner* cited
invariant 3 and invariant 4 for its entire constitutional half, and both of those are now gone or
under review. It rests on its engineering half, which was always the stronger one: a joiner fails
*silently*, because the previous-sentence span it attaches is a genuine substring of the transcript,
so a wrong link passes invariant 2 and reaches the user looking validated. That argument never
depended on Law 2 and outlives it. **None of these rows is reopened by this note.** They are flagged
so that the next reader who follows a citation to a repealed rule does not conclude the decision
fell with it.

**Do not carry the composition figures into an argument about Extract's source side.** They
measure *graph extraction from prose* — read arbitrary text, produce a graph — the right shape
for killing composition and the wrong one for relation classification with the argument pair
already supplied. The squaring in that row inherits the same limit: it assumes the two hops fail
independently, and it prices a written Open IE benchmark rather than causal links in study notes.
It stands because composition cannot beat its own single-hop rate however that rate is measured,
not because 0.29 is a number anyone should go on to quote.

**The general rule, and the worked example this file supplied itself.** A number measured on one
task may not be carried into an argument about a different one. The paragraph above used to cite
*"the feature doc's own within-sentence figure is ~97% F1, against roughly 5% across a sentence
boundary"* as its authority, which commits precisely the error the sentence before it forbids.
Traced 2026-08-07: that pair is Table 7 of PubMedCausal (Kunle-John et al., arXiv:2605.28363),
intra-sentential 0.9743 against inter-sentential 0.0500, DeepSeek-R1-32B few-shot. It is measured
on **PubMed abstracts**, by **relaxed cosine matching at a 0.75 threshold** rather than exact
extraction, over **202 inter-sentential instances — 3.1% of a corpus that is 96.9%
intra-sentential by construction**, the corpus having been keyword-filtered for "causality". The
5% is the residue that filter missed: the hardest slice, not a representative sample. Carried
into an argument about a learner explaining from memory out loud, it is the same category error
as pricing relation classification with CaRB, and a wider one — the intra-sentential share of
causal links is itself genre-dependent, 96.9% in that biomedical corpus against 31% in news
(EventStoryLine: 3,885 inter-sentence causal pairs against 1,770 intra). A threefold swing
between two *written* genres, before speech is considered at all.

**No published figure covers spoken, from-memory explanation by a learner.** Say that plainly
rather than substituting the nearest adjacent number. What the field does report, for anyone
tempted: supervised systems on EventStoryLine run 0.52–0.66 F1 within a sentence against
0.33–0.48 across one, a ratio of roughly 1.3–1.6× rather than 19×, and the dominant axis is not
intra-versus-inter at all but **explicit-versus-implicit** — PubMedCausal's own table shows 0.8803
explicit against 0.3920 implicit on the same sentences, a 49-point gap. **How many causal
relations carry an explicit connective at all is itself unsettled** — a "28–34% of edited prose"
figure circulated during the 2026-08-07 council and could not be verified, and PubMedCausal's own
corpus measures 63.1%, roughly double it. Do not cite either; see
[`research/extraction-benchmarks.md`](research/extraction-benchmarks.md). What does still bear on Extract's
source side is repo-internal and untouched by any of this: #26's census of one vault found 13–16%
of notes are causal mechanisms, and nearly all of those already carry a quotable causal sentence.
That is a measurement of this project's actual input rather than a transplanted benchmark, and
its generalisability to other people's notes is open.

**The open option for invariant 8: widen what the model reads, keep what it emits.** Three of the
five voices in the 2026-08-07 council converged on this independently, from different assigned
dispositions — hand the model a window of surrounding sentences as context while it still emits
one link set per sentence, so the schema, the anchors and Compare's set arithmetic are all
unchanged and everything downstream of invariant 8 survives untouched. It is **an option, not a
decision.** The one thing the whole council agreed on is that this gets settled by running the
measurement rather than by argument, and the measurement has not run. It is recorded so nobody
re-derives it from scratch, and so nobody builds it before there is data.

That measurement's kill number is a related casualty. The 60% line in
[`measurements/within-sentence/`](../measurements/within-sentence/) was written down before any
data, which is procedurally right, but it was written when 97/5 looked like a general property of
the task rather than a property of PubMed abstracts. Moving it now would be correcting a
falsified premise before collection starts, which is a different act from adjusting a threshold
after seeing a result — and that file owns which of the two it does.

**The pivot is recorded, not designed around.** This pass wrote the decision down and stopped
there. Where it opens a question — most visibly whether a first release could ship against typed
text, since voice's remaining justification is the fiction the pivot just made central — the
question is named in [`features/feynman.md`](features/feynman.md) and left open. Nothing in the
design has been re-cut to suit the roleplay, and nothing should be until someone decides to.

**Two models on the finding path: Extract and Contradict.** Cohere, Compare and Clarity are
deterministic and carry property tests. It briefly reached four on 2026-08-05 when a
point-coverage readout was added; that was reverted the same day and took Points and Cover with
it. **The live phase calls exactly one.**

## Feynman session shape

Decided 2026-08-05. The session splits into a **live phase** while you are talking and a
**review phase** once you have stopped. This supersedes parts of the section above.

| Decision | Why | Rejected |
|---|---|---|
| **Two phases: live, then review** | The structural check needs only the user's own words, so it is cheap and can interrupt. Everything needing the notes — retrieval, contradiction, omission, coverage — moves to a pass that runs after the user stops talking, where being slow costs nothing. This also resolves most of the latency worry: the expensive work no longer happens while someone waits. | One continuous loop with retrieval interleaved. |
| **The child checks structure only** | It looks at whether your own chain closes: you named a thing and never said what it does. No notes, no world knowledge, nothing to be wrong about beyond the shape of what you said. Keeps the live phase fast and keeps invariant 3 trivially satisfied. | The child fact-checking live. |
| **The review phase may be agentic** | Multi-step retrieval — search, read, search again — is strictly better than one shot, and after the user stops talking there is no latency budget to protect. The line is **agentic about what to look for, never about what to say**: authorship stays quoted. | Agentic authorship. An agentic live phase. |
| ~~**The notes are assumed correct**~~ **SUPERSEDED 2026-08-07** | Superseded by [the source of the finding](#the-source-of-the-finding), and it is the sharpest reversal in this file: the alternative this row rejected, *fact-checking against model knowledge*, is now the default path. The original reasoning was that the app never checks a claim against the world, only against the user's own material, so if the notes are wrong the user is taught something wrong and that cost is accepted. On the default path there are no notes to be wrong, so the accepted cost does not disappear, it changes shape — what can now be wrong is the model, and the pivot assigns that to the user's choice of model rather than to the design. The row still governs the optional RAG path unchanged. **Newly unanswered:** what the app does when the model and a supplied source disagree. This row used to answer that by construction, the source always won, and nothing answers it now. | *Fact-checking against model knowledge* is no longer rejected; it is the default, which is what supersedes the row. *Flagging suspect notes* stays rejected and unexamined — nothing in the pivot bears on it, and it still belongs to the future notes-improvement tool that was always the intended answer. |
| **Contradiction is a distinct finding from omission** | *Your notes say otherwise* and *your notes connect something you skipped* are different failures. Omission means the explanation was incomplete; contradiction means something is wrong in your head and you would keep believing it. Contradiction is checked first, because being told about a skipped step is strange if the surrounding explanation is mistaken. | Treating both as one comparison. |
| **No upfront transcript correction** | Friction, in the one place the session should feel like talking. **Accepted cost:** thinking-aloud speech transcribes at 15–25% error, so the app will sometimes quote back words the user did not say — the failure this design is least able to absorb. Reverses the 2026-08-03 decision above, which reasoned from Law 2's floor rather than from how it would feel to use. | A full correction pass. **Unresolved:** whether a quote is editable inline at the moment it is shown, which would put the fix only where it bites. |
| ~~**Coverage is reported, and a model decides it**~~ **REVERTED same day** | Amended invariant 7 to permit traceable point-coverage, on the reasoning that findings alone cannot answer *do I need to study this again* — an explanation can contradict nothing, omit nothing detectable, and still miss the mechanism. **Reverted after a four-way design panel:** all four advocates independently declined to use the permission, including the one whose sole assignment was answering that exact question. Nobody wanted what it bought. The question remains real and unanswered. | A holistic rating, still rejected on its own merits: a single global score is unstable run to run and cannot show its own reasoning. |

**Citations in this table that the 2026-08-07 pivot invalidated.** Same treatment as the design
table above: the references died, the decisions did not, and nothing here is reopened by saying so.
*Two phases: live, then review* splits the work by what needs the notes, and on the default path
nothing needs the notes, so the split now has to stand on cost and latency alone — which was always
the larger part of its argument. *The child checks structure only* claimed that the live phase
*keeps invariant 3 trivially satisfied*; invariant 3 is repealed, so that clause is void, and what
constrains the live phase instead is named under **Open**. *The review phase may be agentic* drew
its line at **agentic about what to look for, never about what to say**, on the ground that
*authorship stays quoted*. Authorship does not stay quoted any more, so the line as drawn has
nothing holding it up. It is left standing rather than repealed, because the distinction underneath
it — searching freely is not the same permission as asserting freely — may well survive on some
other reasoning, and nobody has looked. *Contradiction is a distinct finding from omission* is
worded throughout as *your notes say otherwise*; the distinction it draws, between believing
something wrong and skipping a step, does not depend on where the other side of the comparison comes
from, so the row survives with stale wording.

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

Schedule retrieval practice and Feynman sessions **independently**: spacing is well evidenced
for retrieval, but no evidence that repeating an explain-back loop on the same topic helps,
and one finding suggests the effect is not topic-specific.

Obsidian needs no plugin to *read*: a vault is a folder of markdown. A plugin is for writing
back only, and belongs in its own repo.

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

## Build order

**This is the single source.** Corrected 2026-08-06: it previously put the index before the
extraction harness, which contradicted the piece-level order in
[`features/feynman.md`](features/feynman.md) on exactly the point that matters.

**Unsettled since 2026-08-07, with a re-cut proposed below and not yet ruled on.** The pivot took
the premise out from under step 0 and step 2 — both were read as assuming a source text to label
spans into and to measure against — and moved the model floor that step 2's stated reason rests on.
Two things have since changed what a re-cut has to work around: the eval skip recorded [at the top
of this file](#the-source-of-the-finding), and the step that produces the finding from model
knowledge now being specced in [`specs/`](specs/).

**The numbered list immediately below is the order in force.** A proposed replacement follows it,
marked as proposed. The owner rules on it; until he does, this list is what a piece cites and the
proposal binds nothing.

0. **The falsification week.** Three measurements, about a day each, no code. The within-sentence
   rate, the false-question rate, and vault eligibility. Kill numbers written down *before* any of
   them run. Details in [`features/feynman.md`](features/feynman.md).
1. **Anchor.** Everything produces or consumes anchors. *Done.*
2. **Extraction harness plus ~100 labelled explanations.** No benchmark exists for the task
   (pulling named concepts and asserted causal links out of a learner's short explanation),
   and the model-size recommendation is extrapolated from adjacent work. The 4B figure this step
   used to name was superseded on 2026-08-07 by the local floor recorded at the top of this file,
   so read it as the floor of the day rather than a measured threshold. If the local floor can't
   do it, the headline feature is cloud-only or doesn't exist: find out before there is a UI
   on top. Also the test suite for the hardest component.
   **This does not need the index.** Its gold labels are spans into the *explanation text*, and
   Anchor already resolves spans into arbitrary text, so it can be hand-labelled against pasted
   explanations. Believing otherwise is what put it behind the index in the first place.
3. **Index, then Retrieve with the abstain in front of it.**
4. **Feynman.** Cohere, Compare, Contradict, then Session and Interface.
5. Everything else.

### Proposed re-cut — PROPOSED 2026-08-07, NOT DECIDED

Drafted against the pivot and the eval skip, in the same shape as the list above: one line of
dependency reasoning per entry. Nothing here is in force. It is written to be accepted or edited in
one pass, which is why the disagreements it could not settle are listed underneath it rather than
resolved quietly inside it.

0. **The falsification week, two measurements at the front rather than three.** The within-sentence
   rate needs a pen and no code so nothing gates it, and after the eval skip it is the only
   measurement left that can end the project; vault eligibility is banked in
   [#26](https://github.com/danielhkuo/HoldTrue/issues/26); the false-question rate leaves this
   entry for 3, because it runs Extract and then Cohere's set arithmetic and neither exists yet.
   Kill numbers still written down *before* any of them run.
1. **Anchor.** *Done.* Nothing waits on it any more, since the default path reads no documents, but
   Extract's spans into the user's own transcript still resolve through it, so it stays here rather
   than moving into the retrieval phase at the bottom.
2. **Extract, with its harness and ~100 labelled explanations.** Every default-path piece below
   consumes its link set and it consumes nothing but the user's own words, so it is both the first
   thing buildable and the last thing that could be deferred; the ~100 stays ~100 and narrows to
   explanation-side extraction only, since the source-passage half of Extract's input goes with
   entry 7, and the week's fifteen to twenty hand-marked explanations are its first labelled items
   rather than a separate effort.
3. **Cohere, and the false-question rate it unblocks.** Cohere needs only Extract and is
   deterministic set arithmetic, so it is cheap; the false-question rate needs Cohere's flags scored
   against the week's hand marks, and a measurement carrying a kill number belongs in front of
   anything expensive — the same reasoning that moved Extract ahead of Index on 2026-08-06.
4. **The step that produces the finding from model knowledge.** Being specced in
   [`specs/`](specs/) as this is written and deliberately not named here: it consumes the link set
   Extract produces, so it cannot precede entry 2, and since the eval skip leaves it with no
   measurement it should sit as early as that dependency allows, because the owner reading its
   output by hand is now the only signal there is that it works.
5. **Contradict.** Its second input and the source half of its two-span output both assume a
   document, so it cannot be built until it has the same default-path contract entry 4 is being
   given — which puts it behind entry 4 rather than beside it, even though at runtime the
   contradiction is checked first.
6. **Session, then Interface.** Last, always: both compose the pieces above them, and neither can be
   specified before the findings they present exist.
7. **The optional retrieval phase, gated on a decision rather than on the entries above finishing.**
   Index, then Retrieve with the abstain in front of it, then Compare, then Extract's source-passage
   input — the internal ordering is untouched and the abstain is still built before the retrieval it
   guards. What changed is that no default-path entry consumes any of it, so what it waits on is
   somebody deciding the RAG path is being built; the #20 row above already says do not build it
   before then.
8. **Everything else.**

**Why the retrieval path leaves the line instead of moving down it.** A later number still reads as
a commitment with a queue in front of it, and this work has no queue — it has a precondition, and
the precondition is a ruling. Stated rather than assumed, because it is the entry most likely to be
wrong: with the finding's eval skipped, the RAG path is now the only configuration in which
*anything* about a finding can be checked mechanically, since invariant 2 still bites wherever
something is quoted. That is a real argument for wanting it sooner than "whenever someone decides,"
and this proposal is not in a position to rule on it.

**What the falsification week's contents are now.** Nothing joined the list and nothing left it on
the merits. What changed is that the fourth measurement it might have grown — whether a
model-knowledge finding names a real gap — is now closed by ruling rather than open by omission, so
a reader wondering why there is no fourth measurement is looking at a decision and not an oversight.
One item moves, and for a reason that predates the pivot entirely: the false-question rate was never
code-free, since it runs Extract and then Cohere by its own description.

**Left for the owner, and not decided here.**

- **Whether the eval skip reaches Contradict's eval set.** The row above rules on the finding.
  Contradict is a second model-knowledge piece with its own labelling effort, whose collectability
  was already unresolved before the pivot. Extending the ruling to it would be assuming an answer;
  it is left unassumed in both directions.
- **Whether entry 4 or entry 5 comes first.** [`features/feynman.md`](features/feynman.md) holds an
  unresolved counter — treat the live child as an internal instrument and ship Contradict first,
  since a contradiction is diagnostic by construction — which if taken swaps them. This proposal
  does not take it, on the narrow ground that entry 4's contract is being written and entry 5's is
  not; that is a reason about readiness, not about which finding matters more.
- **Whether the retrieval phase gets a date or stays gated on a ruling.** Entry 7 proposes the
  ruling; the argument against is in the paragraph above it.
- **The name of entry 4.** Not invented here. It is the spec's to give, and this entry should be
  rewritten to use it once it has one.
- **One knock-on edit this pass did not make.** Moving the false-question rate out of entry 0
  contradicts [`features/feynman.md`](features/feynman.md), which describes the week as three
  measurements *"none needing a model or a line of code."* That file was not touched by this pass.
  If the re-cut is accepted, that sentence needs correcting there — this file is the single source
  where the two disagree, and a silent disagreement is how the three copies drifted the first time.

## Open

- **Which STT engine.** Voice is decided; the engine is not. Constrained by accuracy on
  thinking-aloud speech and by the absence of published fairness data on every local option.
- **When the child interrupts.** After the explanation, or mid-sentence. Mid-sentence needs a
  streaming pipeline and is a much bigger build.
- **What warrants invariant 8, now that its stated warrant is gone.** The invariant still holds;
  the reason for it does not. The live option is widening the model's reading window while
  keeping per-sentence emission, and the within-sentence measurement decides it. Reasoning under
  the Feynman design table above.
- TTS. Unresearched. The child may not need a voice.
- Repo name and the public push. `origin` was repointed to `danielhkuo/HoldTrue`.

**Opened by the 2026-08-07 pivot.** These are named and deliberately not answered. A decision taken
this evening does not get its consequences designed the same evening, and this file's own rule is
that a row with no reason is not a decision — so none of these gets a row until someone has a
reason.

- ~~**The eval has lost its ground truth.**~~ **RULED ON 2026-08-07**, later the same day, by the
  skip recorded [at the top of this file](#the-source-of-the-finding). The eval for the finding is
  not being built, and the cheaper falsification-scale version was offered and declined; both are in
  that row with the cost. Kept visible because the diagnosis under it was right and half of it is
  still live. What holds: the notes were the authority for the *measurement*, not only for the user,
  and *did the model find a real gap in this person's understanding* has no gold standard short of a
  subject expert per case. **What this bullet got wrong, and a reader should not inherit.** It swept
  the falsification week and the 100–150 labelled items in with the rest, and neither belongs there.
  The week's measurements score the user's own explanation against hand marks on that same
  explanation; the 100–150 labels are spans into explanation text. Both are untouched by the pivot,
  as `AGENTS.md` and [`features/feynman.md`](features/feynman.md) each say in their own words.
  **What is still open** is the eval for **Contradict**, which is a separate labelling effort with
  its own unresolved collectability and is not covered by the skip either way, and what *"calibrated
  against"* can mean for a piece nobody is measuring.
- **Most of the decomposition is off the default path.** Index, Retrieve and Compare have no
  subject when there is no corpus. #20 and #22 are marked *scoped to the optional RAG path* above
  for exactly this reason. What the default path decomposes into instead is unanswered, and nothing
  should be re-cut until it is.
- **Anchor's role has changed.** `src/index/anchor.ts` — the one piece actually built, 30 tests,
  mutation score 100% — was the foundation everything else read from. It becomes optional
  infrastructure for the RAG path and for any citation that still gets quoted. It is neither wasted
  nor deleted, and its status line should say what it is now for.
- **Invariant 4 needs a new rationale or a repeal.** `confidence` as brake pressure was a
  consequence of Law 2. It may still be good practice, but its stated reason is gone. Marked for
  review rather than silently kept or silently dropped.
- **What replaces invariant 3's mechanical check.** Invariant 3 was repealed as stated, and it was
  the rare invariant that was *mechanically checkable and required a test*. Whatever takes its place
  should be checkable too, or the repo quietly loses a check and will not notice the loss — the
  characteristic failure mode of repealing a constraint that a test was enforcing.
- **How much design budget the roleplay may claim.** Recorded earlier on 2026-08-07 and still open,
  now with more riding on it: the roleplay's justification is the fiction, and the fiction is what
  the pivot just made central.
