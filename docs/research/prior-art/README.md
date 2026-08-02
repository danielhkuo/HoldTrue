# Research — the prior art this design rests on

> **Rationale set.** Seven analyses of prior work, moved intact on 2026-07-26. Read one
> when you need the evidence behind a claim in [`../product-thesis.md`](../product-thesis.md)
> or [`../learning-flows.md`](../learning-flows.md) — not by default.

Each file is an analysis of one source: an executive summary, then findings paired with
what they mean for Vocare. They are the **evidence layer**; the argument built on them
lives in the why-docs above, which is what you should read first.

The source PDFs are in [`sources/`](sources/), one per analysis, same filename. **Read the
analysis, not the PDF** — the analyses exist so nobody has to page through 104 MB of
proceedings to check a claim. The PDFs are there for when an analysis is challenged.

## By what it grounds

| If you need the basis for… | Read | Cited in the why-docs as |
|---|---|---|
| The whole architecture — a claim graph + deterministic move selection, and its measured learning gains | [Conversations with AutoTutor Help Students Learn](Conversations%20with%20AutoTutor%20Help%20Students%20Learn_Analysis.md) | Graesser, 2016 · EMT |
| Why the move policy is a Behavior Tree rather than a state machine, and why the move list must stay finite | [Shaping AI Behavior — Q-Learning Driven Behavior Tree Creation](Shaping%20AI%20Behavior-%20A%20Q-Learning%20Driven%20Approach%20to%20Automatic%20Behavior%20Tree%20Creation_Analysis.md) | Dworzanski, 2023 |
| Why asking beats asserting, and the structural question types behind the move set | [A Taxonomy of Questions for Critical Reflection](A%20Taxonomy%20of%20Questions%20for%20Critical%20Reflection%20in%20Machine-Assisted%20Decision-Making_Analysis.md) | Fischer et al., 2025 |
| Named Socratic move primitives and tested phrasings for the realizer; why sequenced principles beat single ones | [The Hitchhiker's Guide to Socratic Methods in Prompting LLMs](The%20Hitchhiker's%20Guide%20to%20Socratic%20Methods%20in%20Prompting%20Large%20Language%20Models%20for%20Chemistry%20Applications_Analysis.md) | Harb et al., 2025 |
| The trust gap this product is aimed at — where AI tutoring wins and where it loses to humans | [Overview of Socratic tutoring](Overview%20of%20Socratic%20tutoring_Analysis.md) | Fakour & Imani, 2025 |
| The persona/realizer layer — conversational style, pacing, rapport | [Intelligent Virtual Agents](Intelligent%20Virtual%20Agents_Analysis.md) | IVA 2016 |
| The surrounding field: hybrid tutors, misconception stores, and what to leave out of an MVP | [Adaptive Instructional Systems](Adaptive%20Instructional%20Systems_Analysis.md) | AIS 2019 |

## The load-bearing four

[`../product-thesis.md`](../product-thesis.md) names four of these as load-bearing —
AutoTutor, the Behavior Tree thesis, the question taxonomy, and the Socratic-tutoring
study. The other three are supporting. If a design decision is challenged, those four are
where the argument actually lives.

## Section references

These analyses were written before the 2026-07-26 reorganization, so their `§` citations
point at the retired `PRD-Learning-Flows` / `ios-technical-spec` documents. The mapping
from old sections to current docs is in
[`docs/superpowers/specs/2026-07-26-doc-reorganization-design.md`](../../superpowers/specs/2026-07-26-doc-reorganization-design.md).
