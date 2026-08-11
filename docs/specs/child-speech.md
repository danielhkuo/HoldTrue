# Spec: the child's speech

> **Status: draft, nothing built, 2026-08-10.** Two pieces, both deterministic. Designed against
> 18 generated transcripts of an adult explaining a mechanism to a child; see section 7 for what
> that material is and is not.

## 1. What it does

The child says one thing at a time, built only from what you said.

**Notice** reads the graph Extract pulled out of your explanation and picks a move. **Voice** turns
that move into a sentence. Neither calls a model. Nothing the child says contains a fact you did
not supply.

This is what the child's naivety is made of, now that it is no longer made of a document: the
child heard you, and heard nothing else.

## 2. Public API

```ts
// src/feynman/notice.ts and src/feynman/voice.ts

/** One causal link as Extract emits it. Provisional — see the note in section 7. */
type Link = {
  readonly cause: string
  readonly effect: string
  readonly relation: string
  readonly anchor: Anchor
}

type Move =
  | { kind: 'mirror';    chain: readonly Link[] }
  | { kind: 'on' }
  | { kind: 'guess';     cause: string; effect: string }   // a plant
  | { kind: 'why';       link: Link }
  | { kind: 'needed';    concept: string }
  | { kind: 'start';     concept: string }
  | { kind: 'which';     effect: string; causes: readonly string[] }
  | { kind: 'same';      a: string; b: string }
  | { kind: 'otherwise'; condition: string }
  | { kind: 'conflict';  a: Link; b: Link }
  | { kind: 'term';      term: string }
  | { kind: 'unheard';   term: string }
  | { kind: 'confused';  span: Anchor }
  | { kind: 'resay';     sentence: Anchor }

notice(graph: readonly Link[], said: History): Move
voice(move: Move): string
```

`notice` is total: when nothing else fires it returns `on`. The child never has nothing to say.

## 3. The moves

Five families. Every trigger is a property of your own graph.

**Repeat what you said.**

| Move | Fires when | The child says |
|---|---|---|
| `mirror` | A chain ends on a concept with no outgoing link | *"So the pressure drops and the valve opens, and that's it?"* |
| `on` | Nothing else fired | *"Okay. Then what happened?"* |

**Probe something missing.**

| Move | Fires when | The child says |
|---|---|---|
| `guess` | Two concepts both link to a third, not to each other | *"So the valve opens because the air pushes it?"* |
| `why` | Any stated link | *"Why does squeezing it make it hot?"* |
| `needed` | A concept in the middle of a chain | *"Why does it need the compressor at all?"* |
| `start` | A root with no parent | *"But where does the internet part come from?"* |

**Your graph is under-determined.**

| Move | Fires when | The child says |
|---|---|---|
| `which` | One effect, two claimed causes | *"So is it the curve or the tilt?"* |
| `same` | Two concepts with matching heads | *"Is that the same as the ocean part?"* |
| `otherwise` | A stated condition | *"What about at night?"* |
| `conflict` | Two links in your graph disagree | *"But you just said the curve does it."* |

**A word.**

| Move | Fires when | The child says |
|---|---|---|
| `term` | A concept's head word is not in the common-word list | *"What's a siphon?"* |
| `unheard` | Transcribe flagged the term low-confidence | *"Stoma-what?"* |

**Honest failure.**

| Move | Fires when | The child says |
|---|---|---|
| `confused` | Cohere found a hole and Clarity is high on that sentence | *"Wait, I don't get it."* |
| `resay` | Extract dropped a link on that sentence | *"Wait — say that part again?"* |

`resay` is the only move that **recovers** a loss rather than reporting one. Added 2026-08-10 on the
owner's observation that a sentence the extractor half-failed on is exactly where the child should
ask. A dropped link is not necessarily a wrong link — a paraphrase can be a real link the model
found and worded its own way, thrown away because there is nothing to anchor — so a non-zero
`dropped` means the system knows it lost something real in that sentence. Saying it again gives
Extract a second attempt.

**It claims nothing about you or your sentence.** *Your explanation was unclear* is forbidden and
has no ground truth, and extraction difficulty is mostly a fact about the model, so blaming the
speaker for a 32B model's weakness would be wrong twice over. `resay` reports the listener's state,
like `confused`, and asks for a repeat. **What it does not reach:** links the model never found at
all, which leave no trace anywhere and remain the dominant failure.

`guess` is the only move that asserts. Every instance writes a row to the **plant ledger**, and the
review phase must disclose and close every row before the session ends. A plant left open is a
Law 1 failure.

## 4. What it must not do

- **Name a concept absent from the transcript.** This is the property in section 6 and it is the
  whole guarantee.
- **Assert anything except through `guess`,** and a `guess` is always phrased as a question.
- **Say your explanation was unclear.** `confused` reports the listener's state, not a property of
  your words. See ruling 1.
- **Call a model.** Both pieces are deterministic. Extract is the only model in the live phase.
- **Carry a score, count, rank or completeness figure.**
- **Speak about you rather than the mechanism.** Invariant 6.
- **Mint an anchor.** Every span comes from Extract.

## 5. Invariants that apply

**Invariant 5** — *anything that asks the user a question supplies the answer.* Satisfied at the
session, not per turn: the child asks, you answer, the review phase closes it. A `guess` raises the
stakes, because the child opened it.

**Invariant 6** — *findings are phrased at the task, never the person.* Governs every template.

**Invariant 2** — quotes are validated as literal substrings. **It reaches the anchors, not the
child's mouth.** See ruling 6: the anchor stays exact, and what the child says is a cleaned
rendering of it.

**Invariant 1** — *no user-facing text originates from the model.* **Repealed 2026-08-07**, but the
child honours it anyway, because these two pieces are deterministic. That is a property of this
design, not a rule it obeys.

**Invariant 3** — *no code path branches toward speech on a domain-knowledge value.* **Repealed.**
Section 6's property is a candidate successor: it is mechanically checkable and it fails loudly,
which is what [`../../AGENTS.md`](../../AGENTS.md) says the repo lost. Adopting it is not this
file's to decide.

## 6. The property

**Voice's output names no concept absent from the transcript.** One test. It needs no gold labels,
because its ground truth is the input.

Also cheap and worth having: no move fires on a concept before it is said; no move repeats on the
same concept within N turns; `guess` never names a link already in the graph; the plant ledger
contains only links absent from the graph.

## 7. What is not closed

**The transcripts are generated.** All 18 were written by a model, blind to this design. They are
good for finding move types and bad for anything about frequency — the disfluency is *written*
disfluency, and real speech at 15–25% word error looks different. They do **not** substitute for
the falsification week, which needs your own explanations, hand-marked.

**A correction may not take.** In the evolution transcript the adult corrected an error and the
child reproduced it six turns later. The ledger cannot assume one closure holds.

**The best move in 18 transcripts is one this child cannot make.** A child told the adult that
Grandma has Christmas on the beach in Australia, and a lifelong misconception collapsed. That runs
on world knowledge. This design forbids it. That is the price of the ruling, recorded rather than
argued away.

**And a child that knows only your words will agree with your errors.** The same transcript has the
child endorsing the wrong answer before refuting it. Nothing here un-endorses.

**On the catch score.** The owner ruled on 2026-08-10 that the score appears beside the finding.
This amends [`../philosophy.md`](../philosophy.md)'s third consequence of Law 1, not only invariant
7, so it reaches every feature. The cost, recorded because the evidence gate has no other slot for
it: [`../research/evidence-base.md`](../research/evidence-base.md) carries Shute 2008 summarising
Wiliam 2007 — grades alone produced no gains, comments alone produced large gains, and grades with
comments produced **no gains**. This is a decision taken against that finding, not around it.

## 8. Open rulings

Each would change a signature or repeal a rule.

1. **May the child say "I don't get it"?** [`../features/feynman.md`](../features/feynman.md)
   forbids *saying an explanation was unclear*, marked **Stands**. Proposed: `confused` is a
   different object, since it reports the listener rather than your words. Rejected: dropping the
   move, which leaves the system inventing a specific gap when it cannot tell confusion from
   ignorance.
2. **May Clarity route `confused`?** Clarity counts the things that predict tangled expression.
   Proposed: yes, because choosing a question is not changing a finding. Rejected: reading Clarity
   into the review phase, which the forbidden table bans outright.
3. ~~**Is `conflict` Notice's or Contradict's?**~~ **RULED 2026-08-10: Notice's.** Contradict is a
   model piece whose second input is a document. Two links in your own graph disagreeing is set
   arithmetic with no second input and no model, and putting set arithmetic inside a model piece is
   the `Analyse` mistake [`../workflow.md`](../workflow.md) records this repo paying for once.
   Rejected: Contradict, on the name alone. What survives of `decisions.md`'s *contradiction is
   checked before omission* is relocated rather than lost — within `notice`, `conflict` outranks
   `guess`, `why`, `needed` and `start`, because asking about a skipped step is strange when you
   just said two things that disagree.
4. **Does one closure retire a plant?** Proposed: no. Rejected: yes, which the evolution transcript
   refutes.
5. **Do the two pieces keep these names?** Notice and Voice are verbs on what they are handed,
   which matches their neighbours. Neither answer is proposed.
6. ~~**Does the child speak your filled pauses and stammers back?**~~ **RULED 2026-08-10: no.**
   Voice renders a cleaned form — filled pauses dropped, stammer repeats collapsed. The real
   transcript behind this has 260 filled pauses and 119 repeats in 13,000 words, and a child saying
   *"so it's it's a new set of beliefs"* is a bug, not fidelity.

   **This does not break invariant 2, and the reason matters more than the ruling.** The invariant
   governs anything presented as a quote. It is not phase-scoped — `AGENTS.md` narrowed it on
   2026-08-07 to *wherever something is quoted*, not to the review phase — but the child is not
   quoting. It is talking. **The anchor stays exact**, because the anchor is what the machine
   resolves and what the property test compares against; only the spoken rendering is cleaned. If
   the interface ever displays your words *as a quotation*, that display is literal or it is a bug.

   **Section 6's property survives, restated.** It was *no child utterance names a concept absent
   from the transcript*. It becomes: **no child utterance names a concept absent from the
   transcript after the same normalisation**. Normalisation is deterministic, so the check is still
   mechanical and still fails loudly. Nothing is given up but the word *literal*.

   **Rejected: keeping the raw form**, which honours the letter of a rule the child was never
   inside and makes the product sound broken. **And normalising the anchor itself**, which would
   put a non-literal span where `resolveAnchor` expects a real one and quietly break the one piece
   this repo has actually built.

## 9. Tests

**Deterministic, so predictable.** Hand-write a link set, assert the exact move and the exact
string. Neither piece needs Extract, so both can be built now — the same argument that moved
Extract ahead of Index.

Four tiers:

1. **Properties.** Section 6. No expected output needed.
2. **Fixtures.** Hand-build the link set for each adult turn in a transcript. Assert the move.
3. **Coverage.** Where the human-written child asked a mechanism question, did `notice` return
   anything other than `on`? Real ground truth, already written down, costing nothing.
4. **Read-through.** Does it sound like a child? Human judgement, a review ritual and not a test.
   **Not a model.** A model grading a model is the second-model check
   [`../philosophy.md`](../philosophy.md) rejects; if it returns, it returns as a decision with a
   reason in [`../decisions.md`](../decisions.md).
