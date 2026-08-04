# Analysis: Shaping AI Behavior, A Q-Learning Driven Approach to Automatic Behavior Tree Creation (Dworzanski, 2023)

*Superseded by [`../evidence-base.md`](../evidence-base.md). Historical record only.*

Relevant not for its reinforcement-learning content but for its treatment of Behavior Trees.

## Findings

* **Behavior Trees solve the combinatorial explosion that kills state machines.** As
  behaviors grow, finite state machines suffer exponential blow-up in states and
  transitions; BTs replace this with a hierarchical, modular DAG of nodes that is far more
  maintainable and readable.

* **Priority ordering via selector/sequence nodes.** Selector ("fallback") nodes try
  children left-to-right until one succeeds, encoding strict priority. The canonical example
  prioritizes "if low health → heal" over "if enemy in sight → attack."

* **Guards gate actions on preconditions.** Condition nodes (guards) sit before action
  nodes to verify a precondition holds before the action runs, returning only success or
  failure.

* **Generated behaviors adapted to scenarios not planned for at creation time (RQ2).** The
  BTs synthesized from learned experience performed competently on map sizes and game
  lengths they were never trained against, generalizing beyond their authoring conditions.

* **Determinism over a learned substrate is auditable and tunable.** The thesis separates a
  deterministic, inspectable tree (control) from the learned knowledge that populated it
  (estimate), gaining transparency and adjustability.
