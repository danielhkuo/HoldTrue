# Spec: Supply

> ## ⚠ Read this before citing anything below — banner added 2026-08-12
>
> **This file is trusted more than it deserves.** It is the heaviest invariant-citing document in the
> repo and it quotes every invariant it uses in full, which makes it read as the most careful spec
> here. It was written against a repo that no longer exists.
>
> - **Its types are superseded.** `Link`, `ModelHandle` and `Attribution` were guesses made before
>   the real ones existed. The built types are in `src/feynman/validate.ts`, `src/feynman/model.ts`
>   and [`extract.md`](extract.md). Where this file and the code disagree, the code is right.
> - **Its invariant 7 is quoted in its pre-amendment form**, from before 2026-08-10. That is exactly
>   the failure quoting-in-full is supposed to prevent, and it happened here.
> - **What Supply is for got smaller on 2026-08-12.** It no longer hunts gaps in an understanding
>   with no ground truth. It is handed the specific propositions the child introduced — see
>   [`child-speech.md`](child-speech.md) — and checks each one. Its ten open rulings were written
>   against the larger job.
>
> Its reasoning is kept rather than deleted, because none of it was refuted. It was overtaken.
>
> **Status: draft, nothing built, 2026-08-07.** Written the same evening the model-knowledge pivot
> landed, to fill the hole [`../features/feynman.md`](../features/feynman.md) had left when its model
> surface read *"Extract, Contradict, and at least one unnamed piece that carries the whole authority
> of the feature."* This is that piece, named — and whether the name survives is ruling 10.
>
> It has **no row in the build order**, which is
> [`../decisions.md`](../decisions.md)'s to write and not this file's, and it has **no eval**, which
> is a decision rather than an omission — see section 7, and read it before building anything here.
>
> Sections 1 to 5 are written. Section 6 is mostly a placeholder because the oracle step has not
> run, though it now carries one property that does not wait on it. Section 7 is written early and
> out of order, against the usual rule that it closes a built piece, because the one thing a reader
> most needs to know about this piece is what nobody has measured about it.
>
> **Corrected 2026-08-08, after a reading against the rest of the repo.** Section 7 twice claimed
> this piece has no instrument at all; it has one for its likeliest failure, for the cost of one
> column on a measurement already scheduled, and that is now recorded there. Ruling 1 was rewritten
> because two of its three grounds contradicted section 7 and do not survive; it stays **OPEN** and
> its proposed answer is more weakly supported than it was. Section 6 gained the property that
> encodes section 1's contract. Ruling 10, on the piece's own name, is new and was never among the
> nine. Nothing was decided, renamed, or closed by that pass.

## 1. What it does

Supply takes the topic the user chose and the causal links Extract pulled out of what they actually
said, asks model knowledge what the mechanism requires, and returns the link the mechanism has that
the explanation lacks — together with the sentence that closes it, the question that probes it, and
the identity of the model that produced all three. On the default path there is no document behind
any of this. The finding is the model's account of the subject, and Supply is where that account
enters the product.

**Whether this is a new piece or Compare with a different right-hand operand is open** — ruling 1,
rewritten 2026-08-08 after the first draft of it was found to contradict section 7. The question
belongs in the first paragraph because getting it wrong either duplicates a piece or overloads one.
Compare's contract was *"the link present in the source and absent from the explanation"*, and both
of its operands were link sets produced by the same extractor over text —
[#22](https://github.com/danielhkuo/HoldTrue/issues/22) established exactly that, so that Compare
could be set arithmetic and keep a property test. Two things change when the right-hand operand
becomes model knowledge. The operands stop being the same type: a link from Extract carries an
anchor into real text and a link the model holds carries nothing, so deciding whether two of them
are *the same link* stops being set membership and becomes a semantic judgement. And Law 1 lands
here in a way it never landed on Compare: Compare returned an omission and the answer came from the
passage its output pointed at, whereas here there is no passage, so whatever names the gap must also
produce the sentence that closes it. That is a different job, not a different argument.

Sections 2 to 4 are written against the proposed answer — a separate piece — because a spec has to
be written against something. **They are not written against a settled one.** Read ruling 1 before
treating the seam as fixed.

**What Compare keeps.** Everything, under either answer. It is the retrieval path's piece, its
reasoning is untouched, and nothing here supersedes it.

## 2. Public API

```ts
// src/feynman/supply.ts

import type { Anchor } from '../index/anchor'

/** One causal link as Extract emits it over the user's own explanation. The anchor points into
    the transcript and resolves through `src/index/anchor.ts`; see invariant 2 in section 4.

    **Invented here, and not imported from anywhere.** Extract is unbuilt and unspecced —
    `docs/specs/` holds `anchor.md` and this file and nothing else — so there is no emitted type
    to import and no owner to import it from. This is the minimum Supply needs, written down so
    the dependency is visible rather than assumed. It is provisional: when Extract is specced,
    this shape is that spec's to give and this declaration changes to match it, which changes
    `supply`'s second parameter. See the note to Extract in section 7. */
type Link = {
  readonly cause: string
  readonly effect: string
  readonly relation: string
  readonly anchor: Anchor
}

/** The topic the user picked, which scopes the request. It is not a source and carries no
    authority: nothing Supply returns may be presented as coming from it. */
type Topic = {
  readonly title: string
  readonly scope_note?: string
}

/** What this model was calibrated against. `philosophy.md` requires the app to state it and
    records in the same breath that no calibration procedure exists yet, so today the only
    inhabited variant is the honest one. The field exists so that "uncalibrated" has to be
    rendered rather than quietly left out. */
type Calibration = { readonly kind: 'uncalibrated' }

/** Law 2: nothing is asserted anonymously. Every field is required, so a finding without an
    attribution cannot be constructed rather than merely being discouraged. */
type Attribution = {
  readonly model_id: string
  readonly runtime: string
  readonly calibration: Calibration
  readonly support: 'at-or-above-floor' | 'below-floor' | 'unknown'
}

/** The link the model holds and the explanation lacks. It has no anchor, because it has no
    source. See ruling 2 for what identifies it instead. */
type ModelLink = {
  readonly cause: string
  readonly effect: string
  readonly relation: string
}

/** One finding. `missing`, `repair` and `probe` travel together and none of them is optional,
    because a gap opened without its answer is an invariant 5 violation and this is the piece
    invariant 5 lands on. See ruling 3. */
type Finding = {
  readonly finding_id: string
  readonly missing: ModelLink
  readonly said: readonly Link[]
  readonly repair: string
  readonly probe: string
  readonly attribution: Attribution
}

/** The model as the caller has it configured. Supply reads identity from the thing that
    answers rather than from settings, so the attribution it returns names what actually ran.
    Whose module owns this type is ruling 8. */
type ModelHandle = {
  readonly identify: () => Promise<Attribution>
  readonly generate: (prompt: string) => Promise<string>
}

/** An empty result is its own variant rather than an empty array, so that a caller cannot
    read "nothing was found" as "nothing is wrong" by writing `if (findings.length)`.
    See ruling 9. */
type SupplyResult =
  | { readonly kind: 'findings'; readonly findings: readonly Finding[] }
  | { readonly kind: 'none'; readonly attribution: Attribution }
  | { readonly kind: 'unavailable'; readonly reason: string }

/** The one call. Model-backed, so it is asynchronous, not deterministic, and not
    property-testable in the way Cohere and Compare are. Total: a model that returns junk,
    times out, or is not running is an `unavailable` result, never a throw. */
supply(topic: Topic, explanation: readonly Link[], model: ModelHandle): Promise<SupplyResult>
```

`supply` is total for the same reason `resolveAnchor` is: the caller is a session that has a person
sitting in front of it, and a model being unreachable is a normal outcome rather than an exceptional
one. The difference from Anchor is that a null here is not safe to ignore. Anchor failing closed
means a quote is not shown; Supply failing closed means the session has opened a gap it cannot
close, which is precisely what Law 1 forbids, so `unavailable` obliges the caller to abandon the
review phase rather than to continue without it.

## 3. What it must not do

- **No finding without its repair.** Returning `missing` with an empty or absent `repair` is the
  invariant 5 failure this piece exists to avoid, and it is not a degraded mode. If the model
  names a gap and cannot close it, the finding is dropped.
- **No finding without its attribution.** Law 2 is not satisfied by attributing the session, the
  screen, or the app. It is satisfied by naming the model that produced this sentence.
- **No offsets from the model, ever.** Supply never mints an `Anchor` and never accepts one the
  model wrote. The anchors in `said` are copied by identity from the `explanation` argument, which
  Extract already anchored. This is what keeps invariant 2 mechanically true here without adding a
  second validation path: there is no route by which an unvalidated span reaches the screen,
  because Supply cannot produce a span at all.
- **No extraction from the user's words.** Supply reads Extract's output, not the transcript. A
  second reading of the same words, diffed against the first, is exactly invariant 9's prohibition.
  The cost of this is real and is recorded in section 7; the ruling is 4.
- **No score, rank, severity, or completeness figure.** Invariant 7 bans a grade beside a
  diagnosis, and a diagnosis is the only thing this piece produces. That includes a count presented
  as a total, which is the progress bar the feature doc already refuses, wearing a number instead
  of a ring.
- **No sentence about the person.** `repair` and `probe` are about the mechanism and about what was
  said. Invariant 6 is a rule about grammar and it does not relax because the sentence is now the
  model's rather than a quotation.
- **No running in the live phase.** The live phase has to stay cheap enough to interrupt someone
  mid-explanation, which is the reason that survived when the provenance reason did not. Supply is
  review-phase work.
- **No quiet substitution of a different model.** A fallback that answers with something other than
  what `identify()` reported makes the attribution a lie, which is worse than an `unavailable`.
- **No silent degradation below the floor.** Whatever the app does about an unsupported
  configuration, it does not do it by producing weaker findings in the same confident register.
- **No folding into Extract or Contradict.** Extract's input is the user's words and Extract's
  output is anchored; both stop being true the moment this work is folded in, and the live phase's
  one-model guarantee goes with it.

## 4. Invariants that apply

Numbered *and* quoted in full, per `AGENTS.md`, which keeps invariant numbers as permanent addresses
and does not renumber. The number tells you where a rule lives and not whether it is in force, and
after 2026-08-07 that distinction is doing real work: two of the invariants most obviously about
this piece are repealed, and a spec that cited them by number alone would read as legal when it is
not. Struck-through entries are quoted here for exactly that reason.

**Invariant 5**, quoted: *"Anything that asks the user a question supplies the answer. No feature
ends on a finding."* This is the invariant this piece is shaped around, and it is why `repair` and
`probe` are required fields rather than optional ones. `AGENTS.md` re-derived it against the pivot
and found it unchanged: *"what supplies the answer moved from a retrieved passage to the model, but
something must supply it was always the whole rule."* Law 1 in
[`../philosophy.md`](../philosophy.md) is the same rule stated as law, and it is explicit that it
*"binds harder"* now, since the repair is no longer a passage the user could go and read.

**Invariant 6**, quoted: *"Findings are phrased at the task, never the person: 'You said X but not
how Y', not 'your explanation was shallow.'"* It governs the wording of `repair` and `probe`.
`AGENTS.md` notes that it *"governs the grammar of a finding, not its provenance"*, which is why it
survived the pivot untouched and why it applies to a model-authored sentence exactly as it applied
to a quoted one.

**Invariant 7**, quoted: *"No grade, score, or rung is displayed beside a diagnosis."* It is the
reason there is no confidence, quality, or severity field anywhere in section 2. `philosophy.md`
sharpens what is at stake: *"the absence of a score is the only thing keeping that opinion from
reading as a verdict"*, and the opinion in question is this piece's output.

**Invariant 2**, quoted: *"Quotes are validated as literal substrings of the source before display;
a non-matching quote is a rejected extraction, not a warning."* Its scope narrowed on 2026-08-07
and it was not repealed. It reaches `said`, which carries the user's own words back to them, and it
reaches nothing else here, because `missing` and `repair` quote nothing. Section 3's ban on
model-emitted offsets is how this is honoured: every anchor Supply hands on came from Extract and
resolves through `src/index/anchor.ts`, which `AGENTS.md` still names as where the invariant is
enforced for the whole codebase.

**Invariant 4**, quoted: *"`confidence` means 'how strong is my reason to stay quiet.' Not 'how sure
am I this is wrong.' Code treating it as the latter is a bug."* **Marked for review 2026-08-07 and
in force until reviewed.** No field in section 2 is named `confidence`, so the rule is honoured
without being exercised, and ruling 5 explains why adding one was declined rather than merely
skipped. A builder who reaches for a confidence score on this piece is reaching for the reading the
invariant calls a bug.

**Invariant 1**, quoted: *"No user-facing text originates from the model."* **REPEALED 2026-08-07,
and quoted here because it is the rule an agent is most likely to import from memory and apply to
this piece.** Supply exists to do the thing this sentence forbade. `AGENTS.md` says so directly —
*"Do not re-import this from memory"* — and records what the repeal cost: hallucination used to be
a validation failure and is now a judgement call. If you are about to reject this spec on invariant
1, read [`../philosophy.md`](../philosophy.md) first.

**Invariant 3**, quoted: *"No code path branches toward speech on a domain-knowledge value during
elicitation."* **REPEALED 2026-08-07 as stated.** Supply is a code path from domain knowledge to
speech, which is the design and not the bug. What it leaves behind is an obligation rather than a
permission, and `AGENTS.md` names it: this was the only invariant that was mechanically checkable
and said *there must be a test*, and nothing has replaced it. That hole lands on this piece more
squarely than on any other, and section 7 carries it forward rather than filling it here.

**Invariant 9**, quoted: *"Never diff two extractions of the user's own words."* The struck clause
that followed it — *"~~compare their explanation against their source material~~"* — was repealed
the same day, and Supply is what stands where that clause used to point. The surviving prohibition
binds: it is why section 3 forbids Supply from reading the transcript and extracting from it, since
that would make both sides of the comparison readings of the same words. The comparison Supply
actually runs has only one extraction in it.

**Cited and found not to reach this piece: invariant 8**, quoted: *"Extraction is per-sentence,
never one-shot over a whole explanation."* Its subject is extraction, and `AGENTS.md`'s own
re-check against the pivot says so — *"Extract still reads the user's own explanation, sentence by
sentence, and the user's explanation is the input this governs."* Supply reads a link set, not
sentences, and emits no spans, so nothing here is the thing invariant 8 constrains. Recorded rather
than omitted because the omission would look like an oversight, and because the invariant is
separately marked **unwarranted pending measurement**, so nobody should be arguing anything from it
in either direction right now.

## 5. Rulings and open questions

Everything below is **OPEN**. Nothing here has been ruled on by the owner, and every one of these
questions would change a signature in section 2, which under `/holdtrue-workflow`'s gate means the
oracle step cannot start until they are answered. Rulings 1 to 9 were written 2026-08-07; ruling 1
was rewritten and ruling 10 added on 2026-08-08. Each carries a proposed answer and the alternative
it rejects, because a bare question is more work for the person ruling than a wrong proposal is —
with one exception. Ruling 10 states both cases and recommends neither, because what it turns on is
a judgement this file does not hold.

### 1. Whether this is a new piece or Compare with a different right-hand operand. OPEN.

**Rewritten 2026-08-08, and the proposed answer is now more weakly supported than when it was
written.** As first drafted this ruling gave three grounds and called each one sufficient. Read
against the rest of the file, two of them fail and one of those contradicted section 7 outright —
this ruling called determinism over a generated set decorative while section 7 mourns Compare's set
arithmetic as one of two structural guarantees the pivot cost. Both cannot be true. What follows
states each case at what it is actually worth, and the argument that now carries the most weight is
one the first draft never made. **The proposal is unchanged and its support is thinner. That is the
honest state of it, not a defect in the rewrite.**

**Proposed:** a new piece, named Supply, with the contract in sections 1 and 2. Compare is
untouched and stays scoped to the optional retrieval path.

**The alternative, at its strongest: keep Compare and swap its operand.** A new upstream step
produces an unanchored link set for the topic from model knowledge, and Compare performs
`modelLinks \ explanationLinks` as before. It preserves a built-and-reasoned design and adds one
small piece rather than one large one. And — the part the first draft missed entirely — the differ
half of that split stays *genuinely* deterministic and property-testable with no gold labels
anywhere: **no finding names a link already present in the explanation.** That property is now in
section 6. It is not decoration. It is the mechanical guard against the failure section 7 names as
this piece's likeliest, in the one direction a machine can check.

**Where the three original grounds now stand.**

*The operands are not commensurable* — **survives, and is the strongest of the three, but it argues
about difficulty rather than about how many pieces there are.** Under #22 both sides came from one
extractor over text, so *is this the same link* was a decidable predicate over comparable tokens.
One side is now unanchored propositions from a model and the other is anchored spans into speech,
so matching them needs paraphrase-tolerant identity, which is a model judgement wearing set
notation. That is equally true whichever way the pieces are cut. The split does not remove the
semantic match; it decides which module owns it.

*The determinism becomes decorative* — **withdrawn.** Section 7 is right and this ground was wrong.
Difference over a generated set is certain about set membership, and set membership is exactly what
the absence property needs: a finding naming a link already in Extract's output is refutable without
knowing anything about the world. What the pivot cost is certainty that the *right-hand set is
true*, which sits upstream of the arithmetic under either answer and is not the arithmetic's fault.

*Splitting buys no testability* — **withdrawn on the same ground.** It buys the absence property a
module boundary and a name, which is what makes it a contract somebody cannot quietly drop in a
refactor. What survives is the narrower claim, which is real: the split buys no measurement of
whether a named gap is *real*, and the producer half still has no gold standard.

**What now carries the case for a separate piece, and the first draft never made it.** Compare is
scoped to the optional RAG path in three places, deliberately and on the record.
[`../decisions.md`](../decisions.md) marks #22 *"scoped to the optional RAG path 2026-08-07"*; the
same file's open list names Index, Retrieve and Compare as having no subject when there is no
corpus; and [`../features/feynman.md`](../features/feynman.md)'s decomposition table is marked
*"This table describes the retrieval path."* Supply is default-path work that runs whether or not
the user ever turns retrieval on. Reusing Compare either drags a default-path obligation into a
gated, optional phase, or forces all three markings to be reopened and re-cut. And the decisions
file says, in the same breath as its own marking, that what the default path decomposes into is
unanswered and that *"nothing should be re-cut until it is."* Leaving Compare where it was put is
the reading that leaves that scoping alone.
Behind it sits the Law 1 argument in section 1: Compare returned an omission whose answer was the
passage its output pointed at, and here there is no passage, so whatever names the gap owes the
sentence that closes it.

**What the owner is choosing between.** One piece with an internal comparison stage and no seam a
test can stand on, against two pieces where the deterministic half is separately testable but the
scoping in three documents has to be reopened and Compare acquires a second caller on a path it was
explicitly moved off. Whoever rules should read section 6 first, because the absence property is the
thing both readings are really arguing over. A builder may still implement Supply with an internal
comparison stage under either answer; what is open is whether that stage is a contract seam.

### 2. What identifies a finding that has no source. OPEN.

`AGENTS.md`'s anchor-format section leaves this open in exactly these words: *"whether a finding
with no source carries an anchor at all, and if not, what identifies it for the eval and for the
UI."*

**Proposed:** `finding_id`, a content hash over the finding's own text and its attribution. Not an
anchor. It is stable across a re-run that produces the same finding, which is the property the
paired regression protocol would need if an eval ever arrives, and it matches the repo's existing
habit of content-addressed identity.

**Rejected: reusing the `Anchor` shape with null or zero offsets**, which puts a source-shaped
object where there is no source and would eventually be handed to `resolveAnchor`. **And a random
UUID per call**, which is cheaper and unstable: two runs of the same model on the same input produce
two identities for one finding, so nothing can ever be paired across runs, and the one part of
`AGENTS.md`'s harness that survives the loss of gold labels is the paired protocol.

### 3. Whether the probe is minted here or by Session. OPEN.

**Proposed:** here, in the same object as the repair. The argument is Law 1 and invariant 5: the
only structural way to guarantee that a question is answerable is to mint it beside its answer. If
Session composes the probe from a finding, Session can compose one nothing closes, and
[`../features/feynman.md`](../features/feynman.md) already names the case — *"which comes first?"*
on a feedback loop — where the fiction makes a question irresistible and no source, the model
included, can close it.

**Rejected: Session owning the probe**, which reads better as a separation of concerns and puts the
conversational surface in one place. It is declined because it moves the Law 1 obligation to a piece
that does not hold the answer, and Law 1 is the constraint this whole spec is built to satisfy.

### 4. Whether `supply` takes the transcript. OPEN.

**Proposed:** no. Its inputs are the topic and Extract's link set.

**Rejected: passing the raw transcript alongside the links**, which would let the model see what the
user said that Extract dropped. It is declined because a second reading of the user's own words,
compared against the first, is what invariant 9 prohibits, and because it hands Supply an input it
would have to anchor into, reopening the offset route section 3 closes.

**The cost is real and is not argued away.** Extraction is imperfect by an unmeasured margin on this
genre, so a link the user genuinely stated and Extract missed will look to Supply like a gap. That
is a false finding, and precision is the axis Law 1 charges for. It is recorded again in section 7,
because it is the failure this piece is most likely to have — and section 7 also names the one
instrument that reaches it, which is a column on the falsification week's hand-marked explanations.
Nothing *scheduled* measures it today. Nothing at all measures precision on gaps that are genuinely
real.

### 5. Whether there is a `confidence` field. OPEN.

**Proposed:** none.

**Rejected: a `confidence` that can only suppress**, in invariant 4's sense of brake pressure — a
value that reduces output and can never manufacture a confident wrong correction. This is
attractive, and `philosophy.md` says as much: *"a value that can only suppress cannot manufacture a
confident wrong correction."* It is declined for one reason only, which is that invariant 4 is
itself **marked for review** and currently *"a rule with no argument under it."* A field whose
defining rule is under review is a field with no settled meaning, and baking one into a signature is
the expense the ruling gate exists to prevent. **If invariant 4 is settled either way, this reopens
immediately** — a repeal makes the field meaningless and a re-derivation makes it attractive again.

### 6. What happens below the model floor. OPEN.

**Proposed:** `Attribution.support` is a required field, `supply` still runs, and refusing to display
is the caller's decision. Supply reports the configuration and does not adjudicate it.

**Rejected: `supply` refusing to run below the floor**, which puts a policy gate inside a module
that cannot know what the user is trying to do, and **omitting the field**, which is the silent
quality drop `philosophy.md` explicitly forbids: *"a degradation the user cannot see is one they
cannot correct for."*

**Note what is not claimed.** Nothing in the repo currently computes whether a configuration is at
or below the floor — the floor is stated as a class and a memory budget that `AGENTS.md` marks as
arithmetic nobody has run. So `'unknown'` is the honest value today and will be until someone
decides what measures it.

### 7. Whether Supply and Contradict are one piece or two. OPEN.

**Proposed:** two. `supply` returns omission findings only, and Contradict keeps its own contract.

**Rejected: one model call returning both kinds of finding**, which is now more tempting than it
was, because the thing that used to separate them was where the second operand came from and both
operands are now model knowledge. The proposal keeps them apart on grounds that never mentioned a
source: `../decisions.md`'s row *Contradiction is a distinct finding from omission* turns on the
difference between believing something wrong and skipping a step, and the session checks
contradiction first, which needs them separable.

**This is the least settled ruling here and it changes the return type.** Contradict's inputs and
the source half of its two-span output are both unresolved by the pivot, and nobody has designed
what it becomes. If it becomes a model-knowledge piece with the same shape as this one, the case for
one piece gets stronger and `Finding` grows a discriminator. Do not build either until this is
ruled.

### 8. Whether `ModelHandle` belongs to this spec. OPEN.

**Proposed:** no. It is declared here as the minimum Supply needs and owned by a model-client module
that does not exist yet, so that this spec does not silently become the place model configuration
lives.

**Rejected: Supply owning the model call directly** — reading `/api/tags`, choosing an endpoint,
formatting the request. Declined because Contradict and Extract need the same thing, and Law 2's
honesty about which model answered would then have three implementations that can disagree.

### 9. Whether an empty result is a variant or an empty array. OPEN.

**Proposed:** the `none` variant in section 2.

**Rejected: `{ kind: 'findings', findings: [] }`**, which is simpler and carries the same
information. Declined because it does not carry the same *reading*: a caller writing
`if (result.findings.length)` renders nothing found as nothing wrong, and
[`../features/feynman.md`](../features/feynman.md) is emphatic that the two are different and that
the difference got larger with the pivot — an empty result *"now means the model found nothing,
which is bounded by what the model knows and by nothing you can inspect."* A distinct variant makes
the caller handle that sentence on purpose.

### 10. Whether the piece keeps the name Supply. OPEN. Added 2026-08-08.

Not one of the nine. The name was given in passing by the file that first needed one, which is how
names usually get made and is not by itself a reason to keep it or to change it. It belongs here
because it changes `supply`, `SupplyResult`, `src/feynman/supply.ts` and every reference in this
file, which is the same test the other nine pass.

**Neither answer is proposed.** What this turns on is a taste about naming that the owner holds and
this file does not, so both cases are put at their strongest and the recommendation is left out on
purpose.

**The case for keeping it.** It names what the piece is *for* rather than what it does
mechanically, and what it is for is the constitution's oldest surviving obligation — invariant 5 and
Law 1, *what asks supplies the answer*. A name pointing at the rule the piece exists to satisfy is
the best available defence against the piece drifting into a gap-finder that stops shipping repairs,
which is exactly the invariant 5 failure section 3's first bullet is written to prevent. The name is
also already spent, and more of it is spent every day: [`../decisions.md`](../decisions.md) uses it
in its build order and its open list, and [`../features/feynman.md`](../features/feynman.md)'s
decomposition now carries a Supply row. The count of references is going up, not down, so the cost
of changing it is rising while nine other rulings are still open.

**The case against is two arguments, not one.**

*The module is ungreppable, and the law now reads ambiguously.* *Supply the answer* and *supplies
the answer* are ordinary prose in this repo. `grep -rliE "suppl(y|ies) .*answer" --include="*.md"`,
run 2026-08-08, returns **six files**: `AGENTS.md`, `docs/philosophy.md`, `docs/decisions.md`,
`docs/features/feynman.md`, this file, and one archived map under `docs/.wayfinder-archive/`. So a
search for the piece returns the law and a search for the law returns the piece. The second half is
worse than the first: invariant 5 quoted in full — *"anything that asks the user a question supplies
the answer"* — can now be read as naming this module, which is the false precision that the
convention of quoting invariants in full exists to prevent.

*It is the only piece named for a duty rather than for its own work.* Anchor, Index, Transcribe,
Retrieve, Extract, Cohere, Compare and Contradict are verbs on what they are handed, and Clarity
names the quantity it reports. This one names the obligation being discharged, while the headline
output that sections 1 and 2 are built around is the **gap** — the repair travels beside it because
Law 1 requires it, not because it is the point. A reader who has only the name expects a piece that
answers questions, and then meets a `Finding` built around `missing`.

**Candidates, offered as material rather than as a shortlist anyone has argued for.** *Complete*,
which is a verb on the input and matches its neighbours, though it collides with the ordinary word
and with completeness, which invariant 7 bans as a displayed figure. *Supplement*, which keeps the
sense and loses the collision with the law's exact wording, though not with the root. *Missing*,
which names the output and reads badly as a function. *Recall* should be struck on sight, since it
collides with the eval term. A deliberately opaque coinage fixes the grepping outright and pays for
it in the mnemonic.

**Nothing is renamed by this ruling and nothing should be renamed in passing.** If the name changes,
this file moves with it, and so does every reference in `../decisions.md` and
`../features/feynman.md`, which are other owners' files.

## 6. Hard cases the property test generator must produce

**Mostly a placeholder, and the reason is not that nobody has got round to it.** One property below
does not wait on the oracle step and is stated in full; the hard cases a generator would have to
produce for it are not written yet.

Under `/holdtrue-workflow` this section is written at the oracle step, and the human writes the
oracle. For a model-dependent piece the oracle step is replaced by the eval branch, and **the eval
for this piece was skipped by decision on 2026-08-07** — see section 7, which is where that decision
and its cost are recorded.

What would go here if it is ever written: the falsifiable properties that survive the loss of gold
labels, which are the first two of the four layers `AGENTS.md` specifies for a model step — schema
validation, and the invariants expressed as properties. For this piece those are that every anchor
in `said` resolves against the transcript it came from, that no `Finding` carries an empty `repair`
or an empty `probe`, that no `Finding` lacks an attribution, and that an empty link set in produces
`none` out. Those are cheap, they are real, and they check that the piece is well-formed.

**And one more, which is not well-formedness and which the first draft of this section left out:
no finding names a link already present in the explanation.** For every `Finding`, `missing` must
not match any member of the `explanation` argument. This is section 1's contract — *the link the
mechanism has that the explanation lacks* — written as a property, and it is the only one on the
list that can catch a **false** finding rather than a malformed one. It needs no gold labels,
because its ground truth is the input argument and nothing else; the generator only has to produce
an explanation and a claimed finding over it. It is also the property ruling 1 turns on, so read
that ruling before deciding whether it lives behind a module boundary or inside one.

**What it does not reach, stated so nobody over-reads it.** Matching here is the same
paraphrase-tolerant comparison ruling 1 calls a model judgement wearing set notation, so the
property is exactly as good as that predicate and no better. And it cannot see a link the user
stated that Extract dropped, because such a link is not in `explanation` either — which is the
failure ruling 4 records and section 7 names as the likeliest. That one is not a property test's to
catch. It has a different instrument, and section 7 says what it is.

**What none of these checks is whether a finding is true** in the sense of naming a gap that is
really a gap. That is the question that matters most here, and it is the one the skipped eval was
going to ask.

## 7. What is not closed

Almost everything. This section is written before the piece exists rather than after, because the
most important fact about Supply is one a builder needs before the first line of code.

**This piece ships unmeasured, and that is a decision rather than an absence.** The owner ruled on
2026-08-07 not to build an eval for the model-knowledge finding. His reasoning, in his words:
building it is what *"full benchmark suites are for"*, he does not want to spend that effort, and
*"its not like we can do anything if the current models are insufficient."*

**The cost, recorded beside it rather than argued away.** The piece that carries the entire
authority of the feature will ship with no way to tell whether a finding is right, and no number to
point at when one feels wrong. There is no measurement of how often Supply names a gap that is
really a gap, and no threshold on that which could ever fail. The two structural guarantees the repo
used to have are both gone here: the old Law 2 made a confident falsehood impossible to display, and
Compare's set arithmetic made an omission certain — certain because the set it differenced against
was grounded in a document, which is the half the pivot took. What is left of the second is the
absence property in section 6, which keeps the arithmetic and loses the grounding. It can still say
that a finding names something the explanation already contains; it can no longer say that the
finding is true of the world. **That is a remnant and not a successor**, and the distinction is the
one ruling 1 was rewritten over.

**The rejected alternative, which is the thing a future reader will most want to know was
considered.** A cheaper, falsification-scale version was offered and declined: the owner marking
findings from his own explanations as real-gap or not-a-gap, on the grounds that he is the subject
expert on his own understanding. It needs no labelled corpus, no second annotator and no benchmark
suite, and it would have produced a precision figure on the one genre the product actually has. It
was declined for the reasons quoted above. It is recorded here so that nobody concludes the choice
was between a full benchmark suite and nothing.

**What the skip does not touch.** The within-sentence rate and the false-question rate score the
user's own explanation against hand marks on that same explanation, so neither ever depended on the
notes; vault eligibility is already done. None of the three measures this piece **as they are
currently written** — Cohere's set arithmetic never consulted a source, so nothing in that week as
scheduled says whether model knowledge names a real gap.

**But one instrument for this piece is a column away, and this section was wrong to say twice that
there was none. Corrected 2026-08-08.** The falsification week writes out fifteen to twenty
explanations with every causal link hand-marked, and the false-question rate already runs Extract
over exactly those explanations and scores its flags against exactly those hand marks — both under
*The falsification week* in [`../features/feynman.md`](../features/feynman.md), with the file format
in [`measurements/within-sentence/README.md`](../../measurements/within-sentence/README.md), which
is where a column would actually be added. Run Supply over the same explanations and record, per
finding, whether the hand marks show that link **was** stated. That is one more column on a table
somebody is already filling in.

It needs no subject expert, and that is the whole reason it is cheap. It does not ask *is this a
real gap in this person's understanding*, which is the question that needs one. It asks *did the
model name a gap the user actually filled*, and the hand marks answer that on their own. **Its
sample is whatever the week produces, and the week is small on purpose**: fifteen to twenty
explanations, one person, self-chosen topics, written out from memory and hand-marked by the same
person who wrote them. Two limits follow and neither is repairable by running it harder. It is a
number to look at rather than a benchmark, and it says nothing about anyone else. And the week's
explanations are *written* from memory while this product's genre is *spoken*, so the rate it
produces is a proxy on the axis Extract is most likely to differ on. Like every other number in that
week, its kill number would have to be written down before the run.

**This does not reopen the eval skip and is not offered as doing so.** It reaches one failure mode —
the false finding caused by an Extract miss, which is ruling 4's recorded cost and the failure named
at the end of this section. Precision on gaps that are genuinely real still has no cheap instrument
and no scheduled one, and the owner's decision stands as ruled. What is corrected here is only the
premise that **nothing** was measurable. Whether the column gets added is a scheduling question for
whoever runs the week; this file records that it is available and cheap, and claims nothing further.

**What this means for whoever builds it.** Build the properties in section 6, since they are cheap
and they are the only automated signal available; the absence property is the one of them that can
fail for a substantive reason rather than a structural one. Then hold two things in mind. The first
is that a green suite here means the piece is well-formed and says almost nothing about whether a
finding is right, so do not let a passing test read as a working feature. The second is that **most**
tuning decisions — the prompt, how much of the link set the model sees at once, whether a finding is
dropped or kept — will be made on somebody's impression. Not all of them: once the week has been
run, anything that moves the rate of findings the hand marks already answered is measurable by the
column above, and that is a genuine before-and-after on the failure this piece is likeliest to have.
Everything else is impression. Write down what you changed and why, because a changelog is the
closest thing to a paired regression protocol this piece will otherwise have.

**The mechanical check invariant 3 left behind lands here.** `AGENTS.md` names the hole: invariant
3 was the only invariant that was mechanically checkable and required a test, it is repealed, and
*"whatever governs when the model may speak from its own knowledge should be checkable the same way,
or the repo loses a check and will not notice."* Supply is the code path invariant 3 used to forbid.
If a replacement check is ever written, this is the module it will be written against. Nothing here
proposes one, deliberately — `AGENTS.md` says do not invent it in passing, and inventing it in the
same file that first names the piece would be the definition of in passing.

**Precision, not recall, is where this piece will fail.** Ruling 4 keeps the transcript out of
Supply's inputs, so a link the user did state and Extract missed looks to Supply like a gap. That
produces a finding that opens a gap which does not exist and then closes it with something the user
already knew, which is the failure Law 1 charges for. Stronger models do not obviously fix this:
`philosophy.md` and `AGENTS.md` both warn that a stronger model is a free pass on recall and not on
precision, because larger models are frequently more fluent and more confidently wrong. **This is
the one failure with an instrument**, in the narrow form described above: the hand marks say which
links were stated, so a column counts how often Supply names one of them. Section 6's absence
property catches the same shape of error one step earlier, against Extract's output rather than
against the hand marks, and therefore misses precisely the cases Extract dropped.

**To whoever specs Extract.** The `Link` type in section 2 is invented here, because Extract is
unbuilt and unspecced and there was nothing to import. It is provisional and it is not this file's
to own: when Extract gets a spec, that spec gives the shape, this declaration changes to match, and
`supply`'s second parameter changes with it. Two things in particular are guesses that a real
Extract may not honour — that a link carries exactly one `Anchor` rather than one per side, and that
`relation` is a free string rather than a closed set. Neither guess is defended here. Both are
recorded so that the next reader treats the signature as borrowed rather than agreed.

**A note back to Anchor's section 7.** `docs/specs/anchor.md` leaves open *"whether the default path
shows a citation at all now that the finding comes from the model"*, and says the answer sets
whether `resolveAnchor` runs on a display path or only on Extract's. This spec proposes an answer
for its own case and only its own case: `said` carries the user's own words back to them through
anchors, so `resolveAnchor` does run on a display path. The other half of Anchor's question — a
citation into *source* material — is untouched by this and stays open.

**Three things this spec deliberately does not do.** It does not give Supply a row in the build
order, which is [`../decisions.md`](../decisions.md)'s single-source job and would be a second copy
if written here. It does not decide what Contradict becomes, though ruling 7 depends on it. And it
does not touch the eval protocol in `AGENTS.md`, which correctly says the four-layer harness no
longer describes a finding and that no replacement should be improvised in the middle of a piece.
Each of those belongs to an owner, and this file is not it.
