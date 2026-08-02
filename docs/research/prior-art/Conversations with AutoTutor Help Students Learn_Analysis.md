# Analysis: Conversations with AutoTutor Help Students Learn (Graesser, 2016)

> ## ⚠ CORRECTION — 2026-07-28. Two claims below are wrong. Do not cite this document.
>
> A later audit checked this analysis against the paper's full text on ERIC (ED586836).
> Two of its findings are not supported:
>
> 1. **"Authoring the expectation/misconception set is the known bottleneck"** — and the
>    supporting detail about *"requiring large multidisciplinary teams"* — **does not appear
>    in the paper.** The words *bottleneck*, *cost*, *expensive* and *multidisciplinary* are
>    absent from it. The paper reports the opposite trend: an authoring tool (ASAT) shipped,
>    licensing to other universities and businesses growing, and curriculum coverage
>    expanding. This fabricated attribution was, for a time, the sole support for the
>    project's stated novelty.
>
> 2. **"learning gains on par with human tutors (0.3–0.8 sigma)"** fuses two separate
>    claims. The 0.3–0.8σ range is measured against *reading text for an equivalent amount
>    of time*. Parity with human tutors is a different claim from a different source
>    (VanLehn 2007).
>
> Also omitted below, and material: the paper states that *"Learning from AutoTutor is not
> appreciably different from conditions where the learner is guided to read small snippets
> of text or summaries of a solution at opportunistic points in time."*
>
> This file is kept, uncorrected below this banner, as a record of how the error entered
> the project. The verified replacement is
> [`evidence-base.md`](evidence-base.md).

## Executive Summary
This paper is the single closest piece of prior art to Learning Flows: AutoTutor's Expectation�Misconception Tailored (EMT) dialogue is almost exactly the project's "graph of claims + deterministic move selection" design, and its two-decade record of implementation pitfalls maps directly onto our primary risks (claim resolution, confident-wrong feedback, and the deferred reference map).

## Vital Findings

* **EMT dialogue is the validated template for our graph-driven move policy**
  * **Insight:** AutoTutor pre-specifies a set of *expectations* (correct answer components) and *misconceptions* per topic, tracks student contributions against them via semantic matching, and selects dialogue moves (pump ? hint ? prompt ? assertion) based on which expectations remain uncovered � achieving learning gains on par with human tutors (0.3�0.8 sigma).
  * **Project Relevance:** This directly validates our �5 deterministic cascade reading moves off graph state; the difference is that we build the expectation set live from the learner's own claims rather than authoring it in advance.

* **Authoring the expectation/misconception set is the known bottleneck**
  * **Insight:** AutoTutor's biggest cost is the per-topic curation of expectations and anticipated misconceptions, requiring large multidisciplinary teams; this hand-authoring is what limits scale.
  * **Project Relevance:** This is exactly the cost our "tiny session graph, built per-turn from the user" design avoids for v1 � and it confirms that our deferred topic "reference map" (needed only to flag untouched areas) is the right thing to postpone, since it's the expensive part.

* **Semantic "blur" causes inaccurate feedback � corrections must degrade gracefully**
  * **Insight:** Statistical matching (LSA + word overlap + regex) routinely blurs the line between an expectation and a misconception, producing false positive/negative feedback that confuses and frustrates students; their mitigation is to give *neutral* short feedback on uncertain/borderline matches rather than risk a wrong verdict.
  * **Project Relevance:** This is empirical support for our three-bucket fact-check (looks fine / looks wrong / can't tell) and confidence gates � when the system is unsure, it should get curious, never confidently correct.

* **Politeness vs. accuracy trade-off, and the value of learner-articulated summaries**
  * **Insight:** Human tutors under-correct to protect self-efficacy; AutoTutor found that having the *student* produce the summary recap (rather than the tutor) promotes active learning and diagnoses remaining gaps, and that follow-ups should verify understanding rather than assume it.
  * **Project Relevance:** Supports our Consolidate moves (reflect-back, paraphrase-to-check, "summarize the chain") and the Feynman premise that the *learner* does the explaining; reinforces that feedback read off the finished graph should name specific ideas.

* **Content matters more than the avatar; modality (voice vs. typed) is largely neutral**
  * **Insight:** The "talking head" contributes little to learning gains � it is *what* gets said *when* that drives outcomes, and spoken vs. keyboard input made no appreciable difference.
  * **Project Relevance:** De-risks our voice-first, avatar-free design: investment belongs in the move-selection/graph logic (the content of the next move), not in embodiment.
