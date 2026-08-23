# The documentation map

This document lists every document and gives the precedence order. It restates nothing else.

HoldTrue is a study application. [`product.md`](product.md) says what it is. Both phases now run.
No eval measures the end phase. [`architecture.md`](architecture.md) describes both.

## The documents

| Document | What it holds |
|---|---|
| [`../AGENTS.md`](../AGENTS.md) | The numbered rules, the evidence rule, the testing position and the writing standard. |
| [`product.md`](product.md) | What the product is, the two laws, the four mechanisms, the eligibility rule, the retired promise and the enforcement table. |
| [`cases.md`](cases.md) | The case register. Every behaviour the product must produce, and every behaviour it must stop. One line for each. |
| [`architecture.md`](architecture.md) | The two phases, the four end-phase parts, the model layer and the omniscient toggle. |
| [`proposals/`](proposals/) | A design that nobody has ruled on and nobody has built. |
| [`decisions.md`](decisions.md) | Every reason, every rejected alternative, the build order and the open decisions. |
| [`research/`](research/) | Three kinds of evidence. See below. |
| [`transcripts/`](transcripts/) | 18 generated conversations. See below. |

[`decisions.md`](decisions.md) also records the documents the owner deleted on 2026-08-19. A
research file may name a deleted document. The name is a historical reference and not a link.

## The research folder

The folder holds three kinds of file. Each kind has its own rule.

- Learning evidence: [`evidence-base.md`](research/evidence-base.md). `AGENTS.md` gates this file.
- Engineering figures: [`extraction-benchmarks.md`](research/extraction-benchmarks.md) and the four
  speech-to-text files `stt-*.md`. Each figure carries its source where you use it.
- Ungated material: [`feynman-edge-cases.md`](research/feynman-edge-cases.md) and
  [`prior-art/`](research/prior-art/). A claim in these two files must not reach the user until the
  owner files it in `evidence-base.md`. A document may cite such a claim. The document must mark the
  citation as unfiled. `AGENTS.md` rule 27 owns this rule. `feynman-edge-cases.md` also holds the measured
  data about real children.

## The transcripts folder

Model agents wrote the 18 transcripts on 2026-08-10. They are not a record of what a real child
says. They are not a measurement.

## Which document has priority in a conflict

1. `AGENTS.md` has priority over every other document.
2. `product.md` has priority over `architecture.md`.
3. `decisions.md` owns the build order. Another file must not copy the build order.

Correct the document with the lower priority. Do not write new text to avoid a conflict.
