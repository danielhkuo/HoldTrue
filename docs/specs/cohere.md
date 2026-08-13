# Spec: Cohere

> **Status: specced, not built. 2026-08-12.** Sections 1 to 5 are written; section 6 is the oracle
> and is the owner's; section 7 is written when the piece ships. `src/feynman/cohere.ts` exists as a
> skeleton and its own header says so — it was written so the child could speak before Extract could
> run, and it is not this spec's implementation.
>
> **Four rulings below change a signature and block the oracle: 1, 2, 3 and 5.** Rulings 9 and 10
> are settled, and 9 depends on 2 — the kill numbers are unreachable if termini stay flagged.
>
> This piece carries a kill number. The **false-question rate** is one of the falsification week's
> three measurements, it scores Cohere's flags against hand-marked explanations, and it is reported
> **per predicate**. So the list of shape kinds in section 2 *is* the predicate list that measurement
> reports against, and changing it changes what gets measured.

## 1. What it does

Cohere reads the graph Extract pulled out of your own words and finds **where your chain does not
close**. No model, no source, no knowledge of the world. Set arithmetic and nothing else.

It never speaks. What it produces is a list of shapes handed to `speak` as context, and every one is
a place a question could be asked — not a question, and not a finding. Something downstream decides
whether to ask.

**The line between Cohere and Clarity, which `../features/feynman.md` draws and this spec keeps:
Cohere reads the graph, Clarity reads the prose.** A shape is a fact about how your concepts connect.
It is never a judgement about how well you said anything.

**The thing to hold on to.** Extraction is wrong often enough that being wrong is the normal case.
Every shape Cohere emits on a link Extract missed is a question about a step you *did* explain. That
is the false-question rate, it is the number that can retire this piece, and nearly every ruling in
section 5 is about not inflating it.

## 2. Public API

```ts
// src/feynman/cohere.ts

import type { Extraction } from './extract.js'
import type { Link } from './validate.js'

/** A place your chain does not close. Never a question, never a finding. */
export type Shape =
  /** You named it and never said what it does. Ruling 2 excludes the chain's own last effect. */
  | { readonly kind: 'dangling'; readonly concept: string; readonly from: readonly Link[] }
  /** You named it and never said what makes it happen. Ruling 2 excludes the chain's own first cause. */
  | { readonly kind: 'rootless'; readonly concept: string; readonly from: readonly Link[] }
  /** Two things you linked to a third and never to each other. Where the child plants a guess. */
  | { readonly kind: 'unlinkedPair'; readonly a: string; readonly b: string; readonly via: string; readonly from: readonly Link[] }
  /** Two links of yours that disagree. */
  | { readonly kind: 'conflict'; readonly a: Link; readonly b: Link }

export function cohere(extraction: Extraction): readonly Shape[]
```

**It takes the whole `Extraction`, not a link list.** A sentence that yielded no link contributes no
`Link`, so a link list cannot see it — and ruling 1's mute is a rule *about* such sentences.
`extract.md` already says this: *"Every sentence read, in order — including those that yielded no
link. Cohere needs the ones that yielded nothing as much as the ones that did."*

**Every string in a `Shape` is a verbatim quote of your words.** `from` carries the links a shape was
computed from, so any flag can be traced to a span, to a sentence, and to a hand mark. That
traceability is the measurement's requirement, not a convenience.

**Deduplicated by concept.** One concept yields at most one `dangling` and at most one `rootless`,
however many links touch it. Ruling 3.

## 3. What it must not do

- **Flag a terminus.** The first cause and the last effect of your chain are not gaps. Ruling 2.
- **Emit a string you did not say.** Every field is a quote. The skeleton's `via` is a normalised
  comparison key, and that is the one field in it you never said aloud. Ruling 5.
- **Read the prose.** Word counts, sentence length, hedging and disfluency are Clarity's. Cohere sees
  a graph.
- **Call a model, read a note, or consult anything.** Its whole authority is that it knows only what
  you said and how the pieces connect.
- **Ask anything.** A shape is an opportunity. `speak` decides.
- **Count.** A number derived from these shapes is an engineering instrument and never appears beside
  a finding. Invariant 7.
- **Read a superseded turn.** `decisions.md`'s *The `Doc` is the turn* says the link set handed here
  is assembled from unsuperseded turns only. Ruling 8 says who does that.

## 4. Invariants that apply

Quoted in full, because a number says where a rule lives and not whether it is in force. **Cited by
number and never by line** — lines move, and a spec written on 2026-08-12 was already wrong about
them within the hour.

**Invariant 5** — *"Anything that asks the user a question supplies the answer. No feature ends on a
finding."* Cohere does not ask, so it does not owe an answer. But every shape it emits is a question
something else may ask, and a shape computed off a link Extract missed is a question with no answer
behind it. The rule reaches Cohere through what it makes possible.

**Invariant 8** — *"Extraction is per-sentence, never one-shot over a whole explanation."* Marked
*unwarranted pending measurement* 2026-08-07 and still in force. Cohere consumes exactly what that
shape produces, and ruling 1 makes it consume the per-sentence record too, not only the links.

**Invariant 2** — *"Quotes are validated as literal substrings of the source before display; a
non-matching quote is a rejected extraction, not a warning."* Scope narrowed 2026-08-07. Every string
Cohere emits is a quote of your words, so this binds every field of every shape.

**Invariant 4** — *"`confidence` means 'how strong is my reason to stay quiet.'"* Marked for review
2026-08-07, in force until reviewed. The connective mute in ruling 1 is exactly this: knowledge that
suppresses output and produces none.

**Invariant 6** — *"Findings are phrased at the task, never the person."* Cohere phrases nothing, but
its shape names are read by whoever does. A kind called `incoherent` would smuggle a judgement into a
type name.

**Invariant 7** — *"No grade, score, or rung is displayed beside a diagnosis, unless the score has
ground truth the diagnosis does not."* Amended 2026-08-10; the exception admits the catch rate alone.
The false-question rate is an engineering measurement and is not beside anything.

**Invariant 3 is repealed** (2026-08-07), and this matters here because `decisions.md`'s mute ruling
cites it as its reason — *knowledge may suppress output, never produce it*. **The ruling survives on
its own terms** and on invariant 4, and the citation is dead. Do not read the mute as still resting
on invariant 3.

**Invariant 9 does not reach this piece.** It forbids diffing two extractions of your own words.
Cohere diffs nothing; it reads one extraction once.

## 5. Rulings and open questions

**Ruling numbers are permanent addresses**, the convention `AGENTS.md` uses for invariants. A ruling
that dies keeps its number and its strikethrough. **Note that `extract.md` and `child-speech.md` each
have their own rulings 1 to 8; cite the file name.**

1. **What is Cohere's input?** **PROPOSED: the whole `Extraction`.** The skeleton takes
   `readonly Link[]`, and that signature **silently repealed a decided ruling.**
   `decisions.md`'s *The connective table is a mute, never a joiner* requires that when a sentence
   opens with a causal connective and Extract returned no cause for it, Cohere must not flag that
   sentence's subject. A sentence with no link contributes no `Link`, so the mute is not merely
   unimplemented — it is **undecidable at the current input**. `extract.md` already specifies the
   remedy and Cohere ignored it. Rejected: keeping the link list and dropping the mute, which repeals
   a decision by omission, and that is how the repeal happened in the first place.
   **Changes a signature. Blocks the oracle.**

2. **Is a terminus a gap?** **PROPOSED: no.** Every chain has a first cause and a last effect. The
   skeleton flags both — on a single link `X→Y` it emits `rootless X` *and* `dangling Y`, so a
   perfectly closed explanation is flagged twice — which contradicts section 1's *where the chain does
   not close*. So `rootless` excludes the chain's own head and `dangling` excludes its own tail;
   everything else is flagged.

   **This is the largest single input to the false-question rate**, which is the number that can
   retire the piece, and it is the ruling to attack first. The retired `notice.ts` already suppressed
   the head as a local workaround, with the right reason — *every explanation has a first cause, and
   asking what causes it is not finding a gap, it is missing where the story begins* — and that patch
   dies with the file. Rejected: flagging termini, which is what the skeleton does; and suppressing
   the head only, which is `notice`'s asymmetry and nobody has argued for it.
   **Changes behaviour the oracle asserts. Blocks the oracle.**

3. **One shape per concept, or one per link?** **PROPOSED: per concept.** The skeleton pushes a
   `dangling` for every link whose effect is that concept, so a concept with three links into it
   yields three flags. A rate counting those separately reports the graph's fan-in rather than
   Cohere's error. The links move into `from`, which is also what makes a flag traceable to a hand
   mark. Rejected: per link with the consumer deduplicating, which is what happens today — `notice`
   absorbed it with its `asked` keys, so every future consumer inherits the burden and each invents
   its own key.
   **Changes a signature. Blocks the oracle.**

4. **`unlinkedPair` compares the wrong things.** **PROPOSED: fix, and it is a defect rather than a
   design question.** `linked` holds `cause→effect` keys, but the guards ask whether one *cause* links
   to another *cause*. When both causes normalise alike the key is `X→X`, which is present only if you
   said X causes X — so the skeleton emits `{a: X, b: X}`. Two identical links do it, and **so does
   every conflict**, since X causes Y plus X prevents Y puts X in the group twice. `notice.ts` turned
   that into the child asking whether X causes itself. Silent.
   Changes no signature.

5. **`via` must be a quote.** **PROPOSED: yes**, and `unlinkedPair` gains `from` with the rest.
   `via` is currently the `conceptOf` key — normalised, lowercased, filler-stripped — and it is the
   only field in the type you never said aloud. `speak` puts shape phrases into the prompt, so a
   normalised key would enter as though it were your words. `unlinkedPair` is also the only shape
   carrying no link, which makes it the one kind the measurement cannot trace — and it is the kind
   where the child plants a guess, which is the kind that most needs tracing.
   **Changes a signature. Blocks the oracle.**

6. **Take the stemmer.** **PROPOSED: yes.** `conceptOf` does no inflection stripping, so *lifts* and
   *lifting* are two nodes in your own graph, and a chain you closed reads as one `dangling` plus one
   `rootless` — **inflating the very measurement that carries the kill number.** `tally.ts` holds a
   private stemmer written for exactly this, and `child-speech.md` section 7 already hands it here.
   It becomes a shared module owned by neither piece, and **it needs its own oracle, which nobody has
   written** — that is the cost of this ruling and it is not small.
   Changes no signature of Cohere's; changes `conceptOf`'s behaviour, and therefore `tally`'s.

7. **Does `dangling` survive?** **PROPOSED: yes.** No consumer reads it today — `notice` never did,
   and `notice` is retired — so it looks dead. It is not evidence: the only consumer that will exist,
   `speak`, is unbuilt. *You named a thing and never said what it does* is the plainest gap the
   feature claims to find, and cutting it because a retired skeleton ignored it would be deciding by
   accident. Rejected: cutting it, which is defensible the moment `speak` ships without it.
   Changes no signature.

8. **Who filters superseded turns?** **OPEN, and it belongs to Session rather than here.** *The `Doc`
   is the turn* says Cohere reads unsuperseded turns only, and **nothing in `src/` does that filtering
   at all.** Cohere should be handed an already-filtered `Extraction` and should not know supersession
   exists. Named here because a spec that stayed silent would let it land in Cohere by default.
   Changes no signature of Cohere's.

9. **The four kill numbers.** **RULED 2026-08-12.** Proposed by an agent, accepted by the owner the
    same day, and every one guessed blind before an explanation exists — which is the legitimate
    direction, and the provenance is recorded rather than smoothed over. Ordered by what being wrong
    costs, not by how often each fires: **rootless 50%, dangling 50%, unlinkedPair 25%, conflict
    10%.** They live in
    [`../../measurements/within-sentence/README.md`](../../measurements/within-sentence/README.md)
    with their reasoning, and this file does not restate them. **They depend on ruling 2**: if the
    two ends of a chain stay flagged, every explanation starts with two false flags whatever Extract
    does, and 50% cannot be reached.

10. **How a flag is scored against a hand mark.** **RULED 2026-08-12**, same provenance as ruling 9.
    Mechanical rather than by eye: a flag is false when a mark contradicts what it claims — a
    `rootless` on a concept your marks give a cause, a `dangling` on one your marks give an effect, an
    `unlinkedPair` on two your marks join. The rule is written out in the measurement protocol.

    **The part worth carrying here.** Scoring must **not** use Cohere's own matcher. If it does, a
    matcher defect hides itself: Cohere fails to see *the flapper lifting* and *the flapper lifts* as
    one thing, raises a flag, and a scorer using the same rule fails identically and calls the flag
    correct — the score flatters the bug. So the scorer's matcher is deliberately more generous, and
    every flag gets three outcomes rather than two: true question, false question, and **matcher
    disagreement**. That third bucket is the entire cost of ruling 6 made visible, and it is how
    anyone finds out whether the shared stemmer is worth building.

## 6. The oracle for `cohere`

**Unwritten, and the owner's.** Not to be filled by an agent without his say-so, and if it is, it
says so at the top the way `child-speech.md` section 6 does.

## 7. What this piece hands on

Written when the piece ships.
