# Spec: Extract

> **DORMANT — 2026-08-19.** The pivot in [`../decisions.md`](../decisions.md), *The child is the
> product, and determinism returns as prompt material*, took this piece off the live path. It is not
> deleted and it is expected back, one signal at a time, under the re-admission rule in that row: a
> deterministic signal returns only when it is shown to change what the child says, for the better,
> across more than one pass. A turn is now one model call, and this is not it.
>
> **What a return has to answer, and it is recall rather than anchoring.** The dominant failure is
> silence: **35.70% missing relations against 0.31% false positives**, roughly 115 missed links for
> every spurious one. On a real four-turn session this piece returned **zero** links on two of the
> four turns, raw payload `{"links":[]}` with `dropped: 0` on every run. Nothing failed to anchor
> because nothing was offered, which settles that the gate was innocent. Prompt rules 6 and 7 —
> hedges and a bare pronoun subject, and a stative verb still being a link — were added on
> 2026-08-16 and recovered both turns, on two independent passes, gains only.
>
> **Three noun-phrase rewrites were tried the same day and all three were reverted.** The record of
> why is `src/feynman/extract.ts`'s header and nothing here repeals it: the join-rate win came from
> extracting *less*, and the variant that scored best on planted gaps returned the identical three
> links for three different input texts one replication later. Read that header before trying a
> fourth.

> **Status: half built, corrected 2026-08-12.** `validate` and `normalise` ship with 56 tests, and
> `extract.ts` runs — against ruling 3, which it violates knowingly and says so. What is not built is
> the harness and the ~100 labelled explanations, which is what build-order entry 2 actually is.
> Sections 1 to 6 are written; section 6 is `validate`'s oracle and section 7 waits on the harness.
> The line below said *nothing built* for two days after `validate` shipped, and said *six rulings*
> where section 5 holds **eight** — 1, 2, 4, 5 and 6 open, 3, 7 and 8 ruled. All eight
> were taken on 2026-08-10 under a delegated call — read section 5's preamble before treating any of
> them as the owner's own.
>
> **Ruling 3 was re-ruled the same day and the spec is smaller for it.** Extract no longer cuts
> sentences; it is handed them. `segment` is gone, and finding sentence boundaries moved into
> Transcribe behind a per-engine adapter, because every signal it could have used turned out to be
> an artifact of an engine nobody has chosen. Read ruling 3 before the API.
>
> Build order entry 2, and the entry that carries the project's kill switch: if a local model cannot
> do this, the headline feature is cloud-only or it does not exist. **Stale as of 2026-08-19 and
> kept for the reasoning:** the build order this entry sits in described the deterministic live
> phase, and nothing is queued behind this piece while it is dormant. The kill switch still applies
> to whatever re-admits it.

## 1. What it does

Extract reads what you said, one sentence at a time, and returns the causal links you asserted —
each with a span into your own words.

It **was** the first model call in the live phase, and every finding was built on its output: Cohere
found where the chain did not close, and Speak was handed those shapes. **Past tense as of
2026-08-19** — see the dormancy banner. The live phase is one model call now and this is not it, so
nothing downstream is fed by this piece today. The paragraph below is kept because it records what
the contract was and what invariant 9 actually forbids, both of which return with the piece.
**Corrected 2026-08-12, on all three counts.** This used to say *only*, it used to name Notice and Voice, and it used to call
the no-second-pass rule invariant 9. The live phase called three models per turn: this one, the
child's line, then this one again over that line for the audit. **That shape ended 2026-08-19** —
one call, the child's, and the audit pass went with the rest of the pipeline. Invariant 9 forbids **diffing two
extractions of the user's own words**, which is narrower than never re-reading anything. What is
still true, and is what this piece guarantees, is that Extract runs once per sentence of your
transcript and nothing re-extracts your words to check them.

It is also the piece whose errors nothing catches. A link you stated that Extract misses looks
downstream like a gap you have, and the child will ask about a step you did explain.

## 2. Public API

Three exported functions, not one, because **model-dependent does not mean all model.** Segmentation
and validation are ordinary code and carry an oracle, a red team and a mutation run. Only the middle
is the model.

```ts
// src/feynman/extract.ts

import type { Anchor, Doc } from '../index/anchor'

/** One sentence, as Transcribe's adapter cuts it. `anchor.quote` is the sentence text, and
    the anchor resolves against the full transcript. Ruling 3.

    `dropped` counts links the model returned for this sentence that could not be anchored.
    **It is per-sentence, not per-extraction, and that is deliberate.** A dropped link is not
    necessarily a wrong one — a paraphrase can be a real link the model found and worded its
    own way, thrown away because there is nothing to anchor. So a non-zero `dropped` means
    *we know we lost something real here*, which is the only signal in the whole piece that
    points at a specific sentence. One reader today: `npm run demo` prints it beside the child's
    line. `resay`, the move that fired on it, went with the deterministic child under
    child-speech.md ruling 11 and **came back the same day under its ruling 18**, with a different
    trigger: an unintelligible turn rather than a dropped link. The count stays, because knowing where we lost something is what it
    is for. **It is never displayed to a user**: invariant 7 bans a count beside a diagnosis, and
    the demo is a developer surface. The day that line reaches a real one it breaks the invariant.
    Ruling 7. */
type Sentence = {
  readonly anchor: Anchor
  readonly dropped: number
}

/** A closed set, so `conflict` is decidable and the audit compares a relation by equality.
    Ruling 2. */
type Relation = 'causes' | 'enables' | 'prevents' | 'requires'

/** What you said connects to what. Both sides carry their own anchor, because the shapes the
    child is handed quote them separately and the audit compares them separately. Ruling 1. */
type Link = {
  readonly cause: Anchor
  readonly effect: Anchor
  readonly relation: Relation
  readonly sentence: Anchor
}

type Extraction = {
  readonly links: readonly Link[]
  /** Every sentence read, in order — including those that yielded no link. Cohere needs
      the ones that yielded nothing as much as the ones that did. Each carries how many
      links were dropped on it. */
  readonly sentences: readonly Sentence[]
}

type ExtractResult =
  | { readonly kind: 'extraction'; readonly extraction: Extraction }
  | { readonly kind: 'unavailable'; readonly reason: string }

/** What survived, and how much did not. Ruling 8. */
type Validation = {
  readonly links: readonly Link[]
  readonly dropped: number
}

/** Deterministic. Turns whatever the model returned for one sentence into links, or into
    nothing. Every anchor it emits is minted here from offsets into that sentence — the model
    never supplies an offset. Carries its own oracle. */
validate(sentence: Sentence, raw: unknown): Validation

/** The piece. Takes sentences already cut, never raw transcript text — see ruling 3.
    Total: a model that returns junk or is unreachable is a result, never a throw.

    **The code does not do this yet, and says so.** `src/feynman/extract.ts` takes a string and
    calls `cutSentences` itself, marked SKELETON as a knowing violation of ruling 3 — the
    adapter Transcribe owes does not exist. Noted here 2026-08-12 because the spec read as
    though it were describing the code. */
extract(sentences: readonly Sentence[], model: ModelHandle): Promise<ExtractResult>
```

`ModelHandle` is the same shape [`supply.md`](supply.md) declares, and its ruling 8 — that it belongs
to a model-client module that does not exist yet — governs here too. This spec does not re-open it.

## 3. What it must not do

- **No offsets from the model.** `validate` mints every anchor from offsets it computes itself
  against the sentence text. A model that returns a character position is returning a number this
  piece throws away. This is how invariant 2 stays mechanically true without a second validation
  path.
- **No quote that is not a literal substring.** `createAnchor` returns `null` for an unusable range,
  and a null is a dropped link, not a warning.
- **No reading across a sentence boundary at emission.** Invariant 8. Whether the model may *see*
  more than one sentence is ruling 4 and a different question.
- **No second pass over your words.** Invariant 9. Extract runs once per sentence of your
  transcript, and nothing re-extracts your words to check them. It is not a ban on running Extract
  at all again: since 2026-08-12 the audit runs it over the child's line, which is not your words.
- **No marking a retraction.** When you correct yourself mid-explanation, Extract emits the wrong
  link and the corrected link, both. See ruling 5.
- **No judgement about you.** Extract reports what was asserted, not whether it was true, clear or
  complete.
- **No throwing.** One sentence failing costs that sentence. **`unavailable` is overloaded and the
  code is what diverges** — `extract.ts:81` also returns it for an empty input, reason *nothing to
  read*, which the tally then logs as `unread`: a note saying the model could not read a turn it was
  never asked to read. Recorded 2026-08-12; the two need separating. As specified, only a model that
  cannot be reached at
  all produces `unavailable`.

## 4. Invariants that apply

Numbered and quoted in full, per `AGENTS.md`, because a number tells you where a rule lives and not
whether it is in force.

**Invariant 8**, quoted: *"Extraction is per-sentence, never one-shot over a whole explanation."*
This is the invariant the piece is shaped around. **Marked unwarranted pending measurement
2026-08-07, and still in force.** The published figure quoted as its warrant was traced to a
keyword-filtered corpus of biomedical abstracts that cannot carry it, and the invariant predates that
citation anyway. What settles it is
[`measurements/within-sentence/README.md`](../../measurements/within-sentence/README.md), which has
not been run. So write per-sentence emission and do not widen it on your own authority — and do not
argue it either way from a published number.

**Invariant 2**, quoted: *"Quotes are validated as literal substrings of the source before display;
a non-matching quote is a rejected extraction, not a warning."* Its scope narrowed on 2026-08-07 and
it was not repealed. It reaches every anchor this piece emits. `src/index/anchor.ts` is where it is
enforced, and section 3's ban on model-supplied offsets is what keeps this piece inside it.

**Invariant 9**, quoted: *"Never diff two extractions of the user's own words."* The struck clause
that followed was repealed; the prohibition above it stands untouched. Extract reads each sentence
of your transcript once, and no consumer re-extracts your words to check them. **The audit added
2026-08-12 runs Extract over the child's line**, which is not your words, so it does not reach this
invariant — and a reader who remembers this rule as *never run Extract twice* will think it does.

**Invariant 1**, quoted: *"No user-facing text originates from the model."* **REPEALED 2026-08-07**,
and quoted because an agent will import it from memory. It never bound this piece hard anyway —
Extract's output is spans into your own words, not prose — but do not cite it here as though it were
live.

**Cited and found not to reach this piece: invariants 5, 6 and 7.** Extract asks nothing, phrases
nothing at a person and displays nothing. They govern what is built on top of it.

## 5. Rulings and open questions

**All six ruled 2026-08-10, and the authority behind them should be visible.** The owner delegated
the call — *"just pick one and run with it"*, then *"lets move"* — so these were taken by an agent
under a standing instruction to decide rather than by the owner reading each one. Every proposal and
every rejected alternative is written out below, which is what makes them cheap to reverse. **If any
one of them is wrong, the cost is a signature change before code exists**, which is the cheapest
moment there is. Section 2 is written against these, and the oracle may now start.

One precondition survives the rulings and is not this spec's to close — see the note under ruling 3.

### 1. Does a link carry one anchor or one per side? OPEN.

**Ruled 2026-08-10:** one per side, plus the sentence. [`supply.md`](supply.md) invented a `Link` with a
single `anchor` and recorded it as a guess this spec would settle. It guessed wrong, and the reason
is downstream: [`child-speech.md`](child-speech.md)'s audit asks whether a link in the child's line
is one your graph already holds, and it can only ask that if cause and effect arrive as separate
quotes. A sentence-level anchor cannot say which words were the cause. **Restated 2026-08-12**: this
used to cite a guarantee enforced before the child spoke — *no child utterance names a concept
absent from the transcript* — which is now a comparison run afterwards. The shape it needs did not
change, which is why the ruling stands untouched.

**Rejected: one anchor for the whole link**, which is smaller and makes the comparison unenforceable.
**And an anchor on the relation too**, which sounds symmetrical and has no consumer — nothing in
`child-speech.md` quotes a relation.

### 2. Is `relation` a closed set or a free string? OPEN.

**Ruled 2026-08-10:** the closed set in section 2 — `causes`, `enables`, `prevents`, `requires`. Two
consumers force it. The audit compares a relation by equality, and equality over a free string is
not a comparison anyone can reason about. Cohere's `conflict` has to decide that two links disagree,
which is decidable over a closed set and a model judgement over free text — and putting a model
judgement inside Cohere undoes the ruling that put `conflict` there in the first place. **Restated
2026-08-12**: the first consumer used to be Voice's template set, which child-speech.md ruling 11
retires. The ruling is
unchanged, and it now rests on the audit instead.

**Rejected: a free string**, which is more faithful to what people say and gives both consumers an
open-ended problem. The four were chosen against the 18 transcripts in
[`../transcripts/`](../transcripts/) and cover them; if a fifth is needed, this is the ruling to
reopen rather than a place to add one quietly.

### 3. What is Extract's input, exactly? RE-RULED 2026-08-10, hours after the first ruling.

**Ruled: a list of sentences, already cut. Extract does not segment, and `segment` is deleted from
this spec.** Sentence-finding moves into Transcribe, behind a per-engine adapter.

**The first ruling was *a `Doc`, and Extract segments it*, and it does not survive.** It rejected
Transcribe's richer output on the ground that pause data is *"either useless here or refused
elsewhere"*, citing the evidence base's refutation of disfluency. That citation was misapplied.
What the evidence refutes is reading a pause as **doubt about the content** — Schachter et al.
1991, where filled-pause rates varied threefold by discipline at ceiling certainty. Reading a pause
as a **syntactic boundary** is a different claim about a different thing, and nothing in the
evidence base touches it.

**What forced the change.** Held against a real transcript, every signal `segment` could have used
turned out to be an artifact of a specific engine: newlines fell mid-sentence in 131 of 145 lines,
capitalisation failed where the transcriber garbled a proper noun, and `>>` and `[Music]` are that
engine's conventions and nobody else's. Some engines emit no punctuation at all. **Extract cannot
have a contract that depends on which engine gets chosen**, and the engine is an open row in
[`../decisions.md`](../decisions.md).

**Why Transcribe and not a third piece.** The quirks are per-engine, so they belong with the thing
that knows which engine ran. An engine that punctuates well can be segmented on punctuation; one
that does not can be segmented on pause timing, which every engine reports and which is a fact about
the speaker rather than about the transcriber. Both live behind one interface, and swapping engines
swaps one adapter. That is seam question 2 in [`../workflow.md`](../workflow.md) answered honestly.

**Rejected: keeping `segment` in Extract and picking a punctuating engine to suit it**, which lets a
piece with a kill number dictate an unrelated decision. **And a third piece between them**, which
adds a seam without adding a boundary — it would still have to know which engine ran.

**The cost, and it is real.** Transcribe is marked *model, outside the gate*, so this moves
correctness-critical work into a piece held to a lower standard. The answer is that the **adapter**
is deterministic code around the model call and is gated normally, exactly as `validate` is here.
Transcribe's contract has to change to say so, and that is
[`../features/feynman.md`](../features/feynman.md)'s row to change rather than this file's.

### 4. May the model see more than one sentence? OPEN, and not blocking.

**Ruled 2026-08-10:** no, for now. The model sees one sentence and emits links inside it.

**Recorded because a reader will look for it, and because it does not change a signature.** The live
option named in [`../decisions.md`](../decisions.md) is widening the model's *reading* window while
keeping per-sentence *emission*, which is a prompt-level change and leaves `extract`'s shape alone.
What decides it is the within-sentence measurement, not an argument. Under the gate at step 4 of
`/holdtrue-workflow`, this one does not hold the oracle.

### 5. What happens when the speaker retracts? OPEN.

**Ruled 2026-08-10:** nothing. Extract emits the wrong link and the corrected link, and marks neither.

**This is the ruling the transcripts actually forced.** In [`../transcripts/`](../transcripts/), six
of eighteen explainers corrected themselves mid-explanation — *"wait, no, hold on, I think I did that
backwards"*, *"back up though, I skipped a part"*. Every one of those produces two links from one
speaker that disagree.

**Rejected: detecting retractions and marking the superseded link.** The markers are a closed set and
cheap to match, but knowing *what* was retracted is a judgement, and that grows the model box —
which `docs/workflow.md` names as the expensive mistake. The proposal instead lets
[`child-speech.md`](child-speech.md)'s `conflict` move surface it, which is honest: to a listener,
a retraction and a genuine self-contradiction are the same event.

### 6. Does a failed sentence abort the extraction? OPEN.

**Ruled 2026-08-10:** no. A sentence whose model call fails or returns junk contributes no links, increments
`dropped`, and the rest continues. Only an unreachable model gives `unavailable` — as specified; see
section 3 for how the code diverges.

**Rejected: aborting the whole extraction**, which is Supply's behaviour and correct there — Supply
failing means a gap was opened and cannot be closed, which Law 1 forbids. Extract opens nothing. A
missing link degrades the finding rather than breaking a promise, and stopping a live session
because one sentence would not parse is worse than the sentence being missing.

### 7. Is `dropped` per sentence or per extraction? RULED 2026-08-10, by the owner.

**Ruled: per sentence**, on his observation that a sentence the extractor half-failed on is exactly
where the child should ask a question.

The reasoning that came out of it corrects something this spec had wrong. A dropped link was
described here as junk. It is not necessarily: a paraphrase can be a **real link the model found and
worded its own way**, discarded because there is nothing to anchor. The published 0.31% measures
links that were *wrong*; validation failure measures links we *cannot verify*, and those are
different sets. So a non-zero `dropped` on a sentence means the system knows it lost something real
**there** — the only signal in this piece that points at a specific sentence rather than at the whole
transcript.

**Stale, 2026-08-19, and it was already stale before the pivot.** This said
[`child-speech.md`](child-speech.md) consumes `dropped` as the `resay` move. It does not: `resay`
was cut and came back the same day under that spec's ruling 18 with a different trigger — a turn
nobody could understand, decided by a gate that runs before `speak` — and the banner on section 2's
`Sentence` type already says so. Nothing reads `dropped` today, and nothing produces it either while
this piece is dormant. The reasoning is kept because it is why the count is per-sentence: saying the
sentence again would give Extract a second attempt at it, and that is the one move in the design
that recovers a loss instead of reporting one.

**Rejected: one count for the whole extraction**, which is what this spec said until today and which
carries no information a consumer can act on — you cannot ask about a sentence you cannot name.
**And treating it as a clarity signal**, which is forbidden: *your explanation was unclear* has no
ground truth, and extraction difficulty is mostly a fact about the model rather than the speaker.

**What it does not reach.** Links the model never found leave no trace — no dropped count, no
signal, nothing. That is the 35.70% and it remains the dominant failure, untouched by this.

### 8. What does `validate` return? RULED 2026-08-10, by the owner.

**Ruled: `{ links, dropped }`, not a bare link array.**

**Found by writing the tests, and it is a contradiction between two of the owner's own rulings
rather than a new question.** Ruling 7 makes `Sentence.dropped` a per-sentence count and
[`child-speech.md`](child-speech.md)'s `resay` move depends on it. But section 2 had `validate`
returning `readonly Link[]`, so it could report what survived and never what did not. `extract`
receives three links and cannot tell whether the model offered three or six.

**Rejected: `extract` re-parsing `raw` and counting.** It duplicates validation, the two copies can
disagree, and it cannot count entries in a payload that never parsed — which is the input this piece
meets most often.

**Note what this costs, so it is not read as free.** `dropped` counts links that were *offered and
could not be anchored*. A payload that failed to parse at all offers nothing, so it drops nothing,
and `dropped` is 0 on a sentence where the system learned less than usual. Distinguishing *the model
said nothing* from *the model said something unreadable* needs a third channel this ruling does not
add.

## 6. The oracle for `validate`

**Written by the owner on 2026-08-10, transcribed here.** Examples 1, 2 and 3 are his. Example 4 is
agent-proposed and still open — see the note on it. Do not edit this section to make an
implementation pass.

**What correct means.** A link survives `validate` when the model's cause and effect both appear in
the sentence once filled pauses and stammers are ignored, and the anchor it gets points at the raw
words the speaker actually said.

**The three examples.**

1. **A filled pause inside a match.** The speaker said *"push the uh handle down"*. The model returns
   *"push the handle down"*. This is a **match** — filler words and disfluencies are filtered before
   comparing. The anchor spans the raw text, so its `quote` is *"push the uh handle down"*, including
   the *uh*. The comparison is normalised; the anchor never is.

2. **A phrase that appears twice.** The sentence is *"the water flowing downstream moves the
   waterwheel and that moves the water inside the building"*. The model returns *"the water"*. The
   anchor points at the **first** occurrence.

   **This is a known defect, recorded as one.** In that sentence the two occurrences are different
   things, so the first is the wrong one. It is accepted because refusing every ambiguous match adds
   to Extract's dominant failure — 35.70% missed relations against 0.31% false positives — and a
   refused link is lost permanently where a mis-anchored one costs a slightly wrong quote. The
   **prompt** carries the mitigation, not the validator: ask for the longest span that identifies the
   phrase uniquely, which makes *"the water flowing downstream"* the answer and collapses most of the
   case.

3. **A paraphrase.** The sentence is *"when you push the handle down"*. The model returns
   *"pressing the lever"*. Same meaning, not the speaker's words, nowhere to anchor. **Dropped.**

4. **A mixed list.** The model returns six links for one sentence; three anchor cleanly and three are
   paraphrases. **The three good ones are kept, the three unanchorable ones are dropped, and
   `sentence.dropped` is 3.** The whole sentence is not discarded — that would add to the dominant
   failure — but the loss is recorded against that sentence so the child can ask about it.

   **Settled by the owner on 2026-08-10, and he reframed it rather than answering it.** Asked to
   choose between keeping the good links and binning the sentence, he asked whether this was not the
   moment the child should ask for clarification. It is, and the answer improved the design: see
   ruling 7 and the `resay` move.

**The invariant, in plain words.** For any sentence and any model output, every anchor `validate`
returns resolves to a span inside that sentence, and that span's text — normalised — contains the
model's phrase, normalised. Anything that cannot satisfy both is dropped rather than repaired.

**One thing the oracle creates, which neither spec owned before.** Matching on normalised text while
anchoring into raw text needs a **normaliser that carries an offset map** — strip *uh*, collapse
*it's it's*, and remember which raw characters survived, so a match found at normalised position 12
can be minted as a raw span. That is ordinary deterministic code and it needs its own tests.

**It must be the same normaliser the audit uses.**
[`child-speech.md`](child-speech.md)'s ruling 6 cleans every phrase the child is handed, and its
audit compares concepts **after the same normalisation** — `conceptOf` is that normaliser plus
lowercase. Two normalisers that drift apart make the comparison wrong silently, which is the worst
way for it to break. **Restated 2026-08-12**: it used to name Voice, and a property enforced before
the child spoke rather than a comparison run after. So this is one shared module with one set of tests, owned by neither piece.

**What the generator must produce.** Sentences carrying filled pauses inside a candidate span;
stammer repeats inside a candidate span; a phrase repeated two and three times in one sentence;
model output that is a paraphrase, that is valid JSON of the wrong shape, that is not JSON at all,
that names a relation outside the closed set, that returns an empty string, and that returns a
mixed list of good and bad links. Sample it and assert the category counts before trusting a green
run — degrading one generator to plain ASCII once left every property green at a mutation score of
100%.

## The eval

Not section 6, which is the property generator's, and not written yet. **Nobody is building this
now** — the piece is dormant as of 2026-08-19 and no eval is queued. Kept because it is what a
return needs: the four layers survived the 2026-08-07 pivot as written, and the recall defect in the
dormancy banner is precisely what an eval of them would have caught.

All four do. Extract's labels are spans into the text Extract reads, and that text is the user's own
explanation — never the notes — so nothing about the pivot reaches them. The layers are schema
validation as a hard fail; the invariants as properties that hard-fail; aggregate precision, recall
and F1 against gold labels, never per-case pass/fail; and regression measured **paired** against the
previous prompt on the same fixed set. 100–150 labelled items. **No LLM judge** — set comparison
against gold.

The falsification week supplies the first items: fifteen to twenty explanations with every causal
link hand-marked. Its protocol is
[`measurements/within-sentence/README.md`](../../measurements/within-sentence/README.md), which is
the operative document. The 18 files in [`../transcripts/`](../transcripts/) are **not** those items
and are not labelling material — they are generated, and their README says so.

One rule from `/holdtrue-workflow` that is easy to skip: **label 30 items completely cold**, no agent
and no suggestions on screen, then run the assisted process over those same 30 and compare. If it
disagrees with you, label the rest by hand. Skipping that is how an eval set ends up agreeing with
the model rather than with reality.

## What the research says to expect

One paragraph, because it bears on the prompt and not on the contract. Figures and their sources are
in [`../research/extraction-benchmarks.md`](../research/extraction-benchmarks.md); nothing is
restated here that is not already sourced there.

No published number covers this genre — spoken, from-memory explanation by a learner. The best open
model measured on pairwise causal extraction reached **47.12%**, and that is a *conditional*
figure — the score after the relation has already been found — so it reads better than the task
goes. Performance *"degraded substantially for implicit relationships, multi-sentence links, and
texts with multiple causal pairs"*, all three of which describe this input.

**The failure mode is settled, and it is the opposite of what this repo has been guarding against.**
The same paper's Table 7 gives **35.70% missing relations against 0.31% false positives** — roughly
115 missed links for every spurious one. Extract will be **silent**, not over-assertive. Three
things follow, and they are constraints on the prompt rather than context:

- **Defend recall, not precision.** The false-positive worry that shaped the surrounding literature
  is nearly free at this scale.
- **A missed link is not a harmless absence.** It reaches Cohere as a hole, and the child asks about
  a step you did explain — the failure [`child-speech.md`](child-speech.md) names as likeliest.
- **Do not add a propose-then-verify stage.** It buys precision at a cost in recall, which is
  exactly the wrong trade here, however well it reads in the literature.

One model-selection finding stands alongside: **reasoning-tuned models abstain 24% less** than their
instruction-tuned counterparts. That cuts both ways now — a model that says *yes* more often is what
this piece needs on recall, and what the rest of the product does not want anywhere else. It is a
reason to pick per-piece rather than once.
