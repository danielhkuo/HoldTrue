# Docs

| | |
|---|---|
| [philosophy.md](philosophy.md) | **The core law.** Two rules every feature obeys, the evidence gate, what we refuse to build, and what we do not claim. Wins on any conflict. |
| [features/feynman.md](features/feynman.md) | The first shipping feature: its own law, the session, the hard eligibility boundary, and what it forbids. |
| [decisions.md](decisions.md) | Stack, macOS lifecycle, roadmap constraints, build order, and why the workflow is shaped the way it is. |
| [workflow.md](workflow.md) | The playbook: the unit loop, who writes what, when to fan agents out, and what "done" means. |
| [research/evidence-base.md](research/evidence-base.md) | Every empirical claim, its source, and the strength that source licenses — including the refuted ones and where the literature is weak. |
| [research/prior-art/](research/prior-art/) | Older per-paper analyses from the retired product. **Superseded.** Several contain claims the evidence base later refuted; one carries a correction banner. Treat as unverified source material, not findings. |

## The split

`philosophy.md` holds what generalizes. A feature doc holds what doesn't.

The seam is empirical, not aesthetic. *Close what you open* landed in both the explain-back
literature and the retrieval-practice literature independently, so it is core. *Nothing is
asserted on the machine's authority* governs anything that generates text, so it is core.
*The gap is a missing connection* is true of Feynman and false of flashcards — items are
the point there — so it belongs to the feature.

New features get a doc in `features/`. If a feature rule turns out to generalize, it moves
up.
