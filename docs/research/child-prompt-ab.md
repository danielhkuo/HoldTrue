# The child prompt: what was tested, and what survived

Recorded 2026-08-20. This file holds the result. The raw material was deleted on purpose, and this
file is what replaces it.

## What ran

Seventeen prompt designs ran in live conversations. A model played the person explaining. Every run
used the same subject, a bike brake, and the same planted gap. The gap was that friction turns the
motion of the wheel into heat.

- Six designs on `composer-2.5`: examples only, a described persona, a full chatbot prompt with
  named sections, a spoken-first design, a design of prohibitions only, and a design with no persona.
- Five minimal designs on `composer-2.5`, from 8 words to 69 words, with NO prohibitions.
- Two designs on `muse-glimmer:30b-mlx`, testing one line of the shipped prompt.

## The five results that changed the code

**1. A named move becomes a template.** One design listed four permitted moves as bullets. The model
took the most literal bullet and produced one sentence frame for six turns: "I stopped following at
the pads grip the rim part." The bullet read "say where you stopped following them". Naming a move
gives the model a sentence to inflect. The move list is deleted from `systemFor` for this reason.

**2. Prohibitions are load bearing.** Five minimal designs carried no prohibitions. All five claimed
to understand. Three explained the subject back to the person. One delivered a four paragraph
lecture and taught the planted gap the moment the person admitted a doubt. The prohibitions stay.

**3. A banned phrase list works. A banned shape does not.** One design listed "I see", "That makes
sense" and "Got it" as literal strings. It produced no stock phrase in eight turns. The same design
still restated the mechanism, because a restatement is a shape and a list cannot hold every shape.
Literal strings belong in the prompt. A shape needs an example or a check in code.

**4. Every design locked into one sentence frame by about turn three.** Seventeen designs, from 8
words to 779 words, with and without a persona, with and without examples. No prompt fixed it. The
cause is partly in the model rather than the prompt: preference training reduces output diversity,
and one prior occurrence of a phrase raises the chance of the next one.

**5. Examples set the length, and the model copies them closely.** An instruction to be brief
changed nothing. A design with terse examples produced turns of a human length. A design with
sixteen words of instruction replied with bold bullets and a summary table. The model also copies an
example line almost verbatim, so an example is a template and not a suggestion.

## The A and B test

One line was tested on the shipped prompt. Run A opened with "You are a curious 10-year-old." Run B
deleted that sentence and changed nothing else.

**The result is null.** Six of eight turns were near identical. Neither run leaked a subject word.
Neither claimed to understand. Neither reached the planted gap. B pressed slightly better in one
place, and that is not enough to rule on.

**A ships.** The line costs nothing and it buys nothing. B is one deletion away: remove the sentence
"You are a curious 10-year-old." from the first line of `systemFor`, and change nothing else.

## What the shipped prompt achieved

Both runs held every guard at once, for the first time in seventeen designs.

- No analogy. No claim of understanding. No restatement. No explaining.
- **No subject word that the person had not used first.** Every noun came from the person: lever,
  cable, brake, hinged, bolt, pads, rim, wheel, friction.
- The word ban move fired twice on the exact dodge:
  "I don't know what friction means. Say that bit again without it."

## The open defect

**The move scheduler now causes the repetition it was built to prevent.** Three moves cycle on a
period of three, so three question shapes appear on a period of three. "What makes..." arrived on
turns 1, 4 and 7. "What happens to..." arrived on turns 2, 5 and 8.

The cause is deeper than the period. The block says "ask what makes the last thing they said
happen", and the model writes "What makes...?". The instruction is inflected straight into the line.
That is result 1 again, in a new place.

The remedy is not tested. Give each move several wordings, so the block text rarely repeats. Write a
block as a direction of attention rather than as a sentence to say. "They named a thing without
saying what it does. Find it." is harder to copy than "ask what makes it happen".

## What nobody measured

Every result here is one run of one conversation. Nothing was repeated. No design was scored against
another on a fixed set. Treat every line above as the best evidence available and not as a rate.
