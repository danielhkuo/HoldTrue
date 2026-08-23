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
