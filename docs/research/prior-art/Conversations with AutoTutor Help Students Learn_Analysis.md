# Analysis: Conversations with AutoTutor Help Students Learn (Graesser, 2016)

> ## ⚠ CORRECTION, 2026-07-28. Two claims below are wrong. Do not cite this document.
>
> A later audit checked this analysis against the paper's full text on ERIC (ED586836).
> Two of its findings are not supported:
>
> 1. **"Authoring the expectation/misconception set is the known bottleneck"**, and the
>    supporting detail about *"requiring large multidisciplinary teams"*, **does not appear
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

## Findings

*Kept as written, including the two claims the banner above refutes.*

* **EMT dialogue.** AutoTutor pre-specifies a set of *expectations* (correct answer
  components) and *misconceptions* per topic, tracks student contributions against them via
  semantic matching, and selects dialogue moves (pump → hint → prompt → assertion) based on
  which expectations remain uncovered, achieving learning gains on par with human tutors
  (0.3-0.8 sigma).

* **Authoring the expectation/misconception set is the known bottleneck.** AutoTutor's
  biggest cost is the per-topic curation of expectations and anticipated misconceptions,
  requiring large multidisciplinary teams; this hand-authoring is what limits scale.

* **Semantic "blur" causes inaccurate feedback.** Statistical matching (LSA, word overlap,
  regex) routinely blurs the line between an expectation and a misconception, producing
  false positive and false negative feedback that frustrates students. The mitigation is
  *neutral* short feedback on borderline matches rather than a risked wrong verdict.

* **Politeness vs. accuracy, and learner-articulated summaries.** Human tutors under-correct
  to protect self-efficacy. AutoTutor found that having the *student* produce the summary
  recap promotes active learning and diagnoses remaining gaps, and that follow-ups should
  verify understanding, not assume it.

* **Content matters more than the avatar; modality is largely neutral.** The "talking head"
  contributes little to learning gains. It is *what* gets said *when* that drives outcomes;
  spoken vs. keyboard input made no appreciable difference.
