# Measurement: the within-sentence rate

> **Deleted documents.** This file names `philosophy.md`, `decisions.md`, the `specs/` folder and the
> `features/` folder. The owner deleted the old versions on 2026-08-19. A name is a historical
> reference and not a link. `docs/decisions.md` records the deletion.

Build order step 0, first of the three falsification measurements. About a day, no application
code. Reasoning in `docs/features/feynman.md`.

> **This measurement survives the model-knowledge pivot of 2026-08-07 and still has to be run.**
> Extract still reads the user's own explanation, and invariant 8 still says it reads it one
> sentence at a time, so the question this file asks is unchanged. Three things around it moved:
> what the ceiling bounds, the model floor, and where the labels go. Each is marked below.

## What this measures and why it can end the project

Invariant 8 mandates that extraction runs per sentence, never one-shot over a whole explanation.
So whatever fraction of your causal links sit inside a single sentence is the **hard ceiling on
everything Extract can ever see**. A link split across a sentence boundary — *"the pressure drops.
So the valve opens"* — is structurally invisible to a per-sentence extractor, and no better model
fixes that.

**What that ceiling bounds, corrected 2026-08-07.** It still bounds Extract, for the reason just
given, and that part needs no revision. What this file used to be able to add is that the ceiling
bounded the *finding* as well, because a finding was made by comparing the links Extract pulled
out of your explanation against the links in your own notes: a link Extract could not see was a
comparison that could not happen. The model-knowledge pivot removed the notes from the default
path. The counterpart now comes from the model's own knowledge, and Compare — the piece that did
that comparison — has no subject there. So the ceiling is a ceiling on the extracted link set,
and **what that link set is for on the default path is open**, owned by
`docs/features/feynman.md` and not answered here. The count is
the same count either way, which is why it still runs first.

**Nobody has published this number for spoken, from-memory explanation by a learner.** What is
published is written text, and it does not agree with itself. The share of annotated causal links
that sit inside one sentence is about **32%** in news — EventStoryLine, 258 documents, 1,751
within-sentence causal pairs against 3,727 across — and **96.9%** in PubMedCausal, whose 6,491
adjudicated pairs come from PubMed abstracts keyword-filtered for causality, which makes the corpus
intra-sentential by construction. A threefold swing between two genres of edited writing, and
speech is neither of them. So the literature is clear that you have to measure this and silent on
what you will find.

Both figures, their metrics and their sample sizes live once in
[`docs/research/extraction-benchmarks.md`](../../docs/research/extraction-benchmarks.md); this
paragraph cites, it does not hold the provenance. Corrected there on 2026-08-07: the widely
circulated EventStoryLine counts of 1,770 against 3,885, which this file used to quote, are
second-hand and give the same ratio as the verified 1,751 against 3,727.

This is a fact about how you explain things, not about the model. That is why it is measured
before anything is built on top of it, and why an agent cannot produce the data.

> **SPENT 2026-08-19.** The pivot in [`../../docs/decisions.md`](../../docs/decisions.md) — *The
> child is the product, and determinism returns as prompt material* — took per-sentence extraction
> off the default path. This section measures a dormant pipeline. The line below is **not moved and
> not repealed**; it was fixed before any data and it returns unchanged if the pipeline does.

## The kill number — RULED 2026-08-16: below 75%

**The line is below 75%**: under that, invariant 8 needs renegotiating rather than obeying. It was
~~60%~~ and it moved once, on 2026-08-16, before a single explanation existed. **It is frozen
now.**

**Which of the two acts that was, stated in writing because this section demands it.** It is a
revision of a threshold whose premise was falsified, made before any data. That is legitimate.
Adjusting a threshold after seeing a result is not, and nothing below licenses it — a line chosen
after the fact, by the person who wants the feature to exist, is not a gate. The distinction is
the whole discipline. The first file in `explanations/` closes this section permanently.

The falsified premise: 60% was chosen when extraction across a sentence boundary looked hopeless,
so the within-sentence share was very nearly the whole of what Extract could ever recover and the
line only asked how much of your explanation you were willing to lose. Cross-sentence extraction
is not hopeless, only worse. On EventStoryLine — news text, causal relation extraction — the five
published systems that score between 52.1 and 66.2 F1 on links inside a sentence still score
between 32.6 and 48.3 on links across one, a gap of roughly a third rather than the collapse the
old figure described. (Sources and sample sizes in
[`docs/research/extraction-benchmarks.md`](../../docs/research/extraction-benchmarks.md), which
also records that reproductions of those baselines vary by about ±5 F1. They are supervised
BERT-class systems on news; nothing here was measured on speech.) Obeying invariant 8 therefore
gives up links a wider read would have caught, which is a higher cost than 60% was priced against.

**The ruling: 75%.** The reason is the asymmetry, not the digit, and the digit is admitted to be a
judgement — 75 has no more derivation from the literature than 60 had, because a share that swings
32%–97% by genre implies nothing about this one.

The asymmetry carries it. Set the line too low and you measure 62%, obey invariant 8, and lose
four links in every ten permanently and silently: no later run tells you they were there. Set it
too high and you measure 70%, renegotiate, and take the widening option that is already written
down in [`../../docs/decisions.md`](../../docs/decisions.md) — hand the model a window of
surrounding sentences while it still emits one link set per sentence, so the schema, the anchors
and Compare's set arithmetic are all unchanged. One failure is permanent and invisible. The other
costs building a thing somebody has already designed. **A gate whose consequence is cheap should
sit high.**

**Rejected, and both were live.** *Keep 60%, relabelled a product judgement* — cheapest and
honest, and it prices per-sentence extraction as though the links it forgoes were unrecoverable,
which the correction above shows they are not. *Retire the number here and move the gate to the
false-question rate* — that instrument watches the failure happen instead of predicting it from a
ceiling, which is genuinely better, and it leaves this measurement with no gate at all during the
window when it is the only one that has run. Neither is refuted. Both stay on the record.

`rate.mjs` reports against 75% from this ruling. **The moment an explanation exists the number is
frozen.**

## The false-question rate: four kill numbers and how to score it

**Proposed by an agent on 2026-08-12 and accepted by the owner the same day.** Not owner-authored,
and the distinction is kept because this file demands it two sections up. **Every number below was
guessed blind, before a single explanation exists.** That is the legitimate direction — a threshold
fixed before data. A number moved after seeing a result is the other thing, and nothing here
licenses it.

**What the rate is.** You write an explanation and mark every causal link in it by hand. Those marks
are the truth, because you wrote it. Then Extract runs, then Cohere. Cohere raises **flags** —
places where your chain does not close. A flag on something you *did* explain is a **false
question**: the child asks you about a step you already covered.

**Four kinds, so four numbers.** One combined figure hides a bad branch behind three good ones, or
condemns three good branches for one bad one. `docs/specs/cohere.md`
section 2 fixes the list, and changing that list changes what this measures.

| Kind | What a false one costs you | Kill above |
|---|---|---|
| **rootless** — you named it and never said what makes it happen | one wasted round trip | **50%** |
| **dangling** — you named it and never said what it does | one wasted round trip | **50%** |
| **unlinkedPair** — two things linked to a third, never to each other | the child *guesses*, so it asserts; that is a plant and the ledger owes a closure on it | **25%** |
| **conflict** — two of your links disagree | the child says you contradicted yourself, which is the closest this design comes to telling rather than asking | **10%** |

**The ladder is the argument, not the digits.** They are ordered by what being wrong costs, not by
how often each fires. And 50% rather than something stricter because
[`../../docs/transcripts/`](../../docs/transcripts/) shows real children asking off-target questions
constantly and reading as children rather than as broken machines. Below half, a dud reads like a
child not following. Above half, the *typical* question is a dud and the child stops being a
listener.

**These numbers depend on one unruled thing.** `cohere.md` ruling 2 proposes that the two ends of a
chain are not gaps. If termini stay flagged, every explanation starts with two false flags on
`dangling` and `rootless` whatever Extract does, and 50% is unreachable by construction. **Rule 2
first, or these four numbers mean nothing.**

### How a flag is scored against a hand mark

Mechanical, not by eye. A flag is **false** when a mark contradicts what it claims:

- `rootless C` is false if any mark has **C as its effect** — something does cause it.
- `dangling C` is false if any mark has **C as its cause** — it does do something.
- `unlinkedPair A,B` is false if any mark links **A→B** or **B→A**.
- `conflict` is false if both links are in your marks and they do not actually disagree.

That leaves one question: is the flag's phrase the same concept as the mark's endpoint?

**Do not answer it with Cohere's own matcher.** If you do, a matcher defect hides itself: Cohere
fails to see that *the flapper lifting* and *the flapper lifts* are one thing, raises a flag, and a
scorer using the same rule fails identically and calls the flag correct. **The score flatters the
bug.**

So score with a **more generous** matcher, and give every flag **three** outcomes rather than two:

1. **True question** — no mark contradicts it.
2. **False question** — a mark contradicts it under both matchers.
3. **Matcher disagreement** — the generous matcher found the mark and Cohere's did not.

**That third bucket is the whole cost of `cohere.md` ruling 6, made visible.** Large, and the shared
stemmer is worth building properly. Near zero, and it can wait. With two buckets nobody would ever
find out.

## The model floor moved, and the ceiling did not

Also on 2026-08-07: the extraction model is no longer a 4B one. The stack table's *Qwen3.5 4B or
larger* row is superseded, and the floor is now the best model the owner's machine will run —
roughly a 27–32B-class model at 4-bit, about 20 GB resident, sharing 36 GB with a speech sidecar
and Electron. That envelope is the owner's statement of what fits, not a measurement, and
`AGENTS.md` holds it with that caveat; nothing below rests on the exact figure. Three things
follow for reading this file.

**The ceiling is untouched.** It is structural, not a question of capability: a per-sentence
extractor cannot see a link whose cause and effect are in different sentences, however good the
model is. That sentence was written against a 4B extractor and is exactly as true against a 32B
one. This is the reason the measurement did not move with the model.

**Any expectation of extraction *quality* on this page is now stale in both directions.** The
figures quoted above are supervised systems on edited news, and the model that will actually run
here is roughly an order of magnitude larger than the one the old floor named — so those figures
were never the right genre and are now not the right model size either. Do not read them as a
forecast of what your explanations will yield. They are here to show that cross-sentence
extraction degrades rather than collapses, and that is all they are here for.

**The reason the old floor gave has gone with it.** *"Causal extraction collapses below 3B"* was
uncited when it was written and is uncited now. It is simply moot: nothing anywhere near 3B is on
the table any more, so the claim no longer decides anything. Recording that so nobody goes looking
for the citation later.

## What you do

**1. Pick 15–20 things you actually understand that work by a mechanism.**

Mechanisms only. The eligibility boundary has numbers behind it: the illusion of explanatory depth
measures .918 for devices and .860 for natural phenomena, but .291 for facts and **−.173 for
procedures** — negative, meaning explaining a procedure slightly *increases* confidence. Candidate
list at the bottom of this file.

**2. Write each one out from memory, into `explanations/<slug>.md`.**

A paragraph or two. **Do not look anything up.** The moment you check a source, that item is
contaminated and has to be dropped — the measurement is about recall under load, and consulting a
source turns it into transcription.

**3. Mark every causal link, sorting it into one of the two lists.**

A link needs three parts: a cause, an effect, and the relation between them. Put it under
*within one sentence* when all three sit in one sentence, and under *split across sentences* when
they do not.

**Every split link also carries two tags**, in brackets at the end of its line. They cost nothing
while you are already looking at the pair of sentences, and between them they replace every
newswire statistic quoted above with the distribution that actually applies to you.

- `connective` or `no connective` — does the sentence carrying the *effect* open with a causal
  connective? *So*, *therefore*, *because of that*, *which means*, *as a result*. Sentence-initial
  only; one buried mid-sentence does not count.
- `adjacent` or `earlier` — is the cause in the immediately preceding sentence, or further back?

Order and case do not matter, but both tags must be present or the link is reported as unmarked.
The connective tag bounds any rule keyed on a sentence-initial connective; the distance tag bounds
any widening of what Extract reads, since a two-sentence window is only worth costing out if the
links are mostly `adjacent`.

**4. Run the count.**

```
node measurements/within-sentence/rate.mjs
```

## The file format

Both headings must be present in every file even when one list is empty, or the file is skipped
as malformed and reported rather than silently miscounted.

```markdown
# How a heat pump moves heat against a gradient

<your explanation, written from memory, in prose>

## Links — within one sentence

- refrigerant expands → its temperature drops
- compressor raises pressure → refrigerant condenses

## Links — split across sentences

- outdoor coil absorbs heat → indoor coil releases it [no connective, earlier]
- pressure drops → valve opens [connective, adjacent]
```

The arrow is decoration. Nothing parses the link text — only which list it is in, and the two tags
on the split ones — so write whatever shorthand reads clearly to you later.

## Where this goes next

These explanations are not throwaway. They become the first 15–20 items of the learner-prose
stratum of Extract's evaluation set, and the links you marked here are most of the labelling that
stratum needs. `AGENTS.md` sizes the full set at 100–150 items; the cold-labelling control —
**30 items labelled with no agent and no suggestions on screen**, as the check on whether
agent-proposed labels can be trusted for the rest — is in
[`/holdtrue-workflow`](../../.claude/skills/holdtrue-workflow/SKILL.md) under *the model-dependent
piece*, not in `AGENTS.md`, which this file said until 2026-08-07. Treat these as part of that 30.

**What the pivot did and did not do to that.** The labels you produce here are spans into your own
explanation, so they still have a ground truth, and so does Extract's eval set: *did the extractor
find the causal link that is sitting in this sentence* is answered by the text in front of you,
and no source material was ever needed to answer it. What lost its ground truth on 2026-08-07 is
the step after extraction — whether a finding names a real gap in someone's understanding — which
the user's notes used to authorise and which now has no authority short of a subject expert per
case. That is open, it is not this measurement's to answer, and it is not a reason to stop
labelling.

## Candidate mechanisms

Cross off anything you could not explain cold. Picking from a list is not contamination; you are
still the one who knows what is in your head.

**Engineered**

1. How a heat pump moves heat against a temperature gradient
2. How a four-stroke engine turns fuel into rotation
3. How TCP congestion control backs off under packet loss
4. How a transformer steps voltage up or down
5. How noise-cancelling headphones cancel sound
6. How DNS resolves a name to an address
7. How a refrigerator's compressor cycle works
8. How a differential lets two wheels turn at different speeds
9. How TLS establishes a shared secret over an open channel
10. How a reactor controls its own reaction rate
11. How a tracing garbage collector decides an object is unreachable
12. How a MOSFET switches
13. How an induction cooktop heats a pan
14. How a B-tree index turns a scan into a lookup
15. How a hard drive's read head detects a bit

**Natural**

16. How the kidney regulates blood pressure
17. How photosynthesis turns light into stored chemical energy
18. Why the sky is blue and sunsets are red
19. How a hurricane intensifies over warm water
20. How antibiotic resistance spreads through a population
21. How the greenhouse effect warms the surface
22. How muscle contraction works at the filament level
23. Why ice floats, and what that does to a lake in winter
24. How a fever is produced, and what it is for
25. How stress at a fault produces an earthquake
26. How insulin regulates blood glucose
27. How sound becomes a nerve signal in the ear
28. Why a spinning top does not fall over
29. How a vaccine produces lasting immunity
30. How evaporative cooling lowers a temperature
