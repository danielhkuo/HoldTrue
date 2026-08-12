# Spec: the child's speech

> **Draft, 2026-08-12.** Replaces the 2026-08-10 version, which was four times this length and
> described a gap-finder rather than a listener. What changed is in *Why this was rewritten*.

## What it does

You say a sentence. The child says one thing back.

Most of what it says is a **reaction to the sentence that just landed**. Sometimes it is a
question about something missing. It only ever knows what you have said — it calls no model
and holds no facts about the world.

## The loop

```
you say a sentence  →  Extract reads it  →  the child says one thing  →  you keep going
```

The child answers the **new sentence** first, and reaches back into everything you have said
only when the new sentence gives it nothing. That order is the whole design. Reverse it and
you get a search engine with a personality bolted on, which is what the last version was.

## Two pieces

| Piece | Takes | Returns |
|---|---|---|
| **Notice** | The new sentence, the graph so far, what it has already asked | One typed move |
| **Voice** | One move | One sentence |

Both deterministic. Voice is handed phrases and never the graph, so it cannot name a concept
you did not say. That is the property in section *Tests*.

## The moves

Checked in this order. First match wins.

| Move | Fires when | Says |
|---|---|---|
| `gotIt` | Your new sentence closes a gap it asked about | *"ohhh okay, i get it now"* |
| `whoa` | The new sentence carries a big number or a scale word | *"whoa, that's a lot"* |
| `term` | The new sentence has a word a ten-year-old would not know | *"wait, what's a siphon?"* |
| `conflict` | Two links in your graph disagree | *"but you just said the opposite"* |
| `guess` | Two things you linked to a third, never to each other | *"so is it X that does Y?"* — **a plant** |
| `needed` | Something appears mid-explanation with nothing under it | *"but what makes that happen?"* |
| `why` | Any link you stated | *"how come though?"* |
| `mirror` | Three turns in, and a chain exists | *"so X, then Y, then Z. and that's it?"* |
| `on` | Nothing else fired | *"okay. then what?"* |

`gotIt` and `whoa` carry no diagnostic content at all. They are a third of what a real child
says — see [`../transcripts/`](../transcripts/) — and without them the rest reads as an
interrogation.

**`guess` is the only move that asserts.** Every one writes a row to the plant ledger, and the
review phase must disclose and close each before the session ends. A plant left open is a
Law 1 failure.

## Adding a move

This is the extension point, and the only one.

1. Add a variant to `Move`.
2. Add its trigger to `notice`, in the order above.
3. Add its templates to `voice`.

Nothing else changes. A move is a trigger and some words; the loop, the ledger and the
property do not care how many there are.

## What it must not do

- Name a concept absent from your transcript.
- Assert anything except through `guess`, and a `guess` is always a question.
- Say your explanation was unclear. It reports its own state, never a judgement of you.
- Call a model. Extract is the only model in the live phase.
- Speak your filled pauses back. The anchors keep them; the spoken form is cleaned.

## Tests

**One property.** Every concept the child names appears in your transcript, after the same
normalisation Extract uses. It needs no gold labels — the input is the ground truth.

Then a fixture per move: a graph in, an exact sentence out. Both pieces are deterministic, so
both are pinnable, and both can be built before Extract runs.

## Why this was rewritten

The first version had twelve moves, all of them probes, and `notice` searched the whole graph
for the most interesting gap. Run against a real explanation it produced eight questions in a
row and read like a form. The fault was not the templates. A real child answers the sentence
that just landed; ours queried a database.

Two things came out of that and both are above: the new sentence is checked before the graph,
and there is a class of move that finds nothing at all.

## Open

- **Reaction triggers.** `whoa` on a big number is obvious. What else earns a reaction without
  a model is not settled.
- **When the child interrupts.** Per sentence as you finish it, or after you stop.
- **`gotIt` needs the loop.** It cannot fire until the child hears your answer, and nothing
  yet feeds your reply back in.
- **`resay` was cut from the MVP**, and is the first test of *Adding a move*. It fired when
  Extract dropped a link it could not anchor — *"wait, say that part again?"* — and it is the
  only move that recovers a loss instead of reporting one. It was cut because the local model
  quoted exactly in every probe so far, so `dropped` was always zero and the move never fired.
  Bring it back the moment that stops being true: one variant, one trigger on
  `sentence.dropped > 0`, two templates.
