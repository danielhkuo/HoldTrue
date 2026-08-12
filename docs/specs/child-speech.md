# Spec: the child's speech

> **Status: specced, not built. 2026-08-12.** Sections 1–5 are written; section 6 is written at the
> red-team step and section 7 when the piece ships. Two rulings in section 5 are OPEN and both
> change a signature, so the oracle cannot start.
>
> This replaces the deterministic design of the same morning, and reverses
> [`../decisions.md`](../decisions.md)'s *The child speaks only from your own words* of 2026-08-10.
> That reversal belongs to `decisions.md` and is recorded there, not here.

**Ruling numbers in section 5 are permanent addresses**, the same convention `AGENTS.md` uses for
invariants. Four files cite *ruling 6* by number — `src/feynman/normalise.ts:7`,
`src/feynman/voice.ts:7`, `src/feynman/validate.ts:20` and `src/feynman/validate.test.ts:1114`. A
ruling that dies keeps its number and its strikethrough.

## 1. What it does

You say a sentence. A model says one line back, as the child. Then a second pass reads that line and
writes down anything the child said that you did not.

The model is what makes the child worth talking to. It answers the sentence that just landed, it can
ask a question that points forward, and it does not produce a non-sequitur every fifth turn. What it
buys with that fluency is knowledge you never gave it, and that same knowledge can ratify a belief
you do not hold. So the guarantee is not that the child cannot say such a thing. The guarantee is
that it cannot say it without being written down. Every written-down item is owed a closure before
the session ends, and that debt is Law 1 — invariant 5, quoted in section 4.

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
  shapes: readonly Shape[],
  model: ModelHandle,
): Promise<Spoken>
```

**Audit.** No model. It is handed what Extract made of the child's line and the graph of your own
words, and it returns what the child introduced.

```ts
import type { ExtractResult } from './extract.js'
import type { Link, Relation } from './validate.js'

export type Introduced =
  /** A link the child asserted that your graph does not hold. */
  | { readonly kind: 'link'; readonly cause: string; readonly effect: string; readonly relation: Relation }
  /** The auditor could not read the turn. Logged, so an unread turn never reads as a clean one. */
  | { readonly kind: 'unread'; readonly reason: string }

export function audit(said: ExtractResult, graph: readonly Link[]): readonly Introduced[]

/** One turn, and everything the session needs from it. */
export type Turn = {
  readonly you: string
  readonly child: string
  readonly introduced: readonly Introduced[]
}
```

**And the phrase cleaner, which survives from the old design.**

```ts
/** Your words, cleaned for saying out loud. Filled pauses and stammers go. Ruling 6. */
export function say(phrase: string): string
```

The comparison key is `conceptOf` from [`../../src/feynman/cohere.ts`](../../src/feynman/cohere.ts),
which is `normalise` plus lowercase. Two mentions match when their cleaned text matches exactly, so
*the flapper lifting* and *lifting the flapper* are two concepts. **That over-reports, and
over-reporting is the safe direction**: an extra item costs the review phase one closure it did not
need, and a missing item is a Law 1 failure.

## 3. What it must not do

- **End a session with an item open.** That is the failure this whole design exists to survive.
- **Show a count of introduced items beside a finding.** Invariant 7, quoted below.
- **Say your explanation was unclear.** It reports its own state, never a judgement of you.
- **Read the transcript for the audit.** The audit reads the child's line. Your graph is already
  extracted, and re-extracting your words to diff them is invariant 9.
- **Present the child's line as a quotation.** It is not one. Anything shown as a quote is literal
  or it is a bug — invariant 2.
- **Fall back to a deterministic child.** Ruling 11.

## 4. Invariants that apply

Quoted in full, because a number tells you where a rule lives and not whether it is still in force.

**Invariant 5** ([`../../AGENTS.md:107`](../../AGENTS.md)) — *"Anything that asks the user a question
supplies the answer. No feature ends on a finding."* The child asks on every turn. The ledger and
its closure are what make the asking legal, so this is the whole design and not a constraint on it.

**Invariant 6** (`AGENTS.md:108`) — *"Findings are phrased at the task, never the person: 'You said X
but not how Y', not 'your explanation was shallow.'"* It governs grammar, not where a sentence came
from, so it reaches the model's line as much as it reached the templates.

**Invariant 8** (`AGENTS.md:121`) — *"Extraction is per-sentence, never one-shot over a whole
explanation."* Marked *unwarranted pending measurement* on 2026-08-07 and **still in force**. It
binds the audit, which runs Extract over one child line at a time.

**Invariant 7** (`AGENTS.md:110`) — *"No grade, score, or rung is displayed beside a diagnosis,
unless the score has ground truth the diagnosis does not."* Amended 2026-08-10, and the exception
admits the catch rate alone. A count of introduced items is not it.

**Invariant 4** (`AGENTS.md:98`) — *"`confidence` means 'how strong is my reason to stay quiet.'"*
Marked for review 2026-08-07, in force until reviewed. Any number the audit ever attaches to an item
inherits this reading.

**Invariant 2** (`AGENTS.md:77`) — *"Quotes are validated as literal substrings of the source before
display; a non-matching quote is a rejected extraction, not a warning."* Scope narrowed 2026-08-07,
not repealed. It binds any span of your transcript the review phase shows back.

**Invariant 9 does not reach this piece**, and a reader will think it does. It forbids diffing two
extractions of *your own words*. The audit diffs an extraction of the child's line against an
extraction of yours, and the child's line is not your words.

**Invariant 1 is repealed** (2026-08-07) — *"No user-facing text originates from the model."* Its
repeal is what permits section 1 at all. **Invariant 3 is repealed** as stated (2026-08-07), and
`AGENTS.md:87-94` names the hole it left: it was the only mechanically checkable invariant, and its
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
8. **OPEN — the two checks catch different failures, not the same failure at two depths.** This was
   framed as a depth choice when ruling 7 was taken, and that framing is wrong. A content-word check
   catches a new *word* in a line that asserts no link — *"is that like a pump?"* introduces *pump*
   and no link at all, and the audit as ruled logs nothing. A link check catches a new *link* built
   from words you already said. Neither contains the other. Proposed: keep ruling 7 and add the word
   check as a second pass in the same turn, giving `Introduced` a third variant, `{ kind: 'word' }`.
   Rejected: leaving it, which ships a ledger that is silent on the commonest way a child introduces
   something. **Changes a signature, so it blocks the oracle.**
9. **OPEN — is an empty extraction an item, or only an unreachable model?** Ruled with 7 as written:
   an `unavailable` result and an empty link list both become an `unread` item. The cost is that
   nearly every question the child asks extracts to nothing, which is the correct reading of a
   question, so the ledger takes an item on almost every turn and Law 1 owes a closure on each. The
   narrower version, offered for a later ruling rather than taken quietly here: only `unavailable`
   becomes an item, and an empty list is counted but not logged. **Changes a signature, so it blocks
   the oracle.**
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

## 6. Hard cases

Written at the red-team step, not before.

## 7. What is not closed

Written when the piece ships.
