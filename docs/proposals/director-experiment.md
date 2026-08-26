# Design: three flags on the child, and one experiment

**Status: built on 2026-08-22. Every flag defaults off. Five runs and their counts are in
`measurements/director/`. The owner has not ruled on any flag. No flag defaults to on. `src/`
holds no stem match for the contradiction rule.**

This document replaces the experiment section of [`director-plan.md`](director-plan.md). The three
proposals in that plan stay. A council of four research agents added one remedy and changed one.
`docs/research/repetition-council.md` holds the four reports.

## What changes

| Today | After the three flags |
|---|---|
| The prompt holds every line the child has said. | The prompt holds the last line the child said. |
| The turn number picks the move. | The words the person said pick the move. |
| The child reaches only the last line. | The child reaches a word from four turns back. |
| The child presses a word forever. | The child drops a word after three presses. |
| The model runs at temperature 0. | The model can run at temperature 0.8. |

Every flag defaults off. The app behaves as today until a run sets a flag. No flag adds a model
call. No flag depends on one backend. Rule 1 holds.

## The three flags

`speak` in `src/child.ts` takes an `Options` object. Every field has a default.

```ts
export type Options = {
  readonly hideOwnLines: boolean  // default false
  readonly director: boolean      // default false
}
```

`Options` holds `hideOwnLines` and `director` only. The temperature is not a field of `Options`.
`open(backend, temperature)` and `ollama(model, temperature)` in `src/model.ts` take the
temperature as a parameter of the model handle. The default is 0. `CHILD_SAMPLING=1` sets 0.8 on
a separate handle for the child. The end phase keeps its own handle at temperature 0.

### Flag 1: `hideOwnLines`

`promptFor` writes every `them:` line. It writes only the last `you:` line. An earlier `you:` line
does not appear. The child still reads its own last question, so a fragment answer keeps its
meaning.

Mechanism. A repeated phrase raises its own probability with every repeat. Holtzman et al. 2019
and Xu et al. 2022 measured this. Measured result 5 in `src/child.ts` saw it in this build.

### Flag 2: `director`

`lateBlock` takes the history instead of the turn index. A pure function `direct(history, you)`
returns the block. It reads words only. It never calls a model. Rule 33 holds.

The function builds two tables from `wordsIn` and `STOP_WORDS` in `src/words.ts`.

- `said`: every content word in every `them:` line, with the turn where the person first said it.
- `pressed`: every content word in every `you:` line, with a count of the lines that hold it.

A word in `said` is a debt. Its score is `age − 3 × pressed`, where `age` is the number of turns
since the person first said it. A word with three presses is written off. The director never names
a written-off word again.

The director picks the move by one ordered list. The first rule that fires wins.

1. **Contradiction.** An earlier `them:` line holds `can't`, `cannot`, `doesn't`, `never`, `won't`
   or `isn't` next to a noun. The newest `them:` line holds the same noun with `can`, `does`,
   `goes`, `will` or `is`. The affirmation must sit in the newest line. The block names the noun:
   `[They said two things about <noun> that do not agree. Put both together and ask which one holds. ${VOCABULARY}]`
2. **Word ban.** The top debt has two presses. The block names it: `[They keep using the word "<word>" as if it explains the step. Say you do not know that word and ask for the step without it. ${VOCABULARY}]`
3. **Cause.** The top debt has zero or one press. The block names it: `[They said "<word>". Ask what makes that happen. ${VOCABULARY}]`
4. **Destination.** No debt is open. The block carries today's second move with no word: `[Ask where a thing they mentioned goes, or what happens to it next. ${VOCABULARY}]`

The noun in rule 1 is the nearest content word before the negation, within three words. In "the
water can't get past" the noun is "water". A match needs the same stem on both sides. `stem` does
not exist in `src/` today, so a match needs the same word.

The block names one word. The word changes every turn. The block text therefore rarely repeats.
Measured result 7 says a fixed sentence becomes a template. A changing word gives it less to copy.

### Flag 3: the sampling temperature

`open(backend, temperature)` and `ollama(model, temperature)` in `src/model.ts` take the
temperature as a parameter. The default is 0. `src/server.ts` builds a separate handle for the
child. `CHILD_SAMPLING=1` sets that handle to 0.8. The end phase keeps its own handle at 0. Every
backend holds `temperature`: Ollama, an OpenAI-compatible endpoint and the Anthropic API. `min_p`,
`top_p`, a penalty and a logit bias stay out. `min_p` exists only on the MLX runner. Some Claude
models refuse `temperature` and `top_p` together. A penalty punishes the person's nouns, which the
child must reuse.

Mechanism. Temperature 0 always picks the most probable sentence. After one repeat the most
probable sentence is the one the child already said. Rule 34 already accepts a non-deterministic
runner.

### How the flags reach `speak`

`src/server.ts` reads three environment variables at start: `CHILD_HIDE_OWN_LINES`,
`CHILD_DIRECTOR` and `CHILD_SAMPLING`. A value of `1` sets the flag. `CHILD_HIDE_OWN_LINES` and
`CHILD_DIRECTOR` set the two fields of the `Options` object that the server passes to `speak`.
`CHILD_SAMPLING` sets the temperature of a separate model handle for the child. The end phase
keeps its own handle at temperature 0. `POST /api/turn` does not change. `src/experiment.ts` sets
the flags and the temperature in code and does not use the server.

## The experiment

### The runs

| Run | Flags |
|---|---|
| A | none. This is the baseline. |
| B | `hideOwnLines` |
| C | `director` |
| D | `sampling` |
| E | all three |

### The harness

`src/experiment.ts` runs one conversation. It takes one run letter. It calls `speak` directly,
like `src/rig.ts`. It does not fake the model. A model plays the person. The person prompt says:

- You explain a bike brake from memory.
- You are not a physicist. You use the word "friction" as if the word explains the step.
- You never say that friction turns the motion of the wheel into heat. That is the planted gap.
- You answer the child's last line in one or two spoken sentences.

Both sides use `muse-glimmer:30b-mlx` on Ollama. Eight turns. The script writes the transcript to
`measurements/director/<run>.md`. Git tracks that folder. The file header states that a machine
talked to itself. Rule 29 holds: no figure from this folder argues a rule change.

### The counts

Five subagents run the five conversations in parallel. Each agent counts five things on its own
transcript. A sixth agent reads all five transcripts without the run letters and counts again. The
report shows both counts. A disagreement stays a disagreement. Nobody averages it.

1. **Repeated openers.** Take the first three words of each child line. Count the lines whose
   three words match an earlier line.
2. **Repeated frames.** Count the child lines that share a sentence shape with an earlier line.
3. **Covered ground.** Count the child questions about a step the person already gave.
4. **Reached the gap.** Did the person say "heat"? Did a child question drive it? Yes or no.
5. **Rule breaks.** Count the child lines that explain, claim to understand, offer an analogy, or
   use a subject word the person never said.

### What each flag claims

- Flag 1 must lower counts 1 and 2 in run B. It claims nothing else.
- Flag 2 must lower count 3 in run C. Run C must also show the child dropping a word.
- Flag 3 must lower counts 1 and 2 in run D. Count 5 must not rise.
- Run E must beat run A on counts 1, 2 and 3.

### What falsifies each flag

- Flag 1 fails when the child repeats a frame with one prior line in view.
- Flag 2 fails when the child copies the block text into its line, or asks about a written-off
  word, or asks about a word the person did not say.
- Flag 3 fails when count 5 rises in run D.

## The tests

Every test runs without a model. Rule 32 holds.

- `promptFor` with `hideOwnLines` holds the last child line and no earlier child line.
- `promptFor` without the flag returns the same string as today.
- `direct` picks the contradiction move for "can't" then "can" on one noun.
- `direct` picks the word ban move for a word with two presses.
- `direct` names a word the person said and the child never used.
- `direct` never names a word with three presses.
- `direct` picks the destination move when no debt is open.
- `lateBlock` without the flag returns the same string as today.
- The Ollama request body holds `temperature: 0` without the flag and `temperature: 0.8` with it.

## What ships

Nothing ships from this work. Every flag defaults off. The owner reads the counts and rules on
each flag. A flag that wins becomes the default in a later commit.

## What this experiment does not tell you

It counts the shape of the child's line. It says nothing about whether the child is any good.
One run of one conversation is not a rate. Every number is an engineering count about a machine.
No figure from this experiment may enter a document outside `measurements/director/`.

---

# Round 2: the confession move, and the wordings

**Status: designed on 2026-08-24 from the judgment in
`docs/research/move-coverage-council.md`. Not built.**

Round 1 measured two defects in the director. The block wording went into the child's line
(run C, count 1 at 5). A confession got the cause move on an old word. Round 2 changes
`src/director.ts` only. The flags, the handles and the server do not change.

## Change 1: the confession rule

`direct` gets one rule between the contradiction and the debts. The newest `them:` line matches
this pattern, case blind:

```
\b(?:don'?t|do not|dunno|can'?t|cannot)\s+(?:know|remember)\b|\bnot\s+(?:really\s+)?sure\b|\bno idea\b
```

The block: `[They said they are not sure of that part. Have them say the last part they are sure of. ${VOCABULARY}]`

The trigger is a literal phrase list. Plain code reads it. A false fire costs one gentle turn. A
miss makes the child press an old word right after a confession, and the transcripts show the
person then repeating a line word for word.

## Change 2: three wordings for each frequent move

The cause move, the word ban and the destination move each get three wordings. The turn index
deals one: `history.length % 3`. Each wording is a direction. No wording holds a question
sentence, so the model has no question to copy. Run C measured the copy: "Ask what makes that
happen" became "What makes ... happen?" on every cause turn. The contradiction and the confession
keep one wording each. They fire rarely.

The wordings live in one exported constant, so a test can pin the deal without repeating the
strings.

- Cause, naming the word W: "They said "W". They did not say what makes that happen. Go after
  that missing piece." / "Something causes "W", and they skipped it. Get them to say the step
  behind it." / "The word "W" arrived with no cause behind it. Pull that cause out of them."
- Ban: "They keep leaning on the word "W" as if it explains the step. Say you do not know that
  word, and get the step without it." / "The word "W" is doing all the work. Tell them the word
  means nothing to you, and get that part again in plain words." / ""W" keeps standing in for the
  explanation. Get them to say the step another way, without it."
- Destination: "Something they mentioned goes somewhere, or turns into something else. Find out
  where, or what." / "Pick a thing they mentioned, and chase what happens to it next." / "A thing
  in their story moves on. Follow it one step further."

Every block still ends with the vocabulary sentence.

## The runs

| Run | Flags |
|---|---|
| F | director, round 2 |
| G | director round 2, hideOwnLines, sampling 0.8 |

Eight turns each. The same person prompt, the same model, the same five counts, two readers.
Compare run F with run C and run A. Compare run G with run E and run D.

## What each change claims

- Change 2 must lower counts 1 and 2 in run F against run C. The falsifier: the child copies a
  wording fragment such as "missing piece" into its lines, or counts 1 and 2 stay at run C level.
- Change 1 has no count. Its check is direct: feed `direct` a confession and read the block. The
  machine person rarely confesses, so the runs may never show it. The unit test carries the claim.
- Run G against run E answers whether the director round 2 and sampling stack.

## The tests

- A confession in the newest line returns the confession block. An old debt does not outrank it.
- "not sure" and "no idea" and "can't remember" trigger. "the pressure" does not.
- The cause block at three consecutive turn indexes carries three different wordings.
- The dealt wording matches the exported constant at index `history.length % 3`.
- No wording contains a question mark.

---

# Round 3: the opener guard

**Status: designed on 2026-08-24 from three owner rulings. The rulings are in
`measurements/director/counts.md` under "The rulings of 2026-08-24". Not built.**

Round 2 produced a new most-repeated shape, "You said X. What ...?". The owner ruled: keep the
frame, cap the repetition.

## The change

`direct` gets a guard after the move is chosen. Plain code reads the last two child lines in the
history. When both start with the same three words (lower case, punctuation stripped), the block
gains one line before the closing bracket: `Do not start with: "<the three words>".`

The guard reads the child's lines, not the person's. Rule 10 is untouched. The guard is one
string compare. No model judges anything. Rule 33 holds. The ban is a literal phrase.
`docs/research/child-prompt-ab.md` measured that a literal phrase ban works and a shape ban does
not.

## The run

Run H: the director round 2 plus the guard, temperature 0, eight turns, the same person prompt,
the same counts, two readers. Compare with run F.

## The claim and the falsifier

The guard must lower count 1 against run F, or hold it at run F's level while count 2 falls. The
falsifier is measured result 2 in `src/child.ts`: the collapse moves, and the lines rotate
between two openers on a period of two. A reader must look for that rotation by name.

## The tests

- Two child lines with the same first three words put the ban line in the block.
- The ban line quotes those three words.
- Two child lines with different openers add no ban line.
- A history with one child line adds no ban line.
- The guard reads the last two child lines only. An older repeat adds no ban line.

---

# Round 4: the third backend, and the subject line

**Status: designed on 2026-08-25. The owner asked for the backend test. The subject line follows
the run J rider drift. Not built.**

## Change 1: the OpenAI-compatible backend

`src/model.ts` gains a third backend kind. Run J showed the child floor near 9B, and the owner's
realisation stands: the live phase needs speed, so the user brings a fast backend or a key. An
OpenAI-compatible endpoint covers a local proxy and most providers.

```ts
| { readonly kind: 'openai'; readonly baseUrl: string; readonly key: string; readonly model?: string }
```

The request goes to `${baseUrl}/chat/completions` with the model, one system message, one user
message, and the temperature. The key is optional. A non-empty key adds a bearer header. An empty
key sends no `authorization` header. A local proxy is the case that needs no key. The answer is
`choices[0].message.content`. Rule 23: no throw. Rule 25: a 401 ("the endpoint rejected the key"),
a 404 and a dead endpoint each keep a distinct reason. Rule 24: the attribution reports the
`model` field of the response body when it exists.

The harness reads three variables for the child seat: `CHILD_OPENAI_URL`, `CHILD_OPENAI_KEY` (or
`CURSOR_API_KEY`), and `OLLAMA_CHILD_MODEL` keeps naming the model. When `CHILD_OPENAI_URL` is
set, the child runs on the OpenAI backend and the person stays on Ollama.

## Change 2: the subject line

Run J drifted: six turns of eight pressed the rider. The system message names the subject, and
attention to the system message decays across turns. The remedy that measured best in round one
was the restated rule near the end of the context. Apply it to the subject.

`Options` gains `anchor` (default false). With the flag, and a topic present, every director
block gains one sentence before the vocabulary sentence: `The subject is <topic>. Ask about the
machine, not about them.` `direct` takes the topic as a parameter. `promptFor` passes it through
from `speak`.

## The runs

| Run | Child seat | Flags |
|---|---|---|
| K | `composer-2.5` over the OpenAI backend | director, anchor off |
| L | `composer-2.5` over the OpenAI backend | director, anchor on |

The same person model, the same counts, plus the rider-turn count from run J. Latency per child
turn goes in the transcript header: the harness already records seconds per exchange.

## The claims

- The backend claim is speed with guards held: the child turn falls under five seconds, and the
  behaviour guard counts stay at the 30B level. The falsifier: statements, non-questions or
  restatements appear as they did at 4B.
- The anchor claim: run L cuts the rider turns against run K. The falsifier: the child copies
  "the machine" or "about them" into its lines, or the rider count does not fall.

## The tests

- The OpenAI request body, the bearer header, the url join, and each failure reason: faked fetch,
  no network. Rule 32.
- The anchor: with the flag and a topic, the block ends with the subject sentence then the
  vocabulary sentence. Without the flag, or without a topic, the block is unchanged.
