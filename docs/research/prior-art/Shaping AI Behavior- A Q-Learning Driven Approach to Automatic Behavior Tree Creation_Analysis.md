# Analysis: Shaping AI Behavior � A Q-Learning Driven Approach to Automatic Behavior Tree Creation (Dworzanski, 2023)

## Executive Summary
This thesis is relevant not for its reinforcement-learning content but for its rigorous treatment of Behavior Trees � the exact game-AI control pattern our �5 deterministic move policy borrows � including why BTs beat state machines and why guard-conditioned, priority-ordered nodes stay maintainable as behavior grows.

## Vital Findings

* **Behavior Trees solve the combinatorial explosion that kills state machines**
  * **Insight:** As behaviors grow, finite state machines suffer exponential blow-up in states/transitions; BTs replace this with a hierarchical, modular DAG of nodes that is far more maintainable and readable.
  * **Project Relevance:** Validates choosing a BT/utility-AI-style cascade over an ad-hoc state machine for move selection, and warns that our move table must stay finite � exactly our �7 discipline of "one move per distinct graph condition."

* **Priority ordering via selector/sequence nodes is our move-cascade pattern**
  * **Insight:** Selector ("fallback") nodes try children left-to-right until one succeeds, encoding strict priority; the canonical example prioritizes "if low health ? heal" over "if enemy in sight ? attack."
  * **Project Relevance:** This is structurally identical to our first-match-wins cascade (conflict ? challenge; stale probe ? follow-up; unknown ? curious-why), confirming the pattern is a well-understood, debuggable control structure.

* **"Guards" gate actions on preconditions � our trigger/gate columns**
  * **Insight:** Condition nodes (guards) sit before action nodes to verify a precondition holds before the action runs, returning only success/failure.
  * **Project Relevance:** Mirrors our move table's *trigger* (graph condition) and *gate* (confidence required) design � a move only fires when its structural guard passes, and assertive moves additionally guard on a confidence threshold.

* **Generated behaviors adapted to scenarios not planned for at creation time (RQ2)**
  * **Insight:** The BTs synthesized from learned experience performed competently on map sizes and game lengths they were never trained against, showing the structure generalizes beyond its authoring conditions.
  * **Project Relevance:** Encouraging for our claim that a small, structural move policy can handle unanticipated conversational situations without enumerating every case � most moves fire on generic structural gaps, not domain specifics.

* **Determinism over a learned/probabilistic substrate is auditable and tunable**
  * **Insight:** The thesis separates a deterministic, inspectable tree (control) from the learned knowledge that populated it (estimate), gaining transparency and adjustability.
  * **Project Relevance:** Exactly our architecture � a deterministic policy over a model-built state estimate � and supports our claim that misclassifications are debuggable ("weak question because claim C3 was mis-typed") in a way a single mega-prompt is not.
