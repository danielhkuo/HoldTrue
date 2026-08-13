# Spec: the child's speech

> **Status: half built, 2026-08-12.** `tallyIntroduced` and `turn` ship — 41 tests, mutation 96.67%,
> five survivors dismissed with reasons in section 6. **`speak` is not built**: no code, no prompt,
> no eval. Every ruling in section 5 is settled. Section 7 says what the piece hands on.
>
> **What the loop cost, recorded because it is the argument for running it.** The red team wrote four
> implementations that passed all fourteen tests and broke the piece; ten holes, none dismissed, two
> of them defects in the oracle rather than gaps in it. Mutation found that nothing tested the
> stemmer, which is ruling 14's whole mechanism. The review found the tally comparing against the
> graph where this spec says transcript, so a sentence Extract found no link in charged you for your
> own words. **None of those was visible from a green suite.**
>
> **Who ruled what.** Rulings 7 to 11, 13 and oracle example 1 are the owner's. Rulings 4, 12
> and 14 to 17, and the rest of section 6, were ruled by an agent on 2026-08-12 after he
> delegated them in as many words. Each carries its reasoning and its rejected alternative, so any
> one of them costs a single line to reverse. The red team at step 6 and mutation at step 9 both
> attack the agent-written oracle, which is the check that this arrangement needs.
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

**Tally.** No model. It is handed what Extract made of the child's line and the graph of your own
words, and it counts up what the child introduced. Ruling 13 names it.

```ts
import type { ExtractResult } from './extract.js'
import type { Link, Relation } from './validate.js'

export type Introduced =
  /** A link the child asserted that your graph does not hold. Ruling 7. */
  | { readonly kind: 'link'; readonly cause: string; readonly effect: string; readonly relation: Relation }
  /**
   * A content word in the child's line that your transcript does not contain. Ruling 8.
   * `within` names the link this word sits inside, when one was also flagged, so anything
   * counting introductions counts the link and not its parts. Oracle example 2.
   */
  | { readonly kind: 'word'; readonly word: string; readonly within?: string }
  /** The model could not read the turn. Logged, so an unread turn never reads as a clean one. */
  | { readonly kind: 'unread'; readonly reason: string }

export function tallyIntroduced(
  line: string,
  said: ExtractResult,
  graph: readonly Link[],
  transcript: string,
): readonly Introduced[]

/** One turn, and everything the session needs from it. */
export type Turn = {
  readonly you: string
  readonly child: string
  readonly introduced: readonly Introduced[]
}

/** The turn, assembled. Total: a silent child gives an empty `child` and no items. */
export function turn(said: string, spoken: Spoken, introduced: readonly Introduced[]): Turn
```

`transcript` is everything you have said, and it is **not** the same thing as `graph`. A sentence you
spoke that Extract found no link in contributes no anchors at all, so a graph-only word check charges
you for your own words — found by review on 2026-08-12, after the first implementation did exactly
that.

`line` is passed separately from `said` on purpose. The word check needs no model, so it still runs
when the model is unreachable and `said` carries no text at all. A dead model loses the link check
and keeps the cheap one.

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
owns it. Two mentions match when one's stemmed words are a subset of the other's, so *lifts* and
*lifting* are one concept, *pushing the handle* sits inside *when you push the handle down*, and
*the flapper lifting* and *lifting the flapper* are also one, because word order is not read.

**Watch which way the error runs.** Exact matching over-reports, and an extra item costs the review
phase one closure it did not need. Loose matching under-reports, and a missing item is a Law 1
failure. The two are not symmetrical, which is the whole argument in ruling 14.

## 3. What it must not do

- **End a session with an item open.** That is the failure this whole design exists to survive.
- **Show a count of introduced items beside a finding.** Invariant 7, quoted below.
- **Say your explanation was unclear.** It reports its own state, never a judgement of you.
- **Re-extract your words.** The tally reads the child's line, and your side is already extracted —
  running Extract over your transcript a second time to diff it is invariant 9. **Clarified
  2026-08-12** after the red team read the old wording as a ban on touching `link.sentence.quote`:
  every anchor in the graph is fair game, including the sentence anchor, because it is part of the
  `Link` the tally was handed. It has to be — the word check asks whether you ever said a word, and
  a word can sit in your sentence without sitting in a cause or an effect. *lets*, in *"the flapper
  lifting lets the tank water rush into the bowl"*, is exactly that word.
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
*unwarranted pending measurement* on 2026-08-07 and still in force. **It does not bind the tally,
and this section first claimed it did.** `AGENTS.md` re-checked its scope against the pivot and
fixed it on the user's explanation, which is Extract's other input. The tally reads the child's
line. It runs one line at a time anyway, by choice and not by rule, and the reason is the ordinary
one: a model asked to read two things at once reads neither carefully.

**Invariant 7** — *"No grade, score, or rung is displayed beside a diagnosis, unless the score has
ground truth the diagnosis does not."* Amended 2026-08-10, and the exception admits the catch rate
alone. A count of introduced items is not it.

**Invariant 4** — *"`confidence` means 'how strong is my reason to stay quiet.'"* Marked for review
2026-08-07, in force until reviewed. Any number the tally ever attaches to an item inherits this
reading.

**Invariant 2** — *"Quotes are validated as literal substrings of the source before display; a
non-matching quote is a rejected extraction, not a warning."* Scope narrowed 2026-08-07, not
repealed. It binds any span of your transcript the review phase shows back.

**Invariant 9 does not reach this piece**, and a reader will think it does. It forbids diffing two
extractions of *your own words*. The tally diffs an extraction of the child's line against an
extraction of yours, and the child's line is not your words.

**Invariant 1 is repealed** (2026-08-07) — *"No user-facing text originates from the model."* Its
repeal is what permits section 1 at all. **Invariant 3 is repealed** as stated (2026-08-07), and
`AGENTS.md` names the hole it left under that entry: it was the only mechanically checkable one, and its
replacement is open and *"deliberately not designed here."* The tally looks like that replacement
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
4. **Does one closure retire an item?** **RULED 2026-08-12: no**, and this now covers every introduced item
   rather than only a planted guess. Rejected: yes, which the evolution transcript refutes — the
   adult corrected the error and the child reproduced it **ten child turns later — recounted
   2026-08-12, this ruling said six**, and `../decisions.md` carries the same correction. Changes no
   signature.
5. ~~**Do the two pieces keep the names Notice and Voice?**~~ **RULED 2026-08-12: no.** They are
   `speak` and `tallyIntroduced`, which are verbs on what each is handed, the same test the old names passed.
6. ~~**Does the child speak your filled pauses and stammers back?**~~ **RULED 2026-08-10: no**, and
   the ruling is re-sited rather than retired. `say` now cleans the phrases handed to the model as
   context, so the stammer never reaches the model and cannot come back out. The anchor stays exact,
   because the anchor is what the machine resolves. The transcript behind this holds 260 filled
   pauses and 119 repeats in 13,000 words. Rejected: keeping the raw form, which honours a rule the
   child was never inside and makes the product sound broken; and normalising the anchor, which
   would put a non-literal span where `resolveAnchor` expects a real one.
7. **How deep does the tally read the child's line?** **RULED 2026-08-12: Extract runs over the
   turn.** A link is an item when your graph holds no link joining those two concepts **with that
   relation**. **Wording tightened 2026-08-12** after the red team read the original — *"every
   `cause→effect` key or relation not already in your graph"* — as graph-wide rather than per pair.
   Under the loose reading, once you have used `prevents` anywhere, a child that reverses your chain
   with `prevents` introduces nothing. The test set could not tell the two readings apart, because
   its graph held no `prevents` at all. Rejected:
   a content-word check with no model call, which is cheaper and cannot see a reversed chain or a
   negation built from your own words. **Conceded, and it is what ruling 8 was taken on:** Extract's
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
12. **Does the nudge stay?** **RULED 2026-08-12: it stays.** The shapes go to the model as context,
    not as an instruction. Keep it, and drop it if the child reads stiff, because fluency is the thing being bought.
    Rejected: no context at all, which gives the model nothing to reach for when your chain does not
    close. Changes no signature, so it does not block.
13. **What the tally is not, and what it is called.** **RULED 2026-08-12: `tallyIntroduced`**, in
    `tally.ts`. The old name was `audit`, and it misled its own owner on the day it was written,
    which is the strongest evidence a name can give. *Audit* says the piece checks whether something
    is correct. It does not. It counts up what the child brought in that you never said, which is
    what the new name says and what the `Introduced` type it returns is already called. **The
    boundary, and it is not
    open:** this piece runs live, once per turn, and answers one question — *is this in what you
    said?* It cannot tell a true statement from a false one. It consults nothing and it is not the
    end-of-session pass. **Checking an introduced item against knowledge is the review phase**, and
    that work is [`supply.md`](supply.md)'s. This design is what makes Supply small: instead of
    hunting for gaps with no ground truth, Supply is handed specific propositions and checks each
    one. The optional sources — a configured knowledge base, and the internet — belong to that phase.
    Neither is decided, and **the internet is named in no document in this repo**; it also touches
    *local-first: nothing leaves the device unless you turn something on*, so it needs a row in
    [`../decisions.md`](../decisions.md) before anyone builds it. Rejected for the name: **`audit`**,
    which reads as fact-checking and did; and bare **`tally`**, which is the repo's one-word house
    style but does not say a tally of what.
14. **How close must two mentions be to count as the same concept?** Forced by oracle example 1,
    which the owner answered on 2026-08-12: *lifts* and *lifting* are one concept. Exact text
    matching is therefore out. **AMENDED the same day, while writing the test that would have failed
    on it.** *Stop there* does not reach the owner's own answer. Example 1's phrases are *"pushing
    the handle"* against *"when you push the handle down"*: they differ by **extent**, not by
    inflection, and no suffix rule makes them equal. So the rule is **stem every word, then match
    when one phrase's words are a subset of the other's.** Inflection alone is kept below as the
    reasoning that was right about direction and wrong about reach.

    **This is the loosest thing in the spec and the first place to look when the ledger is wrong.**
    Subset matching over-matches by construction, and [`extract.md`](extract.md) already records a
    defect of exactly this shape — *"the water"* inside *"the water flowing downstream"*, two
    different things in one sentence. Over-matching under-reports, which is the Law 1 direction, so
    this trades against the argument in the paragraph below rather than extending it. It is here
    because the owner's answer requires it, and it is flagged because he answered a morphology
    question and got a containment rule.

    **Where the stemmer lives, decided 2026-08-12 while building.** Private to `tally.ts` for now,
    not a shared module. A shared module owned by neither piece needs its own oracle and its own
    tests, and nobody has written them; shipping an untested shared module is worse than shipping a
    private helper. It moves out the day Cohere adopts it — `conceptOf` has the same *lifts* against
    *lifting* bug in your own graph — and that hand-off is in section 7.

    The original reasoning, still correct as far as it goes: a deterministic
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
    not reach far. **RULED 2026-08-12: a link item is a debt, a word item is a note.**

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

    **RULED 2026-08-12: it reports counts, never verdicts.** That is the rule
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
    the tally looks exactly like a persona that got bolder. Report the two counts separately, and
    never compare a number across a change to either side.

    Rejected: **a believability score**, which has no ground truth and which a model would have to
    judge, and `AGENTS.md` bans an LLM judge. Changes no signature, so it does not block.
17. **Your response to the child is the signal, and nothing was reading it.** Raised by the owner on
    2026-08-12: *"do I correct it? Answer their question? How do I respond? That's what really
    matters."* A row is opened by what the child said at turn N. What you did about it is the `you`
    of turn N+1, and nothing joined the two.

    **RULED 2026-08-12, in three parts.**

    **(a) Your response does not close the row.** Supply closes it, by checking the proposition.
    Closing on engagement would discharge *"so the toilet fills up after it empties?"* on a confident
    *yes, exactly* — which is the one case the ledger exists for, and it would void
    [`../decisions.md`](../decisions.md)'s disclose-and-close condition on Butler & Roediger.

    **(b) The response is recorded on the row, as a separate fact.** Engaged or not: did the concept
    the row waits on appear in the links of the sentence you said next? That is set membership over
    `conceptOf` with ruling 14's stripping. No model, no fact about the world. It orders Supply's
    queue; it discharges nothing.

    **(c) It lives in Session, not here.** Ruling 10 already gave Session the row, and Session
    already holds Extract's links for every one of your sentences from the same loop. So
    `tallyIntroduced` needs nothing from this ruling and **nothing here blocks the oracle.** (It took
    three parameters when this was written and takes four now — `transcript` was added by the review
    later the same day, for an unrelated reason. Section 2 has the signature.) This becomes a
    ticket on the feature's map for whoever builds Session.

    **What *engaged* can and cannot mean.** The retired `notice.ts` had this mechanism and its test
    was `conceptOf(effect) === waitingOn` — topical overlap, nothing more. A wrong answer about the
    right concept passed it. So engaged means *you took it up*, never *you got it right*. What
    ruling 11 threw away was the wiring, not a signal: `notice.ts` and `voice.ts` both labelled
    `gotIt` *"No diagnostic content"* and spent it on the words *"ohhh okay. i get it now."*

    **The four cells belong to the review phase.** Cross Supply's verdict with the recorded response
    and you get: accepted a false line, corrected a false one, accepted a true one, **corrected a
    true one** — the last being a misconception of yours, surfaced by your own teaching. That cross
    is Supply's output and is not this piece's to license. Note where it lands:
    [`../features/feynman.md`](../features/feynman.md)'s step 7 *"kept its shape and lost its
    speaker"*, and `decisions.md` says relaxing *the child asks, never tells* is a constitutional
    change rather than a tuning decision.

    **The evidence gate, and this is the part to read twice.** `AGENTS.md` requires a claim about how
    people learn to already be in [`../research/evidence-base.md`](../research/evidence-base.md).
    **The premise under this ruling has no row there.** Every row in its correction section grades
    feedback flowing *to* a learner; not one reads the explainer's reply as a diagnostic. Two nearby
    rows point away from it — Roscoe & Chi, where audience-directed explanation produced 87%
    knowledge-telling against 60%, and the row saying explaining is not privileged over practice
    testing. So (a) to (c) stand as **bookkeeping the catch rate needs**, and no displayed number and
    no claim about understanding may rest on them until somebody files the row.

    **The case is already in the repo.** In the Seasons transcript the adult states the
    distance-to-the-sun misconception, the child answers *"the sun's like a heater and if you're
    closer to a heater you're hotter"*, and the adult replies *"Exactly, yeah! It's just like that."*
    The teacher ratifies a false belief the child introduced. Two turns later the child's Grandma
    in Australia counterexample forces *"hold on, let me think about that for a second."* The
    failure and the recovery both sit in the adult's reply, and nothing in this design reads it.

    Rejected: **your answer closes the row**, which makes Supply genuinely smaller and lets a
    confident *yes* discharge a falsehood. **And computing the four cells live**, which needs the
    truth of the claim and a model to judge it, at the moment there is a latency budget.
    Changes no signature, so it does not block.
18. **`resay`: the child asks you to say it again.** **RULED 2026-08-12**, on the owner's
    instruction — the voice session stays, a typed fallback is not an option, and what is needed is
    a gate that catches a turn nobody could understand and forces a repeat. The move existed and was
    cut; it comes back with a different trigger.

    **It is legal because it claims nothing.** Asking someone to repeat asserts no correction and
    makes no claim about their words, so it does not touch [`../decisions.md`](../decisions.md)'s
    *the child asks, never tells*. A misfire costs one round trip, which is the asymmetry that row
    turns on. And it is the most natural thing a child says.

    **The gate is arithmetic and runs before `speak`.** `Spoken` gains a third kind,
    `{ kind: 'resay' }`, so the refusal is a defined result rather than an exception and `turn`
    stays total. **The speaking model must not own this decision**: handed a garbled line a model
    reconciles it into sense rather than asking, which fails in exactly the direction the gate
    exists for.

    **What it must not use, and this one is counter-intuitive.** Not an out-of-vocabulary test.
    `words.ts` holds 848 hand-written tokens and skips every word under five characters, so *"the
    sto wa hot"* scores as fully known while *condenser*, *evaporator* and *gradient* score as
    mostly unknown. **The complement of that list is the subject matter of the session.** It
    measures what you are explaining, not whether we heard it.

    **What it uses instead** is the transcriber's own numbers, catalogued with their sources in
    [`../research/stt-signals.md`](../research/stt-signals.md), plus a repetition check — because a
    repeat loop keeps *high* token probability and the probability signal cannot see it.

    **The limit, stated first rather than discovered later.** Whisper's characteristic failure is
    **fluent, confident, wrong** text. *flapper* heard as *flopper* carries high token probability,
    normal entropy and clean grammar, so every signal reads healthy. **This gate catches
    unintelligible turns and cannot catch misheard ones.** They are different failures, the owner
    asked for the first, and the second remains where `decisions.md`'s *No upfront transcript
    correction* row left it.

    **No invented threshold.** The published constants — −1.0, 2.4, 0.6 — are decoder-fallback
    triggers and no source calibrates them to word error rate, so citing one as an intelligibility
    bar would repeat the 97/5 mistake exactly. Until something measures it the gate fires only where
    no parameter is needed, and **logs its counts on every turn** so the falsification week can set
    a bar from real material.

    **The turn semantics were blocked and are not any more.**
    [`../decisions.md`](../decisions.md)'s *The `Doc` is the turn*, decided 2026-08-12, makes each
    turn its own immutable document, so an append costs nothing and superseding is a mark rather
    than a rewrite. The tally's transcript and Cohere's link set read unsuperseded turns only;
    `speak` and the review phase see both hearings. That row carries the edge cases, and three of
    them bear on this ruling directly.

    **A superseded turn keeps resolving**, because its document is immutable. Nothing filters by
    supersession yet, so the withdrawn claim stays in your graph and the child re-introducing it
    goes unrecorded — silent, and the Law 1 direction.

    **Nobody has decided whether the child's line is a document in the same namespace.** Extract runs
    over it, so with a turn-ordinal `unit_id` your *"okay"* and the child's *"okay"* collide.

    **And the deepest one, which is this ruling's own limit restated as a cost.** A misheard turn is
    never superseded, because the gate cannot see it. So every supersede filter runs past *flopper*,
    and an immutable turn cannot be repaired in place — the only route back is a repeat you have to
    notice first.

    Rejected: **letting the speaking model decide**, which reads meaning where the gate reads only
    noise and papers over garbage. **An out-of-vocabulary trigger**, above. **And discarding the
    bad turn**, which asserts that one utterance yields one transcript and pays for it with
    permanent loss whenever the gate misfires.

## 6. The oracle for `tallyIntroduced`

**Example 1 is the owner's. Everything else here is agent-written, on 2026-08-12, after he delegated
it in as many words.** `extract.md` section 6 already carries the same split and the same marking on
its own example 4, so the convention exists. What it costs is recorded rather than waved past: the
workflow puts the oracle on the human because an agent that writes both the standard and the code
produces code that passes by construction, and Anchor is what happens when that goes unnoticed — 23
green tests around a real defect. **Two instruments cover it.** The red team at step 6 attacks this
oracle before any implementation exists, and mutation at step 9 attacks it again afterwards. Every
judgement below is flagged, so any one of them can be reversed for the price of one line.

The inputs are drawn from the toilet explanation in `demo.ts`, so they are real.

**What correct means.** *Agent-written. Assembled from rulings 7, 8, 9 and 14 rather than invented.*

> An item comes back for every link in the child's line that my graph does not already hold, for
> every content word in that line that I never said, and for a turn the model could not read at all
> — comparing two mentions after inflection is stripped — **and for nothing else.**

**The invariant, in plain words.** *Agent-written.*

> The tally never returns an item for something I said, and never stays silent about something I did
> not.

Both halves are generatable with no labels. Build a child line entirely out of the graph and the
tally must return nothing. Put one link or one word into the line that the graph does not hold and
the tally must name it. The input is the ground truth, which is the same reason the retired
containment property needed no gold set.

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
which you have not said yet, is *"then the fill valve refills the tank."* Ruling 13 says the tally
cannot tell true from false and never tries, so the test is *unsaid*, not *wrong*.

**(b) Does the relation count on its own?** Your link is `enables` and the child's is `causes`.
Ruling 7 says a relation not already in your graph is an item, so a link with your two concepts and
a different relation between them is an introduction.

**(c) Does the link item swallow the words inside it?** *toilet*, *fills* and *empties* are all
words you never said, so the word check flags three. The link check flags one.

**Expected items: four — one link, and three words each marked as contained in that link.**
*Agent-written.* The word variant gains a field naming the link it sits inside, and a contained word
is never counted by ruling 16's instrument.

**Why not suppress the three.** Suppressing them would make the word check's behaviour depend on
whether Extract succeeded, and Extract is the unreliable half — the probe under ruling 7 found it
returned no links on three lines of three. Under suppression you keep the words exactly when the
link check fails and lose them exactly when it works, so the ledger's shape would be reporting the
extractor's mood rather than the child's. Containment keeps both instruments honest and still lets
anything counting introductions count one.

---

**Example 3 — a new word, and no link at all.**

Your graph holds the toilet links. You never said the word *pump*.
The child says: *"wait, is that like a pump?"*
Extract returns no links, because the line asserts none.

**Expected items: one — a word note for *pump*, contained in nothing.** *Agent-written, and forced
by rulings the owner already took:* ruling 9 says an empty link list is not an `unread` item, and
ruling 8 says the word check still runs.

**What it costs, recorded.** The child is proposing an analogy, and an analogy is a claim. Extract
found no link, so the system cannot see the claim, and the note is a weak trace of it. That is the
strongest argument the word check has for existing, and it is also the clearest case where the
ledger holds less than the conversation did.

---

**Example 4 — the model is unreachable.**

**4a. The child spoke, and the tally could not read it.** Extract returns `unavailable`.

**Expected items: one `unread`, plus one word note for every content word in the line the graph does
not hold.** *Agent-written.* The line is still there, and the word check never needed a model.

**4b. The same failure one step earlier.** One model serves both calls, so in practice the child
does not speak either: `speak` returns `silent` and there is no line to tally.

**Expected items: none.** *Agent-written.* `turn` gives an empty `child`, and that empty string is
the record of the silence — no extra field earns its place, and anything counting turns can see it.

> **What `unread` is, and ruling 15 did not settle it. Ruled here: a note, always shown, never a
> debt.** *Agent-written.* Three reasons. Law 1 binds what asks a question and an unread turn asked
> nothing anyone can see, so the law does not actually reach it. Making it a debt would stop a
> session from ending until the model came back, which is a heavy behaviour on a path that is rare —
> a local Ollama that is running tends to stay running. And nothing closes it by checking, so a debt
> would sit open by construction. What ruling 9 wanted was that an unread turn never reads as a
> clean one, and a note the review phase must display does that without holding the session hostage.

---

## Hard cases the red team found

Four agents, four angles, 2026-08-12. **All four succeeded**, and every one wrote an implementation
that passed all fourteen tests while breaking something section 1 or section 3 states. Ten holes,
all ruled real, all now closed by a test. Two of them are defects in the oracle itself rather than
gaps in it.

**The Law 1 direction, and this is what the step is for.** The two worst holes both make the tally
go *silent* about something the child introduced. Silence is the failure mode Law 1 names, and a
green suite is exactly what it looks like.

| # | The hole | Why nothing caught it |
|---|---|---|
| 1 | A line of nothing but function words, with the model unreachable, can lose its `unread` item to a short-circuit guard | The tests never cross the two axes: the degenerate line is paired with a *successful* extraction, and every `unread` assertion rides on a line full of content words |
| 2 | An implementation that skips the link check entirely when the graph is empty passes | The empty-graph test hands it no extracted links. Turn one is precisely when everything the child says is introduced |
| 3 | A three-letter content word — *lid*, *rim*, *jet* — is never flagged, and a length floor at four characters passes | *pump* at four characters is the shortest word the oracle requires. The floor sits one character above the cliff |
| 4 | The same floor feeds the subset match, so a short phrase shrinks to the empty set, and the empty set is a subset of everything — so the link is judged already held | Nothing puts a short concept on either side of a link |
| 5 | A row can be renamed into **your** graph's words, so the ledger holds a link you asserted wearing the shape of one the child did | The two link tests assert `toHaveLength(1)` and read nothing inside the row |
| 6 | `find` instead of `filter`: only the first novel link is emitted | No test hands the tally more than one extracted link |
| 7 | `within` stamped from the first flagged link onto every word, contained or not | Example 2's three words all genuinely sit inside its one link, so *names the link* is the only reading it pins |
| 8 | `turn`'s `said` branch is asserted by nothing, so an implementation can drop `introduced`, or clean the child's line through `say` and turn its question into a statement | Example 4b exercises `silent` only |
| 9 | **A defect in the oracle.** The invariant case *"the flapper lifting lets the tank water rush into the bowl"* can only pass by reading `link.sentence.quote` or by luck with a stop list — *lets* is in no anchor quote | The test could not tell a correct implementation from a forbidden one. Section 3's wording is now clarified and the case is pinned explicitly |
| 10 | **A defect in ruling 7's wording.** *"or relation not already in your graph"* reads as graph-wide, so once `prevents` appears anywhere, a reversed chain using it introduces nothing | The fixture graph held no `prevents`, so both readings gave the same answer |

**Dismissed: none.** Every attack named an input, and every input distinguishes a wrong
implementation from a right one.

**The strongest thing the step produced was not a hole.** It was hole 9 — the red team found the
oracle asserting something it could not actually check, which is the failure the oracle exists to
prevent, one level up.

## What mutation found

`npx stryker run --mutate src/feynman/tally.ts`, five rounds. **43 survivors, then 21, 13, 11, and
finally 5.** Score 67.97 → 86.27 → 91.50 → 92.81 → 96.67, and the score is not the point: what the
runs actually said is below. **The last two rounds came after the review**, which is why the
dismissal list below is shorter than the round that produced it.

**A trap worth naming:** `reports/mutation/mutation.json` is gitignored and is not regenerated by
this config, so it holds whatever an older run left. Three agents read it as authoritative on
2026-08-12 and reported the wrong figure. Re-run the tool; do not read the artefact.
The instrument was checked first — `stryker.config.json` declares the vitest runner, which it did
not on 2026-08-06, when the missing declaration made Stryker fall back to the command runner and
report coverage analysis that was fiction.

**The finding: nothing tested the stemmer.** Twenty-six of the first forty-three survivors sat in
it, and it is ruling 14's entire mechanism. The oracle's own vocabulary is why — *flapper*,
*siphon*, *toilet*, *empties* are all long words that miss every suffix rule but one. Thirteen
behavioural tests now go through the tally and pin what each rule changes about a row:

- *chains* is *chain*, *lifted* and *lifting* are *lifts*, *rushes* is *rush* — strip only the `-s`
  from *rushes* and you get *rushe*, and the child is charged for a word you said yourself.
- **The length guards, each with a short word that breaks the rule that looks right.** *dies* is not
  *dy*, *axes* is not *ax*, *gas* is not *ga*, and *batteries* is *battery* rather than *baty*.
- **The other direction, and the dangerous one.** *chain* and *chair* must not collapse onto one
  stem. A rule that trims two characters off everything merges them, and a word you never said stops
  being written down at all.
- **A word inside two flagged links is charged to the first**, so a row does not move because
  Extract happened to return its links in a different order.

**Eleven were dismissed at 92.81%, and six of those were then killed** by the two tests the review
asked for — the `-ing` and `-ed` length guards among them, which the dismissal reasoning had called
undistinguishable and which a base form sitting on the boundary against its own inflection kills
without needing any collision at all. **That dismissal was wrong, and it is left visible here rather
than quietly deleted**: it is the clearest evidence on this page that a reason can read well and be
false.

**The five that remain are dismissed, each for a stated reason**, per `AGENTS.md`'s rule that a
survivor is a bug report rather than a score:

- **One regex mutant**, dropping the `$` from the sibilant rule. It needs a single token carrying
  *ches*, *shes* or *xes* somewhere other than the end. English compounds that do are not one token.
- **One on `sameConcept`'s empty-set guard**, reachable only from a graph whose own link quotes hold
  no word characters. Extract cannot produce one: `validate` mints a link only from a phrase that
  anchored into a sentence.
- **One on `stemsOf`'s fallback**, which distinguishes only when both sides of a comparison have no
  word characters at all.
- **Two on the stop-list construction**, `.split(/\s+/)` and `.filter(Boolean)`. Both let an empty
  string into the list, and `TOKEN` never yields one, so nothing can ever look it up.

**No mutant was killed by a test written to protect dead code, and none was fixed by deleting a
guard.** Every guard the runs touched turned out to be load-bearing, which is itself worth knowing:
the file has no dead defensive code in it.

## 7. What this piece hands on

**`tallyIntroduced` and `turn` are built.** 41 tests, mutation 96.67%, five survivors dismissed with
reasons in the mutation record above. **`speak` is not built** — the model half has no code, no
prompt and no eval, and the eval branch it takes is where that belongs.

Each item below is a ticket on the feature's map, not a paragraph for the next reader to find.

**To whoever builds `speak`.**

1. **`say` still lives in `voice.ts`.** It moves to `speak.ts` when `voice.ts` is deleted, and the
   five comments citing this file's ruling 6 move with it or they point at nothing.
2. **`notice.ts`, `voice.ts` and `words.ts` are retired by ruling 11 and not yet deleted**, because
   `demo.ts` still runs on them. Deleting them is part of building `speak`, not a separate tidy.
3. **`Spoken` gains `{ kind: 'resay' }`** under ruling 18, and the gate that produces it runs
   *before* `speak` is called.

**To Cohere.**

4. **Take the stemmer.** It is private to `tally.ts` today, and `conceptOf` has the same defect it
   fixes: *lifts* and *lifting* are two nodes in your own graph. When Cohere adopts it, it becomes a
   shared module with its own oracle, which nobody has written.

**To Session.**

5. **The ledger row is yours** — its columns, its persistence and its `closed` predicate. Ruling 10.
6. **The response pairing is yours.** Ruling 17: mark a row engaged when the concept it waits on
   appears in the links of the next thing you say. Engaged never means closed.
7. **Supersession filtering is yours, and nothing does it today.** A superseded turn's links still
   resolve, so the graph holds claims you retracted. `decisions.md`'s *The `Doc` is the turn* carries
   the full list.

**To Extract.**

8. **`unavailable` is overloaded.** An empty turn returns `unavailable: 'nothing to read'`, and the
   tally logs that as `unread` — a note saying the model could not read a turn it was never asked to
   read. The two need separating.
9. **`asDoc` needs the turn id**, and `demo.ts` bypasses `extract` entirely, so threading it through
   `extract` alone leaves the only runnable entry point unconverted.

**Undecided, and each blocks something.**

10. **Is the child's line a `Doc` in the same namespace as yours?** Extract runs over both. With a
    turn-ordinal `unit_id` your *"okay"* and the child's *"okay"* collide, which is `anchor.md`
    ruling C's hole one level up.
11. **Nobody has read `whisper-server`'s `/inference` response body**, so ruling 18's gate does not
    know whether its signals exist on the route this app uses.
12. **Ruling 14's subset match is the loosest thing here** and the first place to look when the
    ledger is wrong. It over-matches, which under-reports, which is the Law 1 direction.

**What nothing measures.** Whether an item the tally writes down is one worth closing. That is
Supply's judgement and `decisions.md` records the decision to ship it unmeasured. This piece adds
no measurement and claims none.
