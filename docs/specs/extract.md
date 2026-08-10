# Spec: Extract

> **Status: draft, nothing built, 2026-08-10. Section 5 is ruled and the oracle is unblocked.**
> Sections 1 to 5 written; 6 comes at the oracle step and 7 when the piece ships. All six rulings
> were taken on 2026-08-10 under a delegated call — read section 5's preamble before treating any of
> them as the owner's own.
>
> **One precondition is open and belongs to another file.** Whether the chosen speech engine emits
> punctuation decides whether `segment` has boundaries to find at all, and the engine is undecided in
> [`../decisions.md`](../decisions.md). That does not block the oracle, because `segment`'s contract
> is the same either way, but it blocks a real session.
>
> Build order entry 2, and the entry that carries the project's kill switch: if a local model cannot
> do this, the headline feature is cloud-only or it does not exist.

## 1. What it does

Extract reads what you said, one sentence at a time, and returns the causal links you asserted —
each with a span into your own words.

It is the **only model call in the live phase**, and everything downstream is arithmetic over its
output. Cohere finds where the chain does not close, Notice picks what the child asks, Voice says
it. None of them reads your transcript again. That is invariant 9, and it is why this piece runs
once per sentence and never twice over the same words.

It is also the piece whose errors nothing catches. A link you stated that Extract misses looks
downstream like a gap you have, and the child will ask about a step you did explain.

## 2. Public API

Three exported functions, not one, because **model-dependent does not mean all model.** Segmentation
and validation are ordinary code and carry an oracle, a red team and a mutation run. Only the middle
is the model.

```ts
// src/feynman/extract.ts

import type { Anchor, Doc } from '../index/anchor'

/** One sentence, as `segment` cuts it. `anchor.quote` is the sentence text. */
type Sentence = { readonly anchor: Anchor }

/** A closed set, so Voice's templates are finite and `conflict` is decidable. Ruling 2. */
type Relation = 'causes' | 'enables' | 'prevents' | 'requires'

/** What you said connects to what. Both sides carry their own anchor, because Notice and
    Voice quote them separately and must never name words you did not say. Ruling 1. */
type Link = {
  readonly cause: Anchor
  readonly effect: Anchor
  readonly relation: Relation
  readonly sentence: Anchor
}

type Extraction = {
  readonly links: readonly Link[]
  /** Every sentence read, in order — including those that yielded no link. Cohere needs
      the ones that yielded nothing as much as the ones that did. */
  readonly sentences: readonly Sentence[]
  /** Links the model returned that failed validation. A diagnostic, never displayed:
      invariant 7 bans a count beside a diagnosis, and this is not one. */
  readonly dropped: number
}

type ExtractResult =
  | { readonly kind: 'extraction'; readonly extraction: Extraction }
  | { readonly kind: 'unavailable'; readonly reason: string }

/** Deterministic. Cuts the transcript into sentences. Carries its own oracle. */
segment(transcript: Doc): readonly Sentence[]

/** Deterministic. Turns whatever the model returned for one sentence into links, or into
    nothing. Every anchor it emits is minted here from offsets into that sentence — the model
    never supplies an offset. Carries its own oracle. */
validate(sentence: Sentence, raw: unknown): readonly Link[]

/** The piece. Total: a model that returns junk or is unreachable is a result, never a throw. */
extract(transcript: Doc, model: ModelHandle): Promise<ExtractResult>
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
- **No second pass over the same words.** Invariant 9. Extract runs once per sentence, and nothing
  downstream re-reads the transcript to check it.
- **No marking a retraction.** When you correct yourself mid-explanation, Extract emits the wrong
  link and the corrected link, both. See ruling 5.
- **No judgement about you.** Extract reports what was asserted, not whether it was true, clear or
  complete.
- **No throwing.** One sentence failing costs that sentence. Only a model that cannot be reached at
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
once, and no consumer reads the transcript again.

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
is downstream: [`child-speech.md`](child-speech.md)'s guarantee is that *no child utterance names a
concept absent from the transcript*, and Voice can only honour that if it is handed the cause and
the effect as separate quotes. A sentence-level anchor cannot say which words were the cause.

**Rejected: one anchor for the whole link**, which is smaller and makes the guarantee unenforceable.
**And an anchor on the relation too**, which sounds symmetrical and has no consumer — no move in
`child-speech.md` quotes a relation.

### 2. Is `relation` a closed set or a free string? OPEN.

**Ruled 2026-08-10:** the closed set in section 2 — `causes`, `enables`, `prevents`, `requires`. Two
consumers force it. Voice renders a move into a template, and a free string makes the template set
unbounded. Notice's `conflict` move has to decide that two links disagree, which is decidable over a
closed set and a model judgement over free text — and putting a model judgement inside Notice
undoes the ruling that put `conflict` there in the first place.

**Rejected: a free string**, which is more faithful to what people say and gives both consumers an
open-ended problem. The four were chosen against the 18 transcripts in
[`../transcripts/`](../transcripts/) and cover them; if a fifth is needed, this is the ruling to
reopen rather than a place to add one quietly.

### 3. What is Extract's input, exactly? OPEN.

**Ruled 2026-08-10:** a `Doc` — the transcript as one string with a content hash, which is what Anchor
already resolves against.

**Rejected: Transcribe's timed segment list.** It carries more, including where the speaker paused,
and every bit of that is either useless here or refused elsewhere — disfluency as a signal is
refuted in the evidence base and may not appear in this product.

**This ruling has a hazard the other two do not.** The transcript-correction step was reversed on
2026-08-05, so nothing verifies Transcribe's output before it reaches here, and sentence boundaries
in ASR output are the engine's punctuation guess rather than the speaker's. If the chosen engine
emits unpunctuated text, `segment` has no boundaries to find and invariant 8 has nothing to stand on.
**Whether the engine punctuates is a precondition of this ruling, and the engine is still open** —
see [`../decisions.md`](../decisions.md) and the three `stt-*` research files.

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
`dropped`, and the rest continues. Only an unreachable model gives `unavailable`.

**Rejected: aborting the whole extraction**, which is Supply's behaviour and correct there — Supply
failing means a gap was opened and cannot be closed, which Law 1 forbids. Extract opens nothing. A
missing link degrades the finding rather than breaking a promise, and stopping a live session
because one sentence would not parse is worse than the sentence being missing.

## The eval

Not section 6, which is the property generator's, and not written yet. Recorded here because
`AGENTS.md` says **build Extract against the four layers as written** and a builder needs to know
which of them survived the pivot.

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
model measured on pairwise causal extraction reached **47.12%** on a metric the abstract calls a mean
score, and performance *"degraded substantially for implicit relationships, multi-sentence links, and
texts with multiple causal pairs"* — all three of which describe this input. Two findings reach the
prompt directly. A **propose-then-verify split** buys precision at a small cost in recall, and the
gain held for open-weight backbones. And **reasoning-tuned models abstain 24% less** than their
instruction-tuned counterparts, which is a measured reason to prefer an instruction-tuned model at
the local floor for a piece whose downstream failure is a question about a step the user did explain.

Whether Extract's failure mode is silence or over-assertion is **unresolved**, and the one unopened
paper that would settle it is named in that file's open list.
