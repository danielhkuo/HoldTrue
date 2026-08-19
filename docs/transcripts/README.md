# Generated transcripts

18 conversations in which an adult explains a mechanism out loud, from memory, to a curious child.
Written 2026-08-10 by model agents that were given a topic, a note on the explainer's style, and
nothing else. None of them saw this repo, the Feynman design, or any part of the piece
decomposition. That blindness is the point: a transcript written against the design would only
contain moves the design already handles.

They exist to answer one question — **what does a real child actually say?** — and they are what
[`../specs/child-speech.md`](../specs/child-speech.md) was designed against. Its tiers 2 and 3
read these files.

## What they are not

**Not a measurement.** The disfluency in them is *written* disfluency. Real speech through an
engine running 15–25% word error looks different: dropped words, wrong homophones, no sentence
boundaries. Nothing about how *often* a move appears here transfers.

**Not a substitute for the falsification week.** That week needs your own explanations, written
from memory on topics you chose, with every causal link marked by hand. See
[`../../measurements/within-sentence/README.md`](../../measurements/within-sentence/README.md).
These are somebody else's idea of how somebody else talks.

**Not evidence about learning.** Nothing here goes near the evidence gate in
[`../philosophy.md`](../philosophy.md).

## The set

| File | Topic | What the explainer was told to do |
|---|---|---|
| `round-1.md` | Toilet flush | Ordinary, imperfect |
| | Hurricane | Reaches for half-remembered technical words |
| | Refrigerator | Names parts confidently, vague on mechanism |
| | Vaccines | Leans on an analogy the child takes literally |
| | Greenhouse effect | Gets part of it genuinely wrong |
| | Car engine | Tells it out of order, doubles back |
| | Noise-cancelling headphones | Child keeps testing with own examples |
| | Long division | Boundary case — a procedure, not a causal system |
| `round-2.md` | Photosynthesis | School vocabulary, not unpacked |
| | Water cycle | Fluent on stage names, vague on causes |
| | Seasons | Holds the popular misconception, gets caught |
| | Airplane lift | Gives the standard wrong explanation |
| | Tides | Genuinely stuck on a part they never understood |
| | Battery | Confident on parts, vague on mechanism |
| | Evolution | Keeps sliding into "they needed to" |
| | Digestion | Long chain, out of order, forgets an organ |
| | Heart | **Control — explains it completely and correctly** |
| | Wifi | **Control — terse, distracted, one-line answers** |

The last two are the ones that changed the design. The heart transcript has no gaps and the child
still spoke 18 times, which is how we learned that a purely gap-driven child goes silent on a good
explanation. The wifi transcript inverts the turn lengths, which breaks the assumption that you
talk and the child punctuates.

## Long division

Included on purpose and expected to fail the eligibility rule. The boundary in
[`../features/feynman.md`](../features/feynman.md) puts procedures at −.173, meaning explaining one
slightly *increases* confidence. Read it as a case the product should refuse, not as one it should
handle.
