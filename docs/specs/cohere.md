# Spec: Cohere

> **DORMANT, AND ITS FOUR KILL NUMBERS ARE SPENT — 2026-08-19.** The pivot in
> [`../decisions.md`](../decisions.md), *The child is the product, and determinism returns as
> prompt material*, took this piece off the live path. It is not deleted and it is expected back,
> one signal at a time, under the re-admission rule in that row: a deterministic signal returns only
> when it is shown to change what the child says, for the better, across more than one pass.
>
> Ruling 9's four false-question numbers score flags this piece is no longer emitting. They are
> **spent, not repealed** — guessed blind before any data, and they return unchanged with the piece.
> What was measured before it went dormant, and what any return has to answer: the matching layer
> joins **zero** seams on real extractions — raw string equality gives the identical node count, so
> every rule in it is currently buying nothing — and a real four-turn session produced five links in
> five disconnected pieces. A return has to show the matcher joining a seam that string equality
> misses, and show that joining it changes the child's line.

> **Status: specced, not built. 2026-08-12.** Sections 1 to 5 are written; section 6 is the oracle
> and is the owner's; section 7 is written when the piece ships. `src/feynman/cohere.ts` exists as a
> skeleton and its own header says so — it was written so the child could speak before Extract could
> run, and it is not this spec's implementation.
>
> **Rulings 1, 2, 3, 5, 9, 10 and 11 are settled.** 3 and 5 were ruled on 2026-08-16 and no longer
> block the oracle. **Ruling 12 now does, and it is the one thing 3 and 5 create between them** —
> dedupe by concept while every emitted string stays a quote, and something has to say *which*
> mention is quoted. It changes behaviour the oracle asserts.
> A demo-grade implementation exists in `src/feynman/cohere.ts` built to 1, 2, 4, 5, 6 and 11 — it has
> no test file, no oracle and no mutation run, and its header says so.
>
> This piece carries a kill number. The **false-question rate** is one of the falsification week's
> three measurements, it scores Cohere's flags against hand-marked explanations, and it is reported
> **per predicate**. So the list of shape kinds in section 2 *is* the predicate list that measurement
> reports against, and changing it changes what gets measured.

## 1. What it does

Cohere reads the graph Extract pulled out of your own words and finds **where your chain does not
close**. No model, no source, no knowledge of the world. Set arithmetic and nothing else.

It never speaks. What it produces is a list of shapes that **was** handed to `speak` as context —
past tense since 2026-08-19, because `speak` is no longer fed by this piece; see the dormancy
banner. Every shape is a place a question could be asked — not a question, and not a finding. Something downstream decides
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

import type { Link, Sentence } from './validate.js'

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

export function cohere(links: readonly Link[], sentences: readonly Sentence[]): readonly Shape[]
```

**It takes the links and the sentences separately — corrected 2026-08-12, see ruling 1.** It asked
for the whole `Extraction` until a review found that an `Extraction` carries one `doc`, and
`decisions.md`'s *The `Doc` is the turn* makes each turn its own document, so a graph spanning
several turns cannot be expressed as one. Both callers that tried invented a different wrong `doc`,
and one produced anchors that resolved against the **wrong sentence** rather than failing.

`sentences` is unread until the connective mute lands, and it is in the signature because the mute
is a rule about sentences that yielded no link — which a link list cannot see. `extract.md` says the
same: *"Cohere needs the ones that yielded nothing as much as the ones that did."*

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

1. **What is Cohere's input?** **RULED 2026-08-12: the links and the sentences, as two arguments.**
   **The first answer was the whole `Extraction`, and it was wrong.** An `Extraction` carries one
   `doc`; each turn is its own `Doc`; so a multi-turn graph is not an `Extraction` and every caller
   forced to supply one invents a `doc` that does not describe the links beside it. `demo.ts`
   invented the whole explanation and `rig.ts` invented the current turn — and `demo.ts`'s version
   made a link from sentence 2 resolve cleanly against sentence 1, which is worse than failing. The
   original reasoning, which stands and is why `sentences` is still a parameter: The skeleton takes
   `readonly Link[]`, and that signature **silently repealed a decided ruling.**
   `decisions.md`'s *The connective table is a mute, never a joiner* requires that when a sentence
   opens with a causal connective and Extract returned no cause for it, Cohere must not flag that
   sentence's subject. A sentence with no link contributes no `Link`, so the mute is not merely
   unimplemented — it is **undecidable at the current input**. `extract.md` already specifies the
   remedy and Cohere ignored it. Rejected: keeping the link list and dropping the mute, which repeals
   a decision by omission, and that is how the repeal happened in the first place.
   **Changes a signature. Blocks the oracle.**

2. **Is a terminus a gap?** **RULED 2026-08-12: no — and *terminus* means position, not topology.**
   **The first implementation of this was catastrophic and shipped.** It defined a head as *any
   cause nothing leads into*, which is the definition of `rootless` itself, so subtracting the
   termini made both guards mathematically impossible: `dangling` and `rootless` **could not fire on
   any input**, and three rig runs of zero shapes were blamed on the matcher for half a day.

   The chain has **one** head and **one** tail — the cause of the first link you stated and the
   effect of the last. A concept with nothing leading into it in the **middle** of your explanation
   is a hole, not a beginning, and telling those apart needs the order you said things in. Topology
   alone cannot supply it. The original reasoning, unchanged: Every chain has a first cause and a last effect. The
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

3. **One shape per concept, or one per link?** **RULED 2026-08-16: per concept.** The skeleton pushes a
   `dangling` for every link whose effect is that concept, so a concept with three links into it
   yields three flags. A rate counting those separately reports the graph's fan-in rather than
   Cohere's error. The links move into `from`, which is also what makes a flag traceable to a hand
   mark. Rejected: per link with the consumer deduplicating, which is what happens today — `notice`
   absorbed it with its `asked` keys, so every future consumer inherits the burden and each invents
   its own key.
   **Signature settled; section 2 was already written to it. What it opens is ruling 12** — a
   concept deduplicated across two differently spelled mentions still emits one string, and nothing
   here says which.

4. **`unlinkedPair` compares the wrong things.** **PROPOSED: fix, and it is a defect rather than a
   design question.** `linked` holds `cause→effect` keys, but the guards ask whether one *cause* links
   to another *cause*. When both causes normalise alike the key is `X→X`, which is present only if you
   said X causes X — so the skeleton emits `{a: X, b: X}`. Two identical links do it, and **so does
   every conflict**, since X causes Y plus X prevents Y puts X in the group twice. `notice.ts` turned
   that into the child asking whether X causes itself. Silent.
   Changes no signature.

5. **`via` must be a quote.** **RULED 2026-08-16: yes**, and `unlinkedPair` gains `from` with the rest.
   `via` is currently the `conceptOf` key — normalised, lowercased, filler-stripped — and it is the
   only field in the type you never said aloud. `speak` puts shape phrases into the prompt, so a
   normalised key would enter as though it were your words. `unlinkedPair` is also the only shape
   carrying no link, which makes it the one kind the measurement cannot trace — and it is the kind
   where the child plants a guess, which is the kind that most needs tracing.
   **Signature settled; section 2 was already written to it. Ruling 12 says which quote.**

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

11. **What may decide that two mentions are the same node.** **RULED 2026-08-12.** The comparison
    key stems every word and then **drops determiners** — *a, an, the, this, that, these, those*, and
    the possessives — because *the yeast* against *that yeast* was leaving the graph in disconnected
    pairs on every rig run. The list is stored stemmed, since the filter runs after stemming and an
    unstemmed *this* survives as *thi*.

    **And the constraint that outlives the fix: node identity must be an equivalence relation.** No
    non-transitive test — subset, overlap, similarity — may key `causes`, `effects`, `byEffect`,
    `linked` or `termini`. Those decide which nodes *are* the same node, and a non-transitive rule
    used there merges A with B and B with C while leaving A and C apart, **manufacturing a chain the
    speaker never stated.** A loose rule may suppress a shape. It may never form one.

    **Rejected: giving Cohere the subset matcher `child-speech.md` ruling 14 gives the tally**, which
    was proposed twice and refuted by experiment. Re-run against the rig's real links it merged
    **nothing** — those phrases differ by whole content words, not by extent — and on a terser
    extraction it merged a node with its own effect, closed transitively, and emitted an
    `unlinkedPair` the speaker never said, plus a self-edge.

    **Still open underneath it.** Determiner stripping did not make Cohere fire on the bread
    transcript either, because two mentions of one thing are never the same string. That is
    Extract's prompt, not this piece's arithmetic.

    **The stated cause was *whole clauses*, and a probe on 2026-08-16 says that is wrong — or at
    least not the binding one.** Run over the toilet explanation `demo.ts` ships, Extract returns
    concepts averaging four words, not clauses. The chain still fails to close, and the reason is
    visible in the output:

    ```
    causes   "push the handle down"  ->  "pulls the chain"
    causes   "the chain"             ->  "lifts the flapper"
    enables  "the flapper lifting"   ->  "the tank water rush into the bowl"
    ```

    **Extract writes an effect as a verb phrase and a cause as a noun phrase**, so the effect of one
    link and the cause of the next are the same node in three different forms — `pulls the chain`
    against `the chain`, `lifts the flapper` against `the flapper lifting`. A perfectly closed
    three-link chain yields two `dangling` and two `rootless`, every one of them false. Stemming does
    not reach it, because the words that differ are the head noun against the head verb, not an
    inflection. This is **the largest single input to the false-question rate** and it is upstream of
    every arithmetic ruling in this file.

    **The obvious fix was tried in the same probe and failed**, which is why this paragraph records
    it rather than proposing it again. A prompt variant asking for *the shortest run of words that
    names one thing* — the move `HANDOFF.md` proposed as the first thing worth doing — returned
    **byte-identical output** on two passes. It changed nothing. What that suggests, untested, is
    that the fix is not about length at all but about **grammatical form**: requiring both sides of a
    link to be a noun phrase naming a thing. Nobody has run that, and the probe was an engineering
    count on generated input, so no figure from it enters this file as a measurement.

12. **Which mention gets quoted?** **RULED 2026-08-16: the earliest, by sentence order.** Proposed
    by an agent and **delegated** by the owner — *"whatever is the best design decision"* — rather
    than authored by him. Recorded that way because rulings 9 and 10 set the precedent and a
    delegated call is weaker evidence than a considered one: if this turns out wrong, it was nobody's
    conviction. This is what
    rulings 3 and 5 create between them and neither answers. Ruling 3 collapses every mention of a
    concept into one shape. Ruling 11 makes the collapsing key stemmed and determiner-stripped, so
    *the yeast* and *that yeast* are one node. Ruling 5 and section 3 then say the emitted string is
    a quote of your words. You said two things; the shape carries one field. **Nothing says which,
    and an implementation that picks silently is picking.**

    Take the earliest mention by sentence order, tie-broken by link order inside the sentence —
    which is simply the first entry in `from`. It is deterministic, it needs no new data, and it
    quotes the concept back in the words you introduced it with, which is the phrasing a question
    should use.

    **The consequence, and it is the part to check in review: `from` becomes ordered, and its order
    is load-bearing.** Section 2 describes `from` as the links a shape was computed from and says
    nothing about sequence. Under this ruling the sequence decides an emitted string, so the spec
    has to require it: `from` is in transcript order. An implementation that builds `from` by
    iterating a `Map` satisfies every word of section 2 today and emits a different quote run to
    run.

    Rejected: **the longest mention**, on the theory that it is the most informative — it is not,
    it is the one most likely to be the whole clause, which is the defect ruling 11 records as still
    open underneath it, so this would bake that defect into the output. **The most frequent
    mention**, which needs a count and still needs a tie-break, so it is this rule with extra steps.
    **The normalised key**, which is ruling 5 and is already refused.
    **Settled. It no longer blocks the oracle.**

## 6. The oracle for `cohere`

**Unwritten, and the owner's.** Not to be filled by an agent without his say-so, and if it is, it
says so at the top the way `child-speech.md` section 6 does.

## 7. What this piece hands on

Written when the piece ships.
