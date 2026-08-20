# Proposal: the move comes from the last turn

**Status: proposed on 2026-08-20. Nobody has ruled on it. Nobody has built it.**

## The fault

`lateBlock` picks the move from the turn number. It never reads what the person said.

Two failures follow.

The child asks the same three question shapes on a period of three. The moves rotate, so the shapes
rotate with them.

The child asks about a step the conversation left four turns ago. The move did not come from the
last turn, so it lands in the wrong place.

## The condition lives in the last turn

| The condition in their last line | The move that answers it |
|---|---|
| They named a thing. They did not say what it does. | Ask what that thing does. |
| Something moved or vanished. They did not say where. | Ask where it went. |
| One word carried the whole step. | Say you do not know that word. Ask for the step without it. |
| They said the opposite of an earlier line. | Put both lines together. Ask which one holds. |
| They said they do not know. | Ask for the last part they are sure of. |
| They gave a complete step. | Ask what happens next. |

A turn number cannot pick a row from this table. Only the last turn can.

## The proposal

The model names the gap before it writes the question. One model call. Two fields. The app shows one.

```json
{ "missing": "they named the pads but not what the pads do to the rim",
  "question": "What do the pads do to the rim?" }
```

The app prints `question`. The app keeps `missing`.

`lateBlock` stops naming a move. It sets the task instead.

```
[Read only their last line. Name what is missing from it. Then ask one short
question about that missing thing. Do not use a technical word they have not
used. Return JSON with the fields "missing" and "question".]
```

No question sits inside that instruction, so the model has nothing to copy.

## Why it fixes both failures

The question comes from the content of the turn. The content changes every turn, so a fixed shape
cannot survive.

The gap comes from the last line. A gap four turns back is not in the last line, so the model cannot
reach it.

## The cost

One model call per turn, as now. The output grows by one line.

Keep the `missing` field. Check looks for the same thing in the end phase.

## The risk

The model may report a gap where the person gave a step. The cost is one wasted turn. The person
answers again and says so.

The end phase must not read `missing` as a finding. A wrong guess must never reach a user as a claim.
