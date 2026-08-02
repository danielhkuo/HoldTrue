# HoldTrue

A local-first study application that runs on your machine, against your own material, with
your own model.

> **Status: design and evidence only. There is no application code yet.**
> This repository currently contains a constitution and a verified evidence base. The build
> has not started. If you are looking for something to run, there is nothing here yet.

## The idea

You read something — a chapter, a paper, a runbook, your own lecture notes. You close it
and write out how the thing works, from memory, with nothing visible.

The app takes what you wrote, finds the concepts you named, and looks in *your own source*
for a causal connection between them that your explanation skipped. Then it shows you that
passage, quoted, with the citation attached. Then you write it again with the missing step
in it.

That is the whole loop. It is the Feynman technique with the one step outsourced that
people are measurably bad at doing for themselves: noticing their own gap.

## Why it works this way

Two laws govern every feature, stated in full in
[`docs/philosophy.md`](docs/philosophy.md).

1. **We close what we open.** Anything that asks you a question must also supply the
   answer. A gap surfaced and left unfixed is worse than one never surfaced — an error you
   elicit and don't correct gets learned as an error, and retrieval practice without
   feedback measures at an effect size of 0.03. Diagnosis alone is not a product.
2. **Nothing is asserted on the model's authority.** Every sentence traces to you, to a
   quoted passage in your material, or to plain code. While you're explaining, what the
   model knows may only make it *quieter*. When it finally tells you something, it's
   quoting, with a citation you can click.

Each feature adds its own. Feynman's is that the gap is a missing *connection*, and that
the comparison runs against your source rather than against a second reading of your own
words — that second reading is a coin flip, and building on it would mean confidently
telling you that you missed something you said. See
[`docs/features/feynman.md`](docs/features/feynman.md).

## The evidence stance

Education research replicates poorly. This project's response is to write down exactly
what it is permitted to claim, and to keep the refuted claims visible rather than quietly
deleting them.

[`docs/research/evidence-base.md`](docs/research/evidence-base.md) lists every
empirical claim with its source and the strength that source actually licenses. It opens
with a list of claims this project made and then **refuted against the primary text**,
including one where the paper cited for the project's central novelty turned out not to
contain the finding. It closes with a section on where the literature is weak, contested,
or contradicted by other meta-analyses.

The rule: if a claim is not in that document, it does not appear in the product.

## Planned stack

Electron; `node-llama-cpp` with a bundled Vulkan build for the local model, and detection
of an existing Ollama or LM Studio if you have one; Qwen3.5 4B for extraction and 9B for
generation, fetched on first run rather than shipped; SQLite via `node:sqlite` holding
vectors as blobs with FTS5 for the keyword half of hybrid retrieval; PDFium for
citation-grade character spans. Optional web retrieval behind a toggle, off by default.

Bring your own API key instead of a local model if you'd rather. Nothing leaves your
machine unless you turn something on.

## History

Until July 2026 this was a voice-first iOS app that graded a spoken explanation against a
curated answer key. It was scrapped. The reasons — including an audit that found several of
its own citations did not support the claims attached to them — are recorded in the two
documents above rather than glossed over.

## License

[AGPL-3.0](LICENSE.md).
