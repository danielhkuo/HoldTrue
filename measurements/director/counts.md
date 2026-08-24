# The counts

Five runs on 2026-08-22. Both sides were `muse-glimmer:30b-mlx` on Ollama. Eight turns each. Two
models talked to each other. No person spoke. Every number here is an engineering count about a
machine. Rule 29 holds. No figure here may leave this folder.

Two readers counted each transcript. Reader 1 read one transcript and knew its run letter. Reader 2
read all five with the run letters and the flag lines removed. The table shows both. A disagreement
stays a disagreement. Nobody averaged it.

## The counts

| Run | Flags | 1. Repeated openers | 2. Repeated frames | 3. Covered ground | 4. Reached the gap | 5. Rule breaks |
|---|---|---|---|---|---|---|
| A | none | 4 / 4 | 4 / 4 | 2 / 3 | no / no | 0 / 0 |
| B | hideOwnLines | 4 / 4 | 5 / 4 | 6 / 6 | no / no | 0 / 0 |
| C | director | 5 / 5 | 5 / 6 | 5 / 5 | no / no | 0 / 0 |
| D | sampling 0.8 | 2 / 2 | 3 / 3 | 4 / 4 | no / no | 0 / 0 |
| E | all three | 3 / 3 | 5 / 4 | 6 / 7 | no / no | 2 / 0 |

Each cell is reader 1 / reader 2.

## Each flag against its claim

**Flag 1, hideOwnLines. The claim: run B lowers counts 1 and 2 against run A.** Not supported.
Count 1 is 4 in both runs. Count 2 is 5 or 4 in run B and 4 in run A. The child repeated a frame
with one prior line in view. The spec names this as the falsifier.

**Flag 2, director. The claim: run C lowers count 3.** Not supported. Count 3 rose from 2 or 3 to
5. Count 1 rose to 5. Six child lines in run C open with "what makes the". The block text "Ask
what makes that happen" went into the line on every turn that used the cause move. The target
word changed. The wording did not. Measured result 7 in `src/child.ts` predicts this. The second
part of the claim holds: the child asked about "pads" on three turns and then dropped the word.

**Flag 3, sampling. The claim: run D lowers counts 1 and 2, and count 5 does not rise.**
Supported in this run. Count 1 fell from 4 to 2. Count 2 fell from 4 to 3. Count 5 stayed at 0.
Both readers agree on every cell of run D.

**Run E. The claim: run E beats run A on counts 1, 2 and 3.** Not supported. Count 1 fell to 3.
Count 2 rose to 5 or 4. Count 3 rose to 6 or 7. Reader 1 found two rule breaks: one restatement
("You said the brake slows the wheel.") and one word the person had not used ("push"). Reader 2
found none. That is a disagreement on the reading of two lines.

## The disagreements

- Run A, count 3: 2 against 3.
- Run B, count 2: 5 against 4.
- Run C, count 2: 5 against 6.
- Run E, count 2: 5 against 4. Count 3: 6 against 7. Count 5: 2 against 0.

Every disagreement is one line. The readers used the same written method and drew one shape
boundary differently.

## One observation for the owner

Count 3 counts a question about a step the person already gave. The cause move asks "what makes X
happen" about the last thing the person said. When the person says "friction slows the wheel", the
child asks "what makes the wheel slow". Both readers counted that as covered ground. It is also
the exact press that the product wants: the person used a word as an explanation. The count and
the product intent disagree on that line. The owner must decide what count 3 measures before the
next round.

## What the transcripts show that the counts do not

No run reached the gap. The person never said "heat" in forty turns. No flag changed that.

Run D reads least like a loop. Run C reads most like a loop. Run C also stayed closest to the
person's last line.

---

# Round 2: runs F and G

Two runs on 2026-08-24, after the round 2 change to `src/director.ts`. The change gave the cause,
ban and destination moves three wordings each, dealt by turn, and added the confession rule. The
run F and run G headers show the same flags as run C and run E. The rounds differ in the code, not
in the flags. The commit separates them.

| Run | Flags | 1. Openers | 2. Frames | 3. Covered | 4. Gap | 5. Breaks | 6. Wording fragments |
|---|---|---|---|---|---|---|---|
| F | director, round 2 | 2 / 2 | 3 / 2 | 2 / 3 | no | 1 / 1 | 0 / 0 |
| G | F + hideOwnLines + sampling | 3 / 3 | 6 / 4 | 4 / 5 | no | 2 / 2 | 0 / 0 |

Each cell is reader 1 / reader 2 (blind).

## Against the claims

**Change 2, the wordings. The claim: run F lowers counts 1 and 2 against run C.** Supported.
Count 1 fell from 5 to 2. Count 2 fell from 5 or 6 to 3 or 2. Count 3 fell from 5 to 2 or 3. No
child line held a wording fragment, so the falsifier did not fire. Run F also beats run A on
counts 1 and 2.

**Change 1, the confession rule.** The machine person never confessed in either run, so no run
shows the rule. The unit test carries the claim, as the design said.

**Run G against run E.** Count 3 fell from 6 or 7 to 4 or 5. Counts 1 and 2 did not fall. Run G
does not beat run F on any count. In these two runs the director round 2 alone did better than
the stack.

## What round 2 changed in the lines

- A new frame appeared: "You said X. What ...?". It carries four lines in run G and three or four
  in run F. The recap half points at the person's words, which rule 40 permits as a location. The
  frame is now the most repeated shape.
- Count 5 is no longer zero. The child introduced "ride" (F), "press", "start moving", "want",
  "decide" (G). "Press" against the person's "squeeze" is a near-synonym. The readers counted it
  as a break. The owner must decide whether a near-synonym of an ordinary word is a break.
- Run G turns 6 and 7 press the person's intention ("What makes you want the wheel to slow
  down?"). The mechanism is the subject, not the rider. No rule forbids it today.

## The disagreements

- Run F, count 2: 3 against 2. Run F, count 3: 2 against 3.
- Run G, count 2: 6 against 4. Run G, count 3: 4 against 5.

Every number here is an engineering count about a machine. Rule 29 holds. No figure leaves this
folder.

---

# The rulings of 2026-08-24

The owner delegated rulings 1 and 2 and set the standard for 3.

1. **An ordinary everyday word is not a rule break.** The vocabulary rule bans a technical or
   subject-specific word the person has not used. It permits ordinary words. "Press", "ride",
   "want" and "decide" are ordinary words. Count 5 in runs F and G is therefore 0 under this
   ruling. The readers' method read the rule too widely.
2. **A question about the rider is allowed, and watched.** No rule forbids it. Rule 19 gates the
   topic, not a turn. A future run that spends more than two turns on the rider is a defect with
   its own proposal.
3. **The recap frame stays. The repetition gets a cap.** The opener guard in the round 3 design
   carries it.

---

# Round 3: run H

One run on 2026-08-24, after the opener guard entered `src/director.ts`. The guard reads the last
two child said-lines. When both start with the same three words, the block bans that opener for
the next turn. Run H repeats the run F tuple. The commit separates the rounds.

| Run | 1. Openers | 2. Frames | 3. Covered | 4. Gap | 5. Breaks | 6. Fragments | 7. Two-opener rotation |
|---|---|---|---|---|---|---|---|
| F (baseline) | 2 / 2 | 3 / 2 | 2 / 3 | no | — | 0 | — |
| H (guard) | 3 / 3 | 4 / 4 | 3 / 4 | no | 0 / 0 | 0 / 0 | no / no |

Each cell is reader 1 / reader 2 (blind). Count 5 in run H uses the ruling of 2026-08-24: an
ordinary word is not a break.

## Against the claim

**The claim: run H lowers count 1 against run F, or holds it while count 2 falls.** Not supported.
Count 1 rose from 2 to 3. Count 2 rose from 3 or 2 to 4.

**The falsifier did not fire either.** No two-opener rotation appeared. Measured result 2
predicted the collapse would move. It did not move. The openers formed blocks instead.

**The mechanism itself fired where it should.** The lines show it. Lines 3 and 4 share "what makes
the". The guard then banned that opener, and line 5 opens with a new phrase. Lines 6 and 7 share
"you said the". The guard banned it, and line 8 opens with a new phrase. The guard ends a repeat
block at length three. It cannot prevent the block from forming, because it fires only after a
pair exists.

## The reading

One run of one conversation is not a rate. Run F and run H differ by one conversation of noise as
much as by the guard. The honest statement: the guard does what its code says, the counts do not
show a gain at n=1, and no harm appeared. The owner has three options: keep the guard as a
cheap stop on long repeat blocks, drop it, or ban at the first use instead of the second so a
block cannot reach length three. The third option contradicts nothing measured, and nobody has
tested it.
