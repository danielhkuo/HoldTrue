# The move coverage council

Three agents deliberated one question on 2026-08-23: should the child cover all six conditions in
`docs/proposals/move-selection.md`? One argued for, one argued against, one counted what each move
did to the person's next line across the forty turns in `measurements/director/`. This file is
research and not a ruling. Rule 29 holds for every count taken from the machine runs.

## The evidence table (the neutral agent)

| Condition | Covered | In 40 person lines | The next person line |
|---|---|---|---|
| Named a thing, not what it does | no | 3 | The cause move stood in. 2 of 3 gave new words. |
| Moved, no destination | yes | 5 | 6 of 9 firings got new mechanism words. |
| One word carried the step | yes | 20 | The ban fired 6 times. Zero new mechanism. |
| Opposite of an earlier line | flag only | 0 | Never fired. |
| Said they do not know | no | 1 | The cause move stood in. The person repeated a line word for word. |
| Gave a complete step | partly | 22 | Shares the destination block. |

The machine explainer seldom confesses. The human transcripts in `docs/transcripts/` hold at least
nine confessions. The count of 1 for the confession condition understates the human case.

## The case for full coverage

- Count 3 in run C (5 against 2 or 3 in run A) comes from the cause move pressing backward into
  ground the person gave. The forward move removes that press.
- No run reached the gap in forty turns, and only the forward move extends the chain.
- `direct` answers a confession by pressing an old word. The agent ran it on "Honestly I don't
  know that part." and got the cause move on "brake". The oldest debt outscores the newest line.

## The case against

- Every added move is a new fixed sentence, and run C measured the fixed sentence going straight
  into the child's line. Six lines opened with "what makes the".
- "Complete" needs ground truth the child must not hold (M3, and rule 17's problem again). A false
  forward move walks the child off the unsaid step.
- The end phase closes what the child misses (Law 1). Rule 35: coverage is a gap-finder, not a
  target. The bank already shows the missing shapes (example 6).

## The judgment of 2026-08-23

Full coverage is not the optimum. A move earns its place by two tests: plain code can detect the
condition from words with a cheap false fire, and the wording does not become a template.

1. Add the confession move. The trigger is a literal phrase list. A miss is expensive with a
   person. The bank shows the reply shape.
2. Refuse the complete-step move. No ground truth, and a false fire is the expensive direction.
3. Leave the named-thing condition alone. The cause move stood in adequately, 3 occurrences.
4. The wording defect outranks the coverage question. Fix it first.
