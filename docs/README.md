# Docs

**Which document wins.** [`philosophy.md`](philosophy.md) beats a feature doc, which is the only
precedence it claims for itself. [`../AGENTS.md`](../AGENTS.md) holds the numbered invariants and is
not in the list below because it is not under `docs/` — read it first anyway; a violation of an
invariant is wrong even where a doc here says otherwise. [`decisions.md`](decisions.md) owns the
build order, and no other file may restate it.

- [philosophy.md](philosophy.md): **the core law.** Two laws — *we close what we open*, and *nothing is asserted anonymously* — plus the evidence gate and what we refuse to build. Wins any conflict. **The second law is new as of 2026-08-07**: it replaced the notes-only rule that had said every sentence traces to the user, to a quoted passage, or to plain code. Read it there before trusting any premise in a doc dated earlier.
- [features/feynman.md](features/feynman.md): the first shipping feature — its own law, its session, its eligibility boundary, and what the 2026-08-07 pivot left open in it.
- [decisions.md](decisions.md): stack, macOS lifecycle, roadmap constraints, build order. Also which of its own rulings the pivot superseded, and why the reasoning under them still stands for the optional RAG path.
- [workflow.md](workflow.md): why the build procedure is shaped the way it is. The procedure itself is [`/holdtrue-workflow`](../.claude/skills/holdtrue-workflow/SKILL.md), the only numbered document.
- [specs/](specs/): one per piece — its contract, its rulings, and what it hands on. Four exist. **Two are at the ends and two are in the middle:** anchor.md is built and closed,
supply.md has no code at all, and extract.md and child-speech.md each cover a piece that half
exists. [specs/anchor.md](specs/anchor.md) is the only one at 30 tests and 100% mutation. [specs/extract.md](specs/extract.md) is build-order entry 2, the piece carrying the kill switch: `validate` and `normalise` ship, the harness and the ~100 labelled explanations do not, and five of its rulings are open. [specs/child-speech.md](specs/child-speech.md) covers Speak and Tally — `tallyIntroduced` ships with 41 tests, `speak` has no code, and every ruling in it is settled. [specs/supply.md](specs/supply.md) is a draft written ahead of building, with ten open rulings and no eval by decision — **read its banner first**; it was written against a repo that no longer exists. Cohere has no spec at all and is a skeleton with no tests, which is why it comes before Speak.
- [transcripts/](transcripts/): 18 generated conversations of an adult explaining a mechanism to a child, written blind to this design. Design material and test fixtures, **not** a measurement and not a substitute for the falsification week.
- [research/evidence-base.md](research/evidence-base.md): every empirical claim about **how people learn**, its source, and the strength that source licenses.
- [research/extraction-benchmarks.md](research/extraction-benchmarks.md): the **engineering** figures — causal extraction, open IE, ASR — each with its genre, metric and sample size. Ungated, but every number carries its source. Written 2026-08-07 after three uncited figures were traced and found unable to support what rested on them.
- [research/stt-parakeet.md](research/stt-parakeet.md), [research/stt-cloud-byok.md](research/stt-cloud-byok.md), [research/stt-local-candidates.md](research/stt-local-candidates.md): the speech-to-text candidates, from [issue 23](https://github.com/danielhkuo/HoldTrue/issues/23) — one local engine, the three bring-your-own-key cloud vendors, and the remaining three local ones. Engineering measurements. **Corrected 2026-08-12: the engine is not open.** [Issue 23](https://github.com/danielhkuo/HoldTrue/issues/23) resolved it to whisper.cpp behind a `whisper-server` sidecar; what stays open is the model size and whether a second sidecar is acceptable. [research/stt-signals.md](research/stt-signals.md) is the fourth file — what that engine can and cannot tell us about its own errors, which nobody had asked before the repeat-gate needed it.
- [../measurements/within-sentence/README.md](../measurements/within-sentence/README.md): the
  falsification week's protocol and its kill numbers — build-order entry 0, never run, and the one
  measurement nobody else can do. `AGENTS.md` calls it the operative document and this map omitted it.
- [research/prior-art/](research/prior-art/): per-paper analyses from the retired product. **Superseded** and partly refuted.

## The split

`philosophy.md` holds what generalizes, a feature doc holds what doesn't. The seam is
empirical: *close what you open* landed in two independent literatures, so it is core, while
*the gap is a missing connection* is false of flashcards, so it stays with Feynman.
