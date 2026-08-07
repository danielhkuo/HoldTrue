# HoldTrue: core philosophy

> The law every feature obeys. Feature-specific philosophy lives in
> [`features/`](features/). Evidence lives in
> [`research/evidence-base.md`](research/evidence-base.md) and nothing here may contradict
> it. Where a feature doc conflicts with this one, this one wins.

HoldTrue is a study application that runs on your machine, with a local model or your own
API key. Nothing leaves the device unless you turn something on.

There are two laws. Each is stated in a sentence, because it has to be applied to every
feature. Law 2 was repealed and replaced on 2026-08-07, and it carries the record of what
it used to say, since that is the only way to see what the replacement costs.

---

## Law 1. We close what we open

**Anything that asks the user a question must also supply the answer.** A gap surfaced and
left unfixed is worse than a gap never surfaced.

This is not a preference, and it is not a claim about one feature. It comes from two
unrelated literatures. Errors elicited and left uncorrected tend to be acquired as false
knowledge, and there is virtually no benefit from feedback that omits the correct answer.
The evidence base flags that the error-acquisition finding was measured on externally
presented lures rather than self-generated gaps, so applying it here is an inference.
Separately, retrieval practice with no feedback, below ~50% success, has an effect size of
**0.03**, which is nothing. Above 75% it is 0.56. Feedback is the mechanism, not a
courtesy.

Three consequences bind every feature:

- **Correct by refutation, not by exposition.** Name what the user said, *then* name the
  thing they missed. Presenting correct information without engaging the error does not
  work. The emphasis on the error is what makes it work.
- **Phrase findings at the task, never the person.** "Your explanation had no machinery
  underneath it" is forbidden. "You said pressure drives flow but not how the gradient is
  generated. That step is X" is the form. Within the feedback literature, person-directed
  feedback is the direction measured as making performance *worse*.
- **No grade sits beside a diagnosis.** Grades and comments together produce no gain where
  comments alone produce large ones. Separately, the EU AI Act's high-risk annex covers
  systems intended to evaluate learning outcomes, so not producing a grade is what keeps the
  practice positioning available.

Law 1 survives the repeal below entire, and it binds harder for it. It never depended on
where the answer came from — the evidence is about feedback *containing* the correct
answer, not about who wrote that answer. What changed is that the repair used to be a
passage the user could go and read for themselves, and now it is the model's own sentence.
Law 1 is the only rule left that requires the sentence to be there at all. A feature that
surfaces a gap and stops is a worse failure today than it was yesterday, not a lesser one.

## Law 2. Nothing is asserted anonymously

### The law this replaces

~~**Nothing is asserted on the machine's authority.** Every sentence traces to the user, to
a quoted passage in their material, or to plain code. Knowledge may only silence during
elicitation; at repair the model speaks only as a conduit from a named source; it
classifies but never authors; a persona may ask, it may never assert.~~ **REPEALED
2026-08-07.**

This is kept rather than deleted because a future reader has to be able to see what was
given up. What the old law bought was that hallucination was *structurally* impossible. If
every sentence reaching a user is the user's own words, a verbatim quote, or a codebase
string, then a confident falsehood has no route to the screen at all — span anchoring
turned it into a validation failure, which is a class of bug you can write a failing test
for. That is a strong property and nothing here gets it back.

Why it went: generating the finding out of the user's own notes produced a worse finding
than a capable model answering from what it already knows, so the constraint was buying
provenance at the price of the thing the product exists to do. The owner's ruling is that
the finding now comes from model knowledge, and that choosing a model equal to that is the
user's responsibility: *"it's the user's failure to not use an appropriate model."* The old
reasoning was never refuted. The cost is accepted, not argued away. The opening sentence of
this file lost *against your own material* on the same ruling.

### The law now

**The model may assert on its own authority, so that authority has to be visible.** "The
model generated it" is now a provenance — it is the only one on the default path — which is
exactly why it must be stated rather than assumed. Which model produced a finding, and what
that model was calibrated against, are properties the user is entitled to see.

**Capability is the guard, and the user owns the choice.** There is no layer underneath the
model that will catch a wrong finding, because that layer was the old Law 2. A model too
weak for the work produces a wrong finding and ships it in the same voice as a right one.
This is an open-source tool running on the user's hardware with the user's model, so the
choice is theirs to make and theirs to get wrong. That position is only honest if the app
makes the choice legible, which is what the rest of this law is for.

**We calibrate against the weakest configuration we support, and we say what it is.**
Local-first is untouched, so the floor is the best model a real machine can hold while
running everything else: on 36 GB of unified memory, sharing with a `whisper-server`
sidecar and Electron, that is roughly a 27–32B-class model at 4-bit, around 20 GB resident.
Read that as arithmetic on a memory budget and nothing more. It is not a benchmark, no
model name is blessed by it, and no figure in this paragraph has been measured. A stronger
model should clear a weaker model's bar on **recall** — it will find what the smaller one
found. Do not extend that to **precision**. Larger models are often more fluent and more
confidently wrong, and precision is the axis Law 1 charges for. A cloud key is therefore
not a free pass, and "we calibrated the local floor" is not a claim about a frontier
model's false positives.

**Running below the floor is a supported-configuration question, not a silent quality
drop.** If the user points the app at something smaller than we calibrated against, the app
says so and treats the configuration as unsupported. It does not quietly produce weaker
findings in the same confident register. A degradation the user cannot see is one they
cannot correct for.

**What we gave up, said plainly.** The old law made a false statement impossible. This one
makes it unlikely. That is a real reduction in what we can promise and calibration does not
convert it back: a probabilistic guarantee has no bright line, no validation failure, and
no test that goes red the moment it breaks. This file will not describe it as anything
stronger than it is. A law that pretends to give back what it cannot is worse than one that
admits the trade.

Rejected: **keeping notes-only** — that is what was repealed, and the reason is above.
**Requiring a frontier cloud model** — it would break local-first, which survives
explicitly. **Retrieval to a trusted source as the default** — it stays available as an
optional hook for a user who already has that setup; by default the source is model
knowledge only. **A second model checking the first** — already rejected for the eval, and
nothing here revisits it; if it returns it returns as a decision with a reason, in
[`decisions.md`](decisions.md).

### What this law leaves open

Named here so they are not mistaken for settled.

**Invariant 3 has no successor.** *No code path branches toward speech on a domain-knowledge
value during elicitation* was mechanically checkable and carried a required test. Under this
law, knowledge is precisely what makes the model speak, so the check as written is gone and
nothing has replaced it. The repo is one check lighter than it was and will not feel the
loss until something wrong ships. What the new mechanical check is has not been decided.

**`confidence` as brake pressure is unargued, not wrong.** Invariant 4 — *how strong is my
reason to stay quiet* — was a consequence of "knowledge may only silence." That premise is
gone. The practice may well still be right, since a value that can only suppress cannot
manufacture a confident wrong correction, but it is now a preference rather than a
derivation. It is marked for review: neither kept silently nor deleted.

**"Calibrated against" has no procedure yet.** This law requires the app to state what the
model was calibrated against, and the ground truth the old eval used was spans into the
user's own text, which went out with Law 2. Nothing in this section should be read as
claiming that calibration currently exists.

---

## The evidence gate

The gate covers **claims about learning**: how people study, what helps them, what the
evidence supports. If such a claim is not in
[`research/evidence-base.md`](research/evidence-base.md), it does not appear in the product,
the README, or a design doc. If it is marked REFUTED there, it gets deleted wherever it
appears. Refuted material stays visible in that file rather than being quietly removed.

Engineering measurements are a separate category and are not gated here. Benchmark figures
for model accuracy, latency or power live with the decision they justify, in
[`decisions.md`](decisions.md) or the relevant feature doc, and carry their source there.
That category carries more weight than it used to. With capability as the guard under Law
2, a figure about what a model can do is holding up an argument that a quoted span used to
hold up on its own. The gate does not move to cover it, but an uncited accuracy number is
now load-bearing and worthless at the same time.

## What we refuse to build

These are popular study features that the evidence does not support. Each absence is
deliberate.

**Highlighting, rereading and summarizing.** All three are rated low utility, and
highlighting may actively hurt on tasks requiring inference.

**Expanding intervals.** This is the premise of every spaced-repetition app. Measured
against plain uniform spacing it comes out at g = 0.034, and no trial shows that SM-2 or
FSRS improves *learning*.

**Learner-driven scheduling.** 78% of people learn better with spacing, and 78% believe
massing is as good or better.

"Refuse" means we did not build an affordance for it, not that we claim it is useless. A
large meta-analysis contradicts several of these rankings; see the evidence base.

## What we do not claim

Education research replicates poorly. These are the claims we are *not* making.

We do not claim that understanding is connections rather than facts. That is a false
dichotomy. We do not claim that explaining calibrates better than self-testing. Measured
against each other, they tie. We do not claim that people mistake part-names for causal
understanding. That was tested and came out null. We do not claim that speaking reveals
more than writing. There is no support for it. We do not claim that asking beats telling.
The direct experiment is an underpowered null, so the honest statement is that nobody has
shown it. We do not claim that our diagnosis is a measurement. It is not, which is why
there is no score.

That last one matters more since Law 2 was repealed, not less. When a finding pointed at a
passage in the user's own material, the user could go and check it. Now the finding is the
model's opinion about their understanding, produced by a model whose precision on this task
nobody has measured. The absence of a score is the only thing keeping that opinion from
reading as a verdict.

One claim we hold firmly despite thin support: **closing a surfaced gap**. The supporting
studies converge, but several are individually weak. We hold it because the error cost is
asymmetric. Closing a gap unnecessarily wastes a paragraph. Leaving one open may teach a
falsehood.
