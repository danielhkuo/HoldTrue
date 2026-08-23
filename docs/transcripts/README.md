# Generated transcripts

This folder holds 18 conversations. In each one an adult explains a mechanism to a curious child.
Model agents wrote them on 2026-08-10. Each agent received a topic and a note on the style of the
explainer. The agents did not see this repository or its design. That blindness is the point. A
transcript written against the design holds only the moves the design already handles.

The transcripts answer one question: what does a child say? The old child-speech specification was
designed against them. The owner deleted that specification on 2026-08-19.

## What they are not

- **Not a measurement.** The disfluency in them is written disfluency. Real speech through a
  transcriber with a 15 to 25 percent word error rate looks different. It drops words, swaps
  homophones and has no sentence boundaries. A count of how often a move appears here does not
  transfer.
- **Not your own explanations.** A measurement needs your own explanations from memory, on topics
  you chose, with every causal link marked by hand. See
  [`measurements/within-sentence/README.md`](../../measurements/within-sentence/README.md).
- **Not evidence about learning.** Nothing here goes near the evidence rule in `AGENTS.md`.

## The set

| File | Topic | What the explainer was told to do |
|---|---|---|
| `round-1.md` | Toilet flush | Ordinary, imperfect |
| | Hurricane | Reaches for half-remembered technical words |
| | Refrigerator | Names parts confidently, vague on mechanism |
| | Vaccines | Leans on an analogy the child takes literally |
| | Greenhouse effect | Gets part of it wrong |
| | Car engine | Tells it out of order, doubles back |
| | Noise-cancelling headphones | Child keeps testing with own examples |
| | Long division | Boundary case: a procedure, not a causal system |
| `round-2.md` | Photosynthesis | School vocabulary, not unpacked |
| | Water cycle | Fluent on stage names, vague on causes |
| | Seasons | Holds the popular misconception, gets caught |
| | Airplane lift | Gives the standard wrong explanation |
| | Tides | Stuck on a part they never understood |
| | Battery | Confident on parts, vague on mechanism |
| | Evolution | Keeps sliding into "they needed to" |
| | Digestion | Long chain, out of order, forgets an organ |
| | Heart | **Control. Explains it completely and correctly** |
| | Wifi | **Control. Terse, distracted, one-line answers** |

The last two changed the design. The heart transcript has no gaps. The child still spoke 18 times.
That showed that a child driven by gaps alone goes silent on a good explanation. The wifi transcript
inverts the turn lengths. That breaks the assumption that you talk and the child punctuates.

## Long division

This transcript is in the set on purpose. The eligibility rule in `docs/product.md` excludes a
procedure. An explanation of a procedure raises confidence a little. Read it as a case the product
must refuse, not as a case it must handle.
