# Analysis: The Hitchhiker's Guide to Socratic Methods in Prompting LLMs for Chemistry (Harb et al., 2025)

*Superseded by [`../evidence-base.md`](../evidence-base.md). Historical record only.*

## Findings

* **Ten Socratic principles as named, reusable primitives.** The paper synthesizes ten
  principles, each with a distinct prompt pattern: definition, generalization, induction,
  elenchus (testing consistency), hypothesis elimination, maieutics, dialectic,
  recollection, irony (exposing contradictions), and analogy.

* **Socratic prompts beat direct prompts by forcing reasoning over retrieval.** Across all
  ten principles, Socratic prompts ("how does X differ from Y, and when does this distinction
  matter?") elicited deeper, exception-aware responses than flat "what is X?" prompts,
  which returned correct-but-shallow retrieval.

* **Chain-of-thought is the computational analogue of Socratic questioning.** The authors
  argue CoT and Socratic method share the same backbone, decompose, iterate, challenge
  assumptions, and that follow-up prompts ("what additional data would weaken this
  hypothesis?") extend a single question into a reasoning chain.

* **"Mixed approaches" are sequenced principles.** The strongest results came from chaining
  principles in order, for example Definition → Hypothesis Elimination → Dialectic, or
  Irony → Elenchus → Hypothesis Elimination, adapting the sequence to the problem.

* **Each principle pairs with tailored follow-up prompts and boundary checks.** The paper
  supplies follow-up templates per principle (for analogy: "where does this analogy break
  down?"), explicitly probing limits and counterexamples.
