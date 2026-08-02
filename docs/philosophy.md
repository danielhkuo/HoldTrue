# HoldTrue: core philosophy

> The law every feature obeys. Feature-specific philosophy lives in
> [`features/`](features/). Evidence lives in
> [`research/evidence-base.md`](research/evidence-base.md) and nothing here may contradict
> it. Where a feature doc conflicts with this one, this one wins.

HoldTrue is a study application that runs on your machine, against your own material, with
a local model or your own API key. Nothing leaves the device unless you turn something on.

There are two laws. Both are short, because they have to be applied to every feature.

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

## Law 2. Nothing is asserted on the machine's authority

**Every sentence traces to the user, to a quoted passage in their material, or to plain
code.** "The model generated it" is not a provenance.

**During elicitation, knowledge may only silence.** While the user is answering, what the
model knows about the world may make it hold back, soften, or decline to judge. Knowledge
may never make it speak. There is no path from belief to utterance.

**At repair, it must speak, and only as a conduit.** It states the missing thing from a
named, attributable source, and it does not paraphrase that source into its own words. The
user sees who said it.

Consequences:

- **`confidence` is brake pressure, not belief.** It means *how strong is my reason to stay
  quiet*. A value that can only reduce output during elicitation cannot produce a confident
  wrong correction. No code path may branch *toward* speech on a knowledge value during
  elicitation. This is mechanically checkable and must be a test.
- **The model classifies; it never authors.** Text reaching the user is an index into owned
  content, or it is quarantined.
- **A persona may ask. It may never assert.** Questions are not assertions, so a character
  can elicit. The repair arrives in a different, attributed register, and it has to, because
  a naive listener cannot supply a correct answer and Law 1 requires one.

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

One claim we hold firmly despite thin support: **closing a surfaced gap**. The supporting
studies converge, but several are individually weak. We hold it because the error cost is
asymmetric. Closing a gap unnecessarily wastes a paragraph. Leaving one open may teach a
falsehood.
