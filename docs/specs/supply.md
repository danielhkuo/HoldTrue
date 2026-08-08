# Spec: Supply

> **Status: draft, nothing built, 2026-08-07.** Written the same evening the model-knowledge pivot
> landed, to fill the hole [`../features/feynman.md`](../features/feynman.md) names when it says the
> model surface is *"Extract, Contradict, and at least one unnamed piece that carries the whole
> authority of the feature."* This is that piece, named.
>
> It has **no row in the build order**, which is
> [`../decisions.md`](../decisions.md)'s to write and not this file's, and it has **no eval**, which
> is a decision rather than an omission — see section 7, and read it before building anything here.
>
> Sections 1 to 5 are written. Section 6 is a placeholder because the oracle step has not run.
> Section 7 is written early and out of order, against the usual rule that it closes a built piece,
> because the one thing a reader most needs to know about this piece is what nobody has measured
> about it.

## 1. What it does

Supply takes the topic the user chose and the causal links Extract pulled out of what they actually
said, asks model knowledge what the mechanism requires, and returns the link the mechanism has that
the explanation lacks — together with the sentence that closes it, the question that probes it, and
the identity of the model that produced all three. On the default path there is no document behind
any of this. The finding is the model's account of the subject, and Supply is where that account
enters the product.

**This is a new piece and not Compare with a different right-hand operand.** The question is worth
settling in the first paragraph because getting it wrong either duplicates a piece or overloads one.
Compare's contract was *"the link present in the source and absent from the explanation"*, and both
of its operands were link sets produced by the same extractor over text —
[#22](https://github.com/danielhkuo/HoldTrue/issues/22) established exactly that, so that Compare
could be set arithmetic and keep a property test. Three things break when the right-hand operand
becomes model knowledge, and each of them alone is enough. The operands stop being the same type: a
link from Extract carries an anchor into real text and a link the model holds carries nothing, so
deciding whether two of them are *the same link* stops being set membership and becomes a semantic
judgement. Compare's whole reason for living outside the model goes with it — the feature doc keeps
it separate so that *"the omission shown to the user is certain even though the extraction feeding
it is not"*, and certainty about set membership in a generated set is certainty about nothing.
And Law 1 lands here in a way it never landed on Compare: Compare returned an omission and the
answer came from the passage its output pointed at, whereas here there is no passage, so whatever
names the gap must also produce the sentence that closes it. That is a different job, not a
different argument. The full reasoning and the rejected alternative are ruling 1.

**What Compare keeps.** Everything. It is the retrieval path's piece, its reasoning is untouched,
and nothing here supersedes it. Two pieces now exist where one did, because there are two paths.

## 2. Public API

```ts
// src/feynman/supply.ts

import type { Anchor } from '../index/anchor'

/** One causal link as Extract emits it over the user's own explanation. The anchor points into
    the transcript and resolves through `src/index/anchor.ts`; see invariant 2 in section 4. */
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
oracle step cannot start until they are answered. Each carries a proposed answer and the
alternative it rejects, because a bare question is more work for the person ruling than a wrong
proposal is.

### 1. This is a new piece, not Compare with a different right-hand operand. OPEN.

**Proposed:** a new piece, named Supply, with the contract in sections 1 and 2. Compare is
untouched and stays scoped to the optional retrieval path.

**Rejected: keeping Compare and swapping its operand** — a new upstream step produces an unanchored
link set for the topic from model knowledge, and Compare performs `modelLinks \ explanationLinks` as
before. This is the reading worth taking seriously, because it preserves a built-and-reasoned
design and adds only one small piece. It is rejected on three grounds, each sufficient.

The operands are not commensurable. Under #22 both sides came from one extractor over text, so *is
this the same link* was a decidable predicate over comparable tokens and Compare kept its property
test. One side is now unanchored propositions from a model and the other is anchored spans into
speech, and matching them requires paraphrase-tolerant identity, which is a model judgement wearing
set notation.

The determinism becomes decorative. Compare sits outside the model so that *"the omission shown to
the user is certain even though the extraction feeding it is not"*, and that certainty was real
because the right-hand side was grounded in a document. A true set difference over a generated set
is certain about set membership and about nothing else, so the authority moves entirely upstream
and the arithmetic stops earning its seam.

Splitting buys no testability, which is the point that decides it. The attraction of the split is
that it keeps one deterministic, property-tested piece. But the producer has no gold standard —
that is what the eval lost — and the differ's output is trivially correct given its inputs. Two
pieces, neither measurable on the thing that matters, instead of one that is honestly labelled as
unmeasured. A builder may still implement Supply with an internal comparison stage; that is
implementation, and it is not a contract seam.

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
because it is the failure this piece is most likely to have and the one nothing currently measures.

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

## 6. Hard cases the property test generator must produce

**Placeholder. Nothing goes here yet, and the reason is not that nobody has got round to it.**

Under `/holdtrue-workflow` this section is written at the oracle step, and the human writes the
oracle. For a model-dependent piece the oracle step is replaced by the eval branch, and **the eval
for this piece was skipped by decision on 2026-08-07** — see section 7, which is where that decision
and its cost are recorded.

What would go here if it is ever written: the falsifiable properties that survive the loss of gold
labels, which are the first two of the four layers `AGENTS.md` specifies for a model step — schema
validation, and the invariants expressed as properties. For this piece those are that every anchor
in `said` resolves against the transcript it came from, that no `Finding` carries an empty `repair`
or an empty `probe`, that no `Finding` lacks an attribution, and that an empty link set in produces
`none` out. Those are cheap, they are real, and they check that the piece is well-formed. **None of
them checks whether the finding is true**, which is the only question that matters here and the one
the skipped eval was going to ask.

## 7. What is not closed

Almost everything. This section is written before the piece exists rather than after, because the
most important fact about Supply is one a builder needs before the first line of code.

**This piece ships unmeasured, and that is a decision rather than an absence.** The owner ruled on
2026-08-07 not to build an eval for the model-knowledge finding. His reasoning, in his words:
building it is what *"full benchmark suites are for"*, he does not want to spend that effort, and
*"its not like we can do anything if the current models are insufficient."*

**The cost, recorded beside it rather than argued away.** The piece that carries the entire
authority of the feature will ship with no way to tell whether it works and no number to point at
when a finding feels wrong. There is no measurement of how often Supply names a gap that is really a
gap, no baseline to regress against when a prompt changes, and no threshold that could ever fail.
The two structural guarantees the repo used to have are both gone here: the old Law 2 made a
confident falsehood impossible to display, and Compare's set arithmetic made an omission certain.
Neither has a successor on this path, and now neither does the measurement that was going to stand
in for them.

**The rejected alternative, which is the thing a future reader will most want to know was
considered.** A cheaper, falsification-scale version was offered and declined: the owner marking
findings from his own explanations as real-gap or not-a-gap, on the grounds that he is the subject
expert on his own understanding. It needs no labelled corpus, no second annotator and no benchmark
suite, and it would have produced a precision figure on the one genre the product actually has. It
was declined for the reasons quoted above. It is recorded here so that nobody concludes the choice
was between a full benchmark suite and nothing.

**What the skip does not touch.** The three falsification-week measurements all survive and are
still scheduled. The within-sentence rate and the false-question rate score the user's own
explanation against hand marks on that same explanation, so neither ever depended on the notes, and
vault eligibility is already done. **None of the three measures this piece.** Cohere's set
arithmetic never consulted a source, so nothing in that week says whether model knowledge names a
real gap.

**What this means for whoever builds it.** Build the well-formedness properties in section 6, since
they are cheap and they are the only automated signal available. Then hold two things in mind. The
first is that a green suite here means the piece is well-formed and says nothing about whether it is
right, so do not let a passing test read as a working feature. The second is that every tuning
decision — the prompt, how much of the link set the model sees at once, whether a finding is
dropped or kept — will be made on somebody's impression, because there is no instrument. Write down
what you changed and why, because a changelog is the closest thing to a paired regression protocol
this piece will have.

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
precision, because larger models are frequently more fluent and more confidently wrong.

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
