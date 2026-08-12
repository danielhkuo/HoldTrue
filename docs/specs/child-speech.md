# Spec: the child's speech

> **Status: specced, not built. 2026-08-12.** Sections 1–5 are written; section 6 is written at the
> red-team step and section 7 when the piece ships. **No ruling blocks the oracle.** Rulings 7 to 11
> are settled. Ruling 13 asks only for a name, and it is answered before the oracle file is created.
>
> This replaces the deterministic design of the same morning, and reverses
> [`../decisions.md`](../decisions.md)'s *The child speaks only from your own words* of 2026-08-10.
> That reversal belongs to `decisions.md` and is recorded there, not here.

**Ruling numbers in section 5 are permanent addresses**, the same convention `AGENTS.md` uses for
invariants. A ruling that dies keeps its number and its strikethrough. Five sites cite *this file's*
ruling 6: `normalise.ts:7`, `voice.ts:7`, `voice.ts:30`, `validate.test.ts:1114` and
`validate.test.ts:1245`.

**Two specs have a ruling 6, and most of the code cites one of them as a bare `(ruling 6)`.**
[`extract.md`](extract.md)'s ruling 6 is the totality rule — a model that fails is a result, never a
throw — and it is cited at `extract.ts:77`, `validate.ts:20`, `validate.ts:108`,
`validate.test.ts:734`, `:1405`, `:1430` and `:1468`. The first draft of this list claimed
`validate.ts:20` for this file and was wrong. Write the file name when citing a ruling.

## 1. What it does

You say a sentence. A model says one line back, as the child. Then a second pass reads that line and
writes down anything the child said that you did not.

The model is what makes the child worth talking to. It answers the sentence that just landed, it can
ask a question that points forward, and it does not produce a non-sequitur every fifth turn. What it
buys with that fluency is knowledge you never gave it, and that same knowledge can ratify a belief
you do not hold. So the guarantee is not that the child cannot say such a thing. The guarantee is
that it cannot say it without being written down.

**What the ledger is for.** It is a work list for the review phase, and that is the whole of it. A
row is one thing Supply can pick up and close. It is not a record of the child's mistakes — this
piece cannot tell true from false, ruling 13 — and it is not a score, which invariant 7 and ruling
16 both forbid. It is not new either: [`../decisions.md`](../decisions.md)'s plant ledger of
2026-08-10 is the same ledger with a narrower inlet, when only a `guess` could write to it.

**A link row is a debt** and Law 1 forbids ending the session with one open — invariant 5, quoted in
section 4. **A word row is a note** and is owed nothing, because there is no proposition in it for
anyone to close. Ruling 15.

The test for whether something belongs in the ledger at all is one question: **what would the review
phase do with this row?** If the answer is nothing it is not already doing, it is not a row.

## 2. Public API

Two pieces, split at the model call, because only one half can be tested without a model.

**Speak.** The model call. It is handed the conversation so far and the shapes Cohere found, and the
shapes are context, never an instruction.

```ts
import type { Shape } from './cohere.js'
import type { ModelHandle } from './model.js'

export type Spoken =
  | { readonly kind: 'said'; readonly line: string }
  | { readonly kind: 'silent'; readonly reason: string }

export function speak(
  history: readonly Turn[],
  said: string,
  shapes: readonly Shape[],
  model: ModelHandle,
): Promise<Spoken>
```

`said` is the sentence you have just finished, and it is separate from `history` because it has no
turn yet — the child has not answered it. Handing only `history` would keep the model from seeing
the one sentence it is supposed to answer, which is the whole order this design turns on.

**Everything `speak` puts in the prompt goes through `say` first**, including `said` and the phrases
inside `shapes`. That is the mechanism of ruling 6: your stammer never reaches the model, so it
cannot come back out. Nothing cleans the child's own line, and nothing should — the model wrote it,
and it is not a rendering of your words.

**Audit.** No model. It is handed what Extract made of the child's line and the graph of your own
words, and it returns what the child introduced.

```ts
import type { ExtractResult } from './extract.js'
import type { Link, Relation } from './validate.js'

export type Introduced =
  /** A link the child asserted that your graph does not hold. Ruling 7. */
  | { readonly kind: 'link'; readonly cause: string; readonly effect: string; readonly relation: Relation }
  /** A content word in the child's line that your transcript does not contain. Ruling 8. */
  | { readonly kind: 'word'; readonly word: string }
  /** The model could not read the turn. Logged, so an unread turn never reads as a clean one. */
  | { readonly kind: 'unread'; readonly reason: string }

export function audit(
  line: string,
  said: ExtractResult,
  graph: readonly Link[],
): readonly Introduced[]

`line` is passed separately from `said` on purpose. The word check needs no model, so it still runs
when the model is unreachable and `said` carries no text at all. A dead auditor loses the link check
and keeps the cheap one.

/** One turn, and everything the session needs from it. */
export type Turn = {
  readonly you: string
  readonly child: string
  readonly introduced: readonly Introduced[]
}

/** The turn, assembled. Total: a silent child gives an empty `child` and no items. */
export function turn(said: string, spoken: Spoken, introduced: readonly Introduced[]): Turn
```

`turn` is what ruling 10 means by *this piece returns a typed per-turn value*. It is four lines of
total function, it is where the `silent` case is mapped onto a defined result, and Session records
what it returns without knowing how any of it was produced.

**And the phrase cleaner, which survives from the old design.**

```ts
/** Your words, cleaned for saying out loud. Filled pauses and stammers go. Ruling 6. */
export function say(phrase: string): string
```

It lives in `voice.ts` today and moves into `speak.ts` when `voice.ts` is deleted. The five comments
that cite ruling 6 move with it, or they point at nothing.

The comparison key is `conceptOf` from [`../../src/feynman/cohere.ts`](../../src/feynman/cohere.ts)
— `normalise` plus lowercase — **and inflection stripping, which does not exist yet.** Ruling 14
owns it. Two mentions match when their stripped text matches, so *lifts* and *lifting* are one
concept, while *the flapper lifting* and *lifting the flapper* are still two. Word order is not
normalised, and nobody is proposing that it should be.

**Watch which way the error runs.** Exact matching over-reports, and an extra item costs the review
phase one closure it did not need. Loose matching under-reports, and a missing item is a Law 1
failure. The two are not symmetrical, which is the whole argument in ruling 14.

## 3. What it must not do

- **End a session with an item open.** That is the failure this whole design exists to survive.
- **Show a count of introduced items beside a finding.** Invariant 7, quoted below.
- **Say your explanation was unclear.** It reports its own state, never a judgement of you.
- **Read the transcript for the audit.** The audit reads the child's line. Your graph is already
  extracted, and re-extracting your words to diff them is invariant 9.
- **Present the child's line as a quotation.** It is not one. Anything shown as a quote is literal
  or it is a bug — invariant 2.
- **Fall back to a deterministic child.** Ruling 11.
- **Check whether anything is true.** This piece cannot tell a true statement from a false one, and
  it never tries. It answers one question — *is this in what you said?* — and hands the answer on.
  Ruling 13.

## 4. Invariants that apply

Quoted in full, because a number tells you where a rule lives and not whether it is still in force.
**Cited by number and never by line.** The first draft of this section gave line numbers, and the
same commit that wrote it added four lines to `AGENTS.md`, so every one of them pointed at the wrong
rule within the hour. Numbers are permanent addresses; lines are not.

**Invariant 5** — *"Anything that asks the user a question supplies the answer. No feature ends on a
finding."* The child asks on every turn. The ledger and its closure are what make the asking legal,
so this is the whole design and not a constraint on it.

**Invariant 6** — *"Findings are phrased at the task, never the person: 'You said X but not how Y',
not 'your explanation was shallow.'"* It governs grammar, not where a sentence came from, so it
reaches the model's line as much as it reached the templates.

**Invariant 8** — *"Extraction is per-sentence, never one-shot over a whole explanation."* Marked
*unwarranted pending measurement* on 2026-08-07 and still in force. **It does not bind the audit,
and this section first claimed it did.** `AGENTS.md` re-checked its scope against the pivot and
fixed it on the user's explanation, which is Extract's other input. The audit reads the child's
line. It runs one line at a time anyway, by choice and not by rule, and the reason is the ordinary
one: a model asked to read two things at once reads neither carefully.

**Invariant 7** — *"No grade, score, or rung is displayed beside a diagnosis, unless the score has
ground truth the diagnosis does not."* Amended 2026-08-10, and the exception admits the catch rate
alone. A count of introduced items is not it.

**Invariant 4** — *"`confidence` means 'how strong is my reason to stay quiet.'"* Marked for review
2026-08-07, in force until reviewed. Any number the audit ever attaches to an item inherits this
reading.

**Invariant 2** — *"Quotes are validated as literal substrings of the source before display; a
non-matching quote is a rejected extraction, not a warning."* Scope narrowed 2026-08-07, not
repealed. It binds any span of your transcript the review phase shows back.

**Invariant 9 does not reach this piece**, and a reader will think it does. It forbids diffing two
extractions of *your own words*. The audit diffs an extraction of the child's line against an
extraction of yours, and the child's line is not your words.

**Invariant 1 is repealed** (2026-08-07) — *"No user-facing text originates from the model."* Its
repeal is what permits section 1 at all. **Invariant 3 is repealed** as stated (2026-08-07), and
`AGENTS.md` names the hole it left under that entry: it was the only mechanically checkable one, and its
replacement is open and *"deliberately not designed here."* The audit looks like that replacement
and **is not being proposed as one**. It is a piece of this spec, it installs no rule, and the hole
stays open until `decisions.md` closes it.

## 5. Rulings and open questions

1. ~~**May the child say "I don't get it"?**~~ **SUPERSEDED 2026-08-12.** It asked which move object
   carried confusion. There are no move objects now.
2. ~~**May Clarity route `confused`?**~~ **SUPERSEDED 2026-08-12**, with ruling 1.
3. ~~**Is `conflict` Notice's or Contradict's?**~~ **RULED 2026-08-10: Notice's**, and the ruling
   survives the rewrite in substance. Two of your own links disagreeing is set arithmetic with no
   model, so it stays in Cohere and reaches the child as one of the shapes in `speak`. Putting set
   arithmetic inside a model piece is the `Analyse` mistake [`../workflow.md`](../workflow.md)
   records this repo paying for once.
4. **Does one closure retire an item?** Proposed: **no**, and this now covers every introduced item
   rather than only a planted guess. Rejected: yes, which the evolution transcript refutes — the
   adult corrected the error and the child reproduced it six turns later. Changes no signature.
5. ~~**Do the two pieces keep the names Notice and Voice?**~~ **RULED 2026-08-12: no.** They are
   `speak` and `audit`, which are verbs on what each is handed, the same test the old names passed.
6. ~~**Does the child speak your filled pauses and stammers back?**~~ **RULED 2026-08-10: no**, and
   the ruling is re-sited rather than retired. `say` now cleans the phrases handed to the model as
   context, so the stammer never reaches the model and cannot come back out. The anchor stays exact,
   because the anchor is what the machine resolves. The transcript behind this holds 260 filled
   pauses and 119 repeats in 13,000 words. Rejected: keeping the raw form, which honours a rule the
   child was never inside and makes the product sound broken; and normalising the anchor, which
   would put a non-literal span where `resolveAnchor` expects a real one.
7. **How deep does the audit read the child's line?** **RULED 2026-08-12: Extract runs over the
   turn.** Every `cause→effect` key or relation not already in your graph becomes an item. Rejected:
   a content-word check with no model call, which is cheaper and cannot see a reversed chain or a
   negation built from your own words. **Conceded, and it is the reason ruling 8 is open:** Extract's
   prompt is written for a declarative spoken sentence, the child speaks in elided questions, and
   Extract's measured weakness is under-counting inside a sentence. It may return nothing on exactly
   the reversed question this ruling was chosen to catch.

   **Probed 2026-08-12, and the concession held.** Extract was run over the three child lines
   recorded in the handoff's transcript, against the graph as it stood at each turn. **It returned
   no links on all three**, including *"So the toilet fills up after it empties?"* — the reversed
   line this ruling exists for. On that turn the word check was the only thing that caught anything,
   flagging *toilet*, *fills* and *empties*. One reading is that Extract is right: that line asserts
   a temporal order, not a causal one, and Extract is built for causal links in declarative speech.
   If that reading holds, the reversed chain is not reliably a causal assertion at all, and the link
   check is a weaker instrument than this ruling assumed. **n=3, one model, one explanation, and the
   stop-word list was written for the probe rather than by anyone's decision.** It settles nothing.
   It is recorded because the ruling was taken on the opposite expectation.
8. **The two checks catch different failures, not the same failure at two depths.**
   **RULED 2026-08-12: both run.** The framing when ruling 7 was taken was wrong. A word check
   catches a new *word* in a line that asserts no link — *"is that like a pump?"* introduces *pump*
   and no link at all — and a link check catches a new *link* built from words you already said.
   Neither contains the other, so `Introduced` carries a variant for each. Rejected: links only,
   which ships a ledger that is silent on the commonest way a child introduces something.
9. **Is an empty extraction an item, or only an unreachable model?** **RULED 2026-08-12: only an
   unreachable model.** An `unavailable` result becomes an `unread` item. An empty link list is
   counted and not logged, because an empty list is the correct reading of a question and the child
   asks one nearly every turn. Rejected: logging both, which was the first ruling and which makes
   closure a formality — Law 1 gets its force from every open item mattering. **The cost, recorded:**
   a turn where Extract silently under-reads the child's line now looks exactly like a turn where
   the child asserted nothing. The count is the only trace, and nothing yet reads it.
10. **Who owns the ledger row?** **RULED 2026-08-12: Session.** This piece returns `Turn`, which
    carries the items as discrete values, never a count and never a boolean. The obligation is stated
    here in prose — a session that ends with an item open is a Law 1 failure — and the row, its
    persistence and its `closed` predicate belong to Session. Rejected: minting the row here, which
    is the stronger forcing function and gives this spec a format it cannot test alone. Conceded:
    [`supply.md:347`](supply.md) ruled the mirror case the other way.
11. **What happens when there is no model?** **RULED 2026-08-12: nothing is said.** The deterministic
    child is retired — `notice.ts`, the `Move` type, the templates and `words.ts` go — and no offline
    fallback replaces it. `speak` returns `silent` and the configuration is named unsupported.
    Rejected: keeping the old child behind the model, which means two children, two specs and a
    nine-move table nobody tests. **Recorded because it is thin:** the evidence for retiring it is
    *"a non-sequitur every fifth turn"*, and that comparison has no protocol and no artifact in the
    repo. It is not falsifiable as recorded.
12. **Does the nudge stay?** The shapes go to the model as context, not as an instruction. Proposed:
    keep it, and drop it if the child reads stiff, because fluency is the thing being bought.
    Rejected: no context at all, which gives the model nothing to reach for when your chain does not
    close. Changes no signature, so it does not block.
13. **What the audit is not, and whether it keeps that name.** It misled its own owner on the day it
    was written, which is the strongest evidence a name can give. **The boundary, and it is not
    open:** this piece runs live, once per turn, and answers one question — *is this in what you
    said?* It cannot tell a true statement from a false one. It consults nothing and it is not the
    end-of-session pass. **Checking an introduced item against knowledge is the review phase**, and
    that work is [`supply.md`](supply.md)'s. This design is what makes Supply small: instead of
    hunting for gaps with no ground truth, Supply is handed specific propositions and checks each
    one. The optional sources — a configured knowledge base, and the internet — belong to that phase.
    Neither is decided, and **the internet is named in no document in this repo**; it also touches
    *local-first: nothing leaves the device unless you turn something on*, so it needs a row in
    [`../decisions.md`](../decisions.md) before anyone builds it. Proposed for the name: **`tally`**,
    which cannot be read as fact-checking. Rejected: keeping `audit`. **Answer this before the oracle
    is written**, because the oracle file is named after the piece.
14. **How close must two mentions be to count as the same concept?** Forced by oracle example 1,
    which the owner answered on 2026-08-12: *lifts* and *lifting* are one concept. Exact text
    matching is therefore out. Proposed: **strip inflection, and stop there.** A deterministic
    suffix stripper — plural *-s*, *-es*, and verb *-ing*, *-ed* — living beside `normalise.ts`,
    owned by neither piece and tested on its own, the same arrangement `normalise` already has for
    the same reason. Two mentions match when their stripped text matches. Nothing else is matched:
    no synonyms, no embeddings, no *close enough*.

    **Why the line is drawn there and not further out.** Loosening the match is not free in both
    directions. An over-report costs the review phase a closure it did not need. An under-report is
    a link the child introduced and nobody wrote down, which is the failure Law 1 names. Inflection
    is the one loosening that carries no judgement — *lifts* and *lifting* are the same word, and
    calling them different concepts is a defect in the string comparison, not a finding. Every step
    past that is a judgement about meaning, and a judgement about meaning is the thing this piece is
    forbidden to make.

    Rejected: **a lemmatiser as a dependency**, which is heavier than the problem and puts a table of
    English morphology under a rule this small. **And leaving it exact**, which the owner's answer
    rules out.
15. **Is every introduced item a debt?** Raised by the owner on 2026-08-12: a real child draws on
    some outside knowledge, that is normal, and the danger is bounded because a child persona does
    not reach far. Proposed: **a link item is a debt, a word item is a note.**

    The split is not a compromise, it is what the two things are. A link is a proposition — it can
    be checked, and Law 1 says something must close it. **A word is not a proposition and has no
    truth value.** Handing Supply *"the child said pump"* gives it nothing to check. What a word
    item actually records is that the child reached outside your transcript, which is a reason to
    look, not a claim to answer. So it is kept, shown, and owed nothing. The probe under ruling 7 is
    what this is drawn from: on the one recorded transcript the words introduced were *toilet*,
    *fills* and *empties*, and not one of them is something anybody could close.

    **This does not touch the plant.** [`../decisions.md`](../decisions.md)'s guess row of 2026-08-10
    requires every plant to be disclosed and closed, on Butler & Roediger 2008. A plant connects two
    of your concepts, so a plant is a link, so a plant is a debt. That row is untouched.

    **On the bound the roleplay gives, which is the part I do not accept.** The persona constrains
    register, not accuracy. A model playing a child says childlike things, and a childlike thing can
    be wrong — a plausible, everyday, wrong sentence in the voice of the character the product is
    built around is the dangerous case, not an expert-sounding one. This file is not the place to
    settle it, because `decisions.md` already did: *"the model is not naive, and pretending it is
    does not make it so."* **The prediction is testable and nothing tests it yet.** If the child
    stays modest the ledger is short, and a short ledger is cheap. The ledger is also the only
    instrument that would show it, so it cannot be skipped on the strength of the prediction it
    would check.

    Rejected: **every item is a debt**, which is the current text and which owes a closure on a word
    nobody can check. **And logging no words at all**, which ruling 8 already refused.
    Changes no signature, so it does not block.
16. **The ledger is also an instrument, and it measures the fiction.** Raised by the owner on
    2026-08-12. A child who introduces nothing is not listening to itself, it is reciting you, and
    it reads robotic. A child who introduces on every turn is not drawing on what you said. The
    count per turn is a cheap, deterministic signal sitting between those, and it needs no labels.

    Proposed: **it reports counts, never verdicts.** That is the rule
    [`../decisions.md`](../decisions.md) already gives Clarity, taken here for the same reason —
    *"Your sentences averaged 34 words"* is a fact, and *"the child was unconvincing"* is an
    inference nobody has evidence for. Nobody knows the right number and no gold set exists, so a
    band drawn today would be a threshold invented to look measured. **Never beside a finding**,
    which is invariant 7; the same file records why Clarity's number is legal — it is not beside
    anything.

    **What it is good for, concretely.** Three Extract prompt variants were compared on 2026-08-12
    and the comparison was worthless because each agent built its own test set. A per-turn count over
    one fixed explanation is stable, so it compares a prompt against a prompt and a model against a
    model. The falsification week's explanations make that nearly free once the loop runs.

    **The confound, recorded now so nobody reads past it.** The count moves when the child changes
    *and* when Extract changes, because an introduced link is only seen if Extract reads the child's
    line — and the probe under ruling 7 found it read none of three. A prompt change that improves
    the auditor looks exactly like a persona that got bolder. Report the two counts separately, and
    never compare a number across a change to either side.

    Rejected: **a believability score**, which has no ground truth and which a model would have to
    judge, and `AGENTS.md` bans an LLM judge. Changes no signature, so it does not block.

## 6. The oracle for `audit`

**UNFILLED. The blanks below belong to the owner, and no agent may fill one.** The inputs are drawn
from the toilet explanation in `demo.ts`, so they are real. The shape follows
[`extract.md`](extract.md) section 6, which is the oracle for `validate`.

Three things are needed, and the examples are the hard part only because they look harder than they
are. For each one, read the child's line, look at what your graph holds, and write what should come
back. There is no right answer waiting to be guessed — **what you write is what correct means**.

**What correct means.** One sentence. A starting shape, to accept or replace:

> _Every link in the child's line that my graph does not already hold comes back as an item, every
> content word in that line that I never said comes back as an item, and nothing else does._

**The invariant, in plain words.** One sentence, no code:

> **_(yours)_**

---

**Example 1 — the child says back something you did say, in its own words.**

Your graph holds one link: cause *"when you push the handle down"*, effect *"pulls the chain"*,
relation `causes`.
The child says: *"so pushing the handle pulls the chain?"*
Extract reads the child's line and returns: cause *"pushing the handle"*, effect *"pulls the chain"*,
relation `causes`.

The comparison key is exact text after normalising, so *"pushing the handle"* and *"when you push
the handle down"* are two different concepts and this counts as a new link.

**Expected items: none.** *Answered by the owner on 2026-08-12, transcribed here.* His reasoning:
*lifting* and *lifts* are the same word in two forms, and a child who connects something to their
own experience before you say it is behaving normally.

**What it settles, and what it opens.** Concepts no longer match on exact text. They match after
inflection is stripped, which is work that does not exist yet — ruling 14 owns it.

**And the direction of the error flips with it.** Exact matching over-reports, and an extra item
costs the review phase one closure it did not need. Every step looser under-reports, and a missing
item is a Law 1 failure. Ruling 14 stops at inflection for exactly that reason.

---

**Example 2 — the reversed chain. This is the case ruling 7 exists for.**

Your graph holds: *"the flapper lifting"* enables *"the tank water rush into the bowl"*.
The child says: *"so the toilet fills up after it empties?"*
Extract returns: cause *"it empties"*, effect *"the toilet fills up"*, relation `causes`.

It asks three things, and the third is the one nothing has ruled on.

**(a) Does being right make a difference?** The child may well be correct — your fifth sentence,
which you have not said yet, is *"then the fill valve refills the tank."* Ruling 13 says the audit
cannot tell true from false and never tries, so the test is *unsaid*, not *wrong*.

**(b) Does the relation count on its own?** Your link is `enables` and the child's is `causes`.
Ruling 7 says a relation not already in your graph is an item, so a link with your two concepts and
a different relation between them is an introduction.

**(c) Does the link item swallow the words inside it?** *toilet*, *fills* and *empties* are all
words you never said, so the word check flags three. The link check flags one. **Is that four items
for one introduction, or one?** Nothing has ruled on this, and it decides whether the ledger reads
as a list of things the child did or as a pile of the same thing counted twice.

Expected items: **_(yours)_**

---

**Example 3 — a new word, and no link at all.**

Your graph holds the toilet links. You never said the word *pump*.
The child says: *"wait, is that like a pump?"*
Extract returns no links, because the line asserts none.

Expected items: **_(yours)_**

> Ruling 9 says an empty link list is not an `unread` item. Ruling 8 says the word check still runs.

---

**Example 4 — the model is unreachable.**

**4a. The child spoke, and the auditor could not read it.** Extract returns `unavailable`. Ruling 9
makes that one `unread` item, and the word check needs no model, so any new words still come back.

Expected items: **_(yours)_**

**4b. The same failure one step earlier.** One model serves both calls, so in practice the child
does not speak either: `speak` returns `silent` and there is no line to audit. `turn` gives an empty
`child` and no items.

Expected items: **_(yours)_**

> **What `unread` is, which ruling 15 did not settle.** That ruling split a link, which is a
> proposition Supply can close, from a word, which is not. `unread` is neither. It says *we do not
> know whether the child introduced anything on this turn*, which is an admission rather than a
> claim, and no amount of checking closes it — only re-running the audit does, or you reading the
> turn yourself. So: is it a debt under Law 1, is it a note like a word, or is it a third thing?
> Your answer to 4a is what decides it.

---

**Hard cases from the red team.** Written at step 6, after this oracle is filled and attacked.

## 7. What is not closed

Written when the piece ships.
