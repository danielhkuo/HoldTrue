# Measurement: the within-sentence rate

Build order step 0, first of the three falsification measurements. About a day, no application
code. Reasoning in [`docs/features/feynman.md`](../../docs/features/feynman.md).

## What this measures and why it can end the project

Invariant 8 mandates that extraction runs per sentence, never one-shot over a whole explanation.
So whatever fraction of your causal links sit inside a single sentence is the **hard ceiling on
everything Extract can ever see**. A link split across a sentence boundary — *"the pressure drops.
So the valve opens"* — is structurally invisible to a per-sentence extractor, and no better model
fixes that.

**Nobody has published this number for spoken, from-memory explanation by a learner.** What is
published is written text, and it does not agree with itself. The share of annotated causal links
that sit inside one sentence is **31%** in news — EventStoryLine marks 1,770 within-sentence causal
pairs against 3,885 across — and **97%** in PubMedCausal (arXiv:2605.28363), 6,491 pairs drawn from
PubMed abstracts that were keyword-filtered for causality, which makes the corpus 96.9%
intra-sentential by construction. A threefold swing between two genres of edited writing, and
speech is neither of them. So the literature is clear that you have to measure this and silent on
what you will find.

This is a fact about how you explain things, not about the model. That is why it is measured
before anything is built on top of it, and why an agent cannot produce the data.

## The kill number, and why it is under review

**The standing line is still below 60%**: under that, invariant 8 needs renegotiating rather than
obeying. It was fixed before any data existed, which is the part that matters and the part that is
not changing.

**What is happening here is a revision of a threshold whose premise was falsified, made before a
single explanation has been written.** That is legitimate. Adjusting a threshold after seeing a
result is not, and nothing below licenses it — a line chosen after the fact, by the person who
wants the feature to exist, is not a gate. The distinction is the whole discipline, so say in
writing which of the two you are doing, and date it.

The falsified premise: 60% was chosen when extraction across a sentence boundary looked hopeless,
so the within-sentence share was very nearly the whole of what Extract could ever recover and the
line only asked how much of your explanation you were willing to lose. Cross-sentence extraction
is not hopeless, only worse. On EventStoryLine — news text, causal relation extraction — the five
published systems that score between 52.1 and 66.2 F1 on links inside a sentence still score
between 32.6 and 48.3 on links across one, a gap of roughly a third rather than the collapse the
old figure described. Obeying invariant 8 therefore gives up links a wider read would have caught,
which is a higher cost than 60% was priced against.

**No defensible replacement number follows from that correction, so the choice is the owner's, and
it has to be made before the first file lands in `explanations/`.** Three options, none free:

1. **Keep 60%**, re-justified as a product judgement rather than a figure derived from the
   literature: below it, two of every five links you assert are invisible to Extract. Cheapest,
   and honest so long as it is labelled a judgement.
2. **Raise it, to somewhere around 75–80%**, on the correction above: per-sentence extraction now
   forgoes recoverable links rather than unrecoverable ones, so the bar for *per-sentence is fine*
   should sit higher than it did when the alternative looked futile.
3. **Retire the kill number from this measurement** and move the gate to the false-question rate,
   which watches the failure happen instead of predicting it from a ceiling. This measurement
   stays either way, as the thing that sizes that ceiling.

`rate.mjs` still reports against 60% and says on every run that the line is under review. The
moment an explanation exists the number is frozen, whichever one it is.

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
stratum needs. `AGENTS.md` sizes the full set at 100–150 items, of which **30 must be labelled
completely cold** — no agent, no suggestions on screen — as the control that tells you whether
agent-proposed labels can be trusted for the rest. Treat these as part of that 30.

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
