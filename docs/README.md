# Docs

- [philosophy.md](philosophy.md): **the core law.** Two laws — *we close what we open*, and *nothing is asserted anonymously* — plus the evidence gate and what we refuse to build. Wins any conflict. **The second law is new as of 2026-08-07**: it replaced the notes-only rule that had said every sentence traces to the user, to a quoted passage, or to plain code. Read it there before trusting any premise in a doc dated earlier.
- [features/feynman.md](features/feynman.md): the first shipping feature — its own law, its session, its eligibility boundary, and what the 2026-08-07 pivot left open in it.
- [decisions.md](decisions.md): stack, macOS lifecycle, roadmap constraints, build order. Also which of its own rulings the pivot superseded, and why the reasoning under them still stands for the optional RAG path.
- [workflow.md](workflow.md): why the build procedure is shaped the way it is. The procedure itself is [`/holdtrue-workflow`](../.claude/skills/holdtrue-workflow/SKILL.md), the only numbered document.
- [specs/](specs/): one per piece — its contract, its rulings, and what it hands on. Two exist. [specs/anchor.md](specs/anchor.md) is for the only piece **built**; [specs/supply.md](specs/supply.md) is a draft written ahead of building, with signature-changing rulings still open and no eval by decision — read its status line and its section 7 before building against it.
- [research/evidence-base.md](research/evidence-base.md): every empirical claim about **how people learn**, its source, and the strength that source licenses.
- [research/extraction-benchmarks.md](research/extraction-benchmarks.md): the **engineering** figures — causal extraction, open IE, ASR — each with its genre, metric and sample size. Ungated, but every number carries its source. Written 2026-08-07 after three uncited figures were traced and found unable to support what rested on them.
- [research/stt-parakeet.md](research/stt-parakeet.md), [research/stt-cloud-byok.md](research/stt-cloud-byok.md), [research/stt-local-candidates.md](research/stt-local-candidates.md): the speech-to-text candidates, from [issue 23](https://github.com/danielhkuo/HoldTrue/issues/23) — one local engine, the three bring-your-own-key cloud vendors, and the remaining three local ones. Engineering measurements. Between them they cover the ticket's candidate list; which engine wins is still open.
- [research/prior-art/](research/prior-art/): per-paper analyses from the retired product. **Superseded** and partly refuted.

## The split

`philosophy.md` holds what generalizes, a feature doc holds what doesn't. The seam is
empirical: *close what you open* landed in two independent literatures, so it is core, while
*the gap is a missing connection* is false of flashcards, so it stays with Feynman.
