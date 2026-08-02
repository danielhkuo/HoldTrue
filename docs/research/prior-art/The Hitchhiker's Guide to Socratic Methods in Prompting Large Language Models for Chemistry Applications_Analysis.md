# Analysis: The Hitchhiker's Guide to Socratic Methods in Prompting LLMs for Chemistry (Harb et al., 2025)

## Executive Summary
Despite its chemistry framing, this paper provides a clean, ten-principle operational vocabulary for Socratic LLM prompting and a "mixed-approach" sequencing model that together inform both our move taxonomy and the structured-prompt design of our extraction/realization calls.

## Vital Findings

* **Ten Socratic principles as named, reusable move primitives**
  * **Insight:** The paper synthesizes ten principles � definition, generalization, induction, elenchus (testing consistency), hypothesis elimination, maieutics, dialectic, recollection, irony (exposing contradictions), and analogy � each with a distinct prompt pattern.
  * **Project Relevance:** Several map almost 1:1 to our moves: *definition* ? Clarify term; *elenchus* ? Surface contradiction; *hypothesis elimination* ? Offer counterexample; *irony* ? naive-wrong bait; *analogy* ? Offer analogy � giving us tested phrasings for the realizer.

* **Socratic prompts beat direct prompts by forcing reasoning over retrieval**
  * **Insight:** Across all ten principles, Socratic prompts (e.g., "how does X differ from Y, and when does this distinction matter?") elicited deeper, more nuanced, exception-aware responses than flat "what is X?" prompts, which returned correct-but-shallow retrieval.
  * **Project Relevance:** Reinforces that our value is in *how* the next move is framed (probing distinctions, boundaries, exceptions) rather than information delivery � and that even our internal extraction/check prompts benefit from this framing.

* **Chain-of-thought is the computational analogue of Socratic questioning**
  * **Insight:** The authors argue CoT and Socratic method share the same backbone � decompose, iterate, challenge assumptions � and that follow-up prompts ("what additional data would weaken this hypothesis?") extend a single question into a reasoning chain.
  * **Project Relevance:** Supports splitting our turn into structured reasoning steps (extract ? resolve ? check ? select) and using iterative probe follow-ups to deepen a thread rather than one-shot answers.

* **"Mixed approaches" = sequenced principles, mirroring our priority cascade**
  * **Insight:** The strongest results came from chaining principles in order � e.g., Definition ? Hypothesis Elimination ? Dialectic, or Irony ? Elenchus ? Hypothesis Elimination � adapting the sequence to the problem.
  * **Project Relevance:** Conceptual backing for our �5 cascade and for letting persona reweight which principle fires first; it also hints that move *transitions* (not just single moves) shape the learning experience.

* **Each principle pairs with tailored follow-up prompts and boundary checks**
  * **Insight:** The paper supplies follow-up templates per principle (e.g., for analogy: "where does this analogy break down?"), explicitly probing limits and counterexamples.
  * **Project Relevance:** Directly usable for our Probe/Boundary/Counterexample-request moves and for the "did you notice?" disclosure that must follow a deliberately-wrong analogy.
