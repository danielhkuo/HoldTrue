# Proposal: the topic gate

**Status: drafted 2026-08-25. Decision 18 requires a gate. The owner has not ruled on this
design.**

Rule 19: the product runs on a causal mechanism only. The gate is the check. A gate needs a model,
because "is this a mechanism" is a judgement over words. Plain code cannot make it.

## Design A: the gate runs on a named topic, before the session

The pick screen gains a text box. The person types a topic phrase. `POST /api/start` makes one
gate call: is this phrase a causal mechanism? A pass starts the session with that title. A fail
shows one sentence — "This looks like a fact, a word or a procedure, not a mechanism" — and the
curated list. Nothing of the person's explanation exists yet, so a fail costs nothing.

- The gate call sits before the live phase. Rule 1 stays untouched: one model call per turn.
- The failed-gate screen is clean. The person has not started explaining.
- The cost: one extra screen interaction before the person can start.

## Design B: the first turn carries the topic

The person just starts explaining, as on a voice call. The first turn goes to the gate first. The
gate call extracts a topic phrase from the turn and judges it. A pass sets the session title and
the child answers the same turn. A fail stops the session before the child ever speaks, and the
app explains why.

- The start is frictionless. This matches the voice future: no typing, no picking.
- The first turn makes two model calls: the gate, then the child. Rule 1 says the live phase
  makes one call per turn. Either the gate is its own phase, before the live phase, and the rule
  stands as written, or rule 1 gains an exception. The owner must rule on that reading.
- A fail lands after the person already produced a paragraph. The rejection costs their words.
- The gate names the topic from the model's reading of the turn. A wrong extraction titles the
  session with a mechanism the person did not intend. The person must see the title and be able
  to end the session.
- Turn one gets double latency.

## The recommendation

Design A for the typed MVP. Design B is the right shape for voice, and voice is not in the MVP.
The two designs share the gate call itself: one prompt, one yes or no with a reason, one place in
`src/server.ts`. Build the call once behind Design A. Move it in front of the first turn when
voice arrives. Nothing is thrown away.

## What a fail must not do

A fail must not judge the person. Rule 17 holds for the gate as for the child: "not a mechanism"
is a scope statement, never a quality statement. The fail screen offers the curated list and the
"Something else" button as today.

## The tests

- The gate prompt and the parsing are pure functions. Unit tests need no model. Rule 32.
- The end to end check gains one scenario: a fact topic ("the capital of France") fails the gate,
  and a mechanism topic ("how a kettle switches itself off") passes. Heuristics on the screen, as
  in `src/e2e.ts`.
