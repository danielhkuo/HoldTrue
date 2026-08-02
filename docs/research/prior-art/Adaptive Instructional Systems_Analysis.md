# Analysis: Adaptive Instructional Systems (AIS 2019 Proceedings; Sottilare & Schwarz, eds.)

## Executive Summary
This proceedings volume frames the broader field our mechanic sits inside; its most relevant contributions (Hampton & Graesser's hybrid tutor, Durlach's AIS foibles) supply design vocabulary and cautionary lessons � especially around modeling misconceptions, knowledge-component granularity, and what to leave out of an MVP.

## Vital Findings

* **The "hybrid tutor" pattern: deterministic orchestration over diverse resources**
  * **Insight:** Hampton & Graesser's *Foundational Principles and Design of a Hybrid Tutor* describes a system where a unified learner record feeds a recommender that picks the right activity/modality/difficulty at the right time � separating the bookkeeping of learner state from the act of delivering content.
  * **Project Relevance:** Echoes our split of a stateful graph (learner's claims) from a policy that selects the next move, and validates carrying a lightweight learner-state object as the backbone of adaptivity.

* **Pedagogical content knowledge / "bug libraries" � the explicit misconception store**
  * **Insight:** Durlach notes that few AIS encode pedagogical content knowledge (common preconceptions, misconceptions, typical mistakes) as "bug libraries," yet doing so lets a system recognize and target errors; authoring it is costly.
  * **Project Relevance:** This is the conceptual sibling of our deferred topic "reference map" and our parametric misconception-detection � it confirms misconception modeling is high value but expensive, justifying our v1 reliance on the model's weights instead of an authored library.

* **Knowledge components as a discretization layer for learner state**
  * **Insight:** ElectronixTutor annotates every item against a matrix of topics � knowledge components, discretizing all interactions into a common currency before updating the learner model.
  * **Project Relevance:** Suggests our claim nodes (with type: definition/cause/step/example/analogy) play the same role � a typed, discrete unit that makes graph signals computable � and hints at a future coverage heuristic keyed to component types.

* **"Content is king" � adaptivity is secondary to what is said and when**
  * **Insight:** Durlach argues the technology/adaptivity often matters less than content quality and timing, and that systematic studies isolating which adaptive features actually help are rare.
  * **Project Relevance:** Reinforces focusing v1 effort on getting move *selection and timing* right (the right question at the right moment) rather than on architectural sophistication, and tempers expectations about adaptivity alone driving outcomes.

* **Motivational/curiosity tactics are under-used but matter**
  * **Insight:** The volume notes AIS overweight knowledge-acquisition moves and underweight tactics that build curiosity, motivation, and self-efficacy, which are known to drive learning.
  * **Project Relevance:** Direct support for keeping our React moves (delight, "huh", admit-lost) and the curious-learner persona � they are not decoration but pedagogically motivated, and protect self-efficacy (the politeness/trust concern).
