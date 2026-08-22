# Plan: three changes to the child prompt, and one experiment

**Status: proposed on 2026-08-22. Nobody has built any of it. Run this in a new session.**

A council of five agents proposed designs for a director. A director shapes the prompt before each
turn. These three ranked highest. All three cost **zero model calls**.

---

## The difference

| Today | After the three changes |
|---|---|
| The prompt holds every line the child has said. | The prompt holds one line the child has said. |
| The move comes from the turn number. | The move comes from what the person has not covered. |
| The child reads only the last line. | The child reaches a step from four turns back. |
| The child presses a step forever. | The child gives up on a step after three tries. |
| The context grows every turn. | The context stays about the same size. |

**No new model call. No new dependency. Three files change.**

---

## Proposal 1: the child sees one of its own lines

### What changes

`promptFor` in `src/child.ts` writes the whole conversation as a script. It writes every `them:` line
and every `you:` line. Change it. Write every `them:` line. Write only the LAST `you:` line.

### Why

Measured result 5 in `src/child.ts` states the cause. At temperature 0 the strongest example in the
prompt is the child's own previous line. That line compounds.

By turn six the prompt holds five lines the child wrote, on this subject, in one shape. It holds six
worked examples about other subjects. The child copies itself.

**This is the only measured cause of the repetition that this repository names.**

### Why not zero lines

The child must read its own last question. A person answers a question with a fragment. "The lever
bit. It just holds it." means nothing without the question above it.

### The cost

Nothing. The prompt gets shorter. It saves about 200 tokens by turn twelve.

---

## Proposal 2: the prompt names the words the person has not covered

### What changes

Add a director to `src/child.ts`. It reads the transcript before each turn. It builds two lists.

- **Open.** The person said this word. The child has never used it.
- **Closed.** The person said this word. The child has used it.

The director drops ordinary English with a stop list. `src/discriminate.ts` already holds
`STOP_WORDS` and `wordsIn`. Keep those two functions. The rest of that file measures nothing.

The director writes both lists into the late block, above the move.

### The injected text

```
them: it pushes everything round the bend and once it's going it just keeps going

[open: bend, tank, siphon]
[not open: handle, water, fast]

[Ask what makes the last thing they said happen. Do not use a technical or
subject-specific word they have not used. Ordinary everyday words are fine.]

you:
```

### Why

A bracketed list of nouns is not a sentence. The child cannot copy it into its line.

Measured result 7 says a named move becomes a template. A noun list gives that failure nothing to
bite.

The director also **skips a move that has no target**. Ask where a thing went, on a turn where
nothing went anywhere, and the child asks about nothing.

### The cost

Nothing. It is string work. It runs in about two milliseconds.

---

## Proposal 3: a word ages, and the child gives up

### What changes

Every open word becomes a debt. A debt holds two numbers.

- `openedTurn` — the turn where the person first said the word.
- `pressed` — the number of times the child has asked about it.

Score each debt: `age − 3 × pressed`. The highest score becomes the target for this turn.

**Write off a debt at three presses.** The child never asks about it again.

### Why

Two failures go away.

A gap from four turns back is now reachable. A director that reads only the last line cannot reach
it. This one can.

The child also stops nagging. It presses a step twice, like the four-line example in the bank. Then
it moves on. A listener that asks the same thing five times ends the session.

### The cost

Nothing. It is arithmetic over the lists from proposal 2.

---

## The experiment

### What to run

Five live conversations. Same person, same subject, same planted gap.

| Run | The prompt |
|---|---|
| A | Today's prompt. This is the baseline. |
| B | Proposal 1 only. |
| C | Proposal 2 only. |
| D | Proposal 3 only. |
| E | All three together. |

### How to run one

An agent plays the person. The agent explains a bike brake from memory. The agent is not a
physicist. The agent reaches for the word "friction" as though naming it explains the step.

**The agent must not volunteer the planted gap.** The gap is that friction turns the motion of the
wheel into heat.

Run eight turns. The agent reads each child line and answers that line. The agent must not plan its
turns before the run.

Use `muse-glimmer:30b-mlx` on Ollama. Use the same model for every run.

### What to count

Count these by hand or by script. **Count them. Never divide them.**

1. **Repeated openers.** Take the first three words of each child line. Count how many repeat.
2. **Repeated frames.** Count child lines that share a sentence shape with an earlier line.
3. **Questions about covered ground.** Count child questions about a step the person already gave.
4. **Reached the gap.** Did the person say heat? Did the child's questions drive it?
5. **Rule breaks.** Did the child explain, claim to understand, offer an analogy, or use a subject
   word the person never said?

### What would show a change

Proposal 1 must lower counts 1 and 2. That is its only claim. It claims nothing about the others.

Proposal 2 must lower count 3.

Proposal 3 must lower count 3 as well, and it must show the child giving up on a step.

**Run E must beat run A on counts 1, 2 and 3.** If it does not, none of this works.

### What would falsify each one

Proposal 1 fails if the child still repeats a frame with one prior line in view. The cause is then
not self-conditioning.

Proposal 2 fails if the child copies the noun list into its line, or if it ignores the list.

Proposal 3 fails if the child asks about a written-off word, or if giving up reads as losing
interest.

---

## What this experiment will not tell you

It counts the shape of the child's line. **It says nothing about whether the child is any good.**

One run of one conversation is not a rate. Five runs of one model is not a measurement. Every number
here is an engineering count about a machine.

No figure from this experiment may enter a tracked file.

---

## Two questions the owner must answer first

**1. Ban the opener, or supply it?** Four of five agents said to ban the child's last three openers.
One objected. It cited measured result 2: the team deleted "ohhh" and the collapse moved to "So".
A ban may only move the problem.

**2. Add state, or remove context?** Proposal 2 puts more text at the end of the prompt. Proposal 1
takes text out. Both claim the repetition. Both want the same end position, and measured result 9
says that position is the one that holds.

Run E tests them together. Run B and run C tell you which one does the work.
