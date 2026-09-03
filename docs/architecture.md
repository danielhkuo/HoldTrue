# Architecture

HoldTrue has two phases. The live phase is a conversation. The end phase is a review. The owner
built both phases. `src/` holds Check, Diff, Probe and Close, and `POST /api/end` runs them.
No eval measures what the end phase produces.

This document names every part, and gives the input, the output and the kind. A part is a model call
or plain code. The document says which one.

## The parts and the order

```
  LIVE PHASE  --  built
    the user says a line
         v
    [ CHILD    model ]  one short line back, one model call per turn
         v
         v
    the user presses the End button
         v
    TRANSCRIPT          every turn marked "user" or "child"
         v
  END PHASE  --  built, and measured by nothing
    [ 1 CHECK  model ]  mechanism, claims, intrusions
         v
    [ 2 DIFF   code  ]  ids and flags only, never text
         v              rows: contradiction, then intrusion, then omission
    [ 3 PROBE  model ]  one question, on the first row only
         v
    [ CHECK again    ]  the probe answer, and the verdict on that row
         v
    [ 4 CLOSE  model ]  one statement for every row
         v
    the review screen
```

## The live phase

The user explains a mechanism out loud, from memory. The child answers with one short line. One
turn runs in four steps, and it makes one model call:

1. The user says a line. The user types it, or the user speaks it and the ear writes it. The
   speech layer below owns the ear.
2. The server appends the line to the transcript as a user turn.
3. The server makes one model call, and the model returns one line.
4. The server appends that line to the transcript as a child turn.

The child stays ignorant. It reads only three things. It reads the system prompt with its worked
examples. It reads the transcript of this session. It reads the line the user just said.

The child never reads a source text, an answer key, or the Check output. `docs/product.md` owns the
reason. The live phase produces no findings. It produces the transcript.

## The transcript

The transcript is one ordered list of turns. Each turn carries a speaker mark, the text and an
index. `src/types.ts` sets this shape. The index is the position of the turn in the list.

```json
{ "topic": "How a fridge makes things cold", "turns": [
    { "speaker": "user",  "text": "the compressor squishes the gas", "index": 0 },
    { "speaker": "child", "text": "Why does that make it hot?",      "index": 1 } ] }
```

Three rules hold for every transcript:

- Every turn carries a speaker mark. The mark is `user` or `child`.
- The code must not infer the mark from the text. The server sets the mark when it appends the turn.
- Every turn carries an index. Check reads the index. Probe reads the index.

A turn holds no kind field and no reason field. A child turn that gave no line never enters the
transcript. `src/server.ts` holds that reason beside the transcript. The screen then shows the
silence.

The mark exists for one reason. The child invents things. A recorded probe shows the child asking
about a door that the user never mentioned. Without the mark, Check reads that invented door as a
claim of the user. Close then corrects the user for a sentence the child wrote.

Check must take the claims from the user turns only. Check must use the child turns for one purpose.
That purpose is to find a child line that asserts a cause the user's words do not contain.
`src/session.ts` holds the marked list, and the marked list is the one source. `src/server.ts`
derives the pairs for the child prompt from that list.

## The session end

The design ends a session with a button. The user presses the button. That press is the only end
signal. `src/page.html` holds the button, and the button calls `POST /api/end`.

A child that goes quiet is a feature for a later build. No code implements quiet. No document may say that
quiet ends a session today. The session end starts the end phase. A session must not end with a
question open. The last child question stays open until Close answers it.

Decision 21 adds a soft cap at turn twelve. At the twelfth user turn, `src/page.html` shows one
line: "This is a good place to end and see the review." The line is a nudge, not a signal. The
button stays the only end signal. Rule 44.

## The end phase

Four parts run in order. Part 2 is plain code. Parts 1, 3 and 4 are model calls. `src/` holds all
four parts, and `POST /api/end` runs them.

### 1. Check -- a model

Input: the topic and the marked transcript. The second call also carries the probe answer. Check
reports, and Check does not decide what the app shows.

Output has four fields:

- `mechanism` -- a list of links. Each link carries an `id`, a `cause`, a `relation`, an `effect`
  and a `covered` flag. A covered link also carries the `span` of the user words that cover it.
- `claims` -- the claims of the user. Each claim carries an `id`, a `text`, a `correct` flag and a
  `span`. The `correct` flag false means the statement is untrue. No field is named `truth`.
- `intrusions` -- the child lines that assert a cause the user's words do not contain. Each
  intrusion carries an `id`, a `turnIndex` and a `text`. The `turnIndex` names the child turn. The
  `text` holds the words of that child turn. Probe reads the `turnIndex`, and Close reads the
  `text`.
- `verdict` -- present only when the app supplies a probe answer. It carries a `rowId` and a
  `supplied` flag. The `rowId` names one Diff row, such as `omission:L2`. The `rowId` never holds a
  link id, such as `L2`.

A `span` is not a string. A `span` is a pair of numbers: `start` and `end`. Both numbers are
offsets into the joined user text. `src/types.ts` sets this shape.

```json
{ "mechanism": [
    { "id": "L1", "cause": "the compressor", "relation": "compresses", "effect": "the gas",
      "covered": true, "span": { "start": 0, "end": 31 } },
    { "id": "L2", "cause": "compression", "relation": "raises", "effect": "the temperature",
      "covered": false, "span": null } ],
  "claims":     [ { "id": "C1", "text": "the coils make the cold", "correct": false,
                    "span": { "start": 32, "end": 55 } } ],
  "intrusions": [ { "id": "I1", "turnIndex": 3, "text": "Is it the fan that pushes it up?" } ] }
```

### Why identity lives in Check and not in Diff

Check decides identity. Check judges that "the gas gets squeezed" and "compression" name the same
link, and Check sets `covered` on that link. Only a model can make that judgement. A text
subtraction cannot do it. A text subtraction turns a paraphrase into a false omission. The
product then tells the user they skipped a step that they said. That is the worst failure the review
can produce, because it corrects a correct explanation.

So Check carries the whole judgement and writes the answer into one flag. Diff then needs no
judgement at all.

### 2. Diff -- plain code

Input: the Check output. Output: an ordered list of rows.

Each row carries a `kind`, its own `id` and the id of its source. A contradiction row carries a
`claimId`. An intrusion row carries an `intrusionId`. An omission row carries a `linkId`. The row
`id` holds the kind and the source id, with a colon between them, such as `omission:L2`. Probe and
Close read the source id, and they then find the entry in the Check output.

Diff reads three things and nothing else. It reads the `id` of a link, a claim or an intrusion. It
reads the `correct` flag of a claim. It reads the `covered` flag of a link. Diff never reads
`cause`, `relation`, `effect`, `span` or any other text. Diff never compares text.

The arithmetic:

- a `contradiction` row for every claim whose `correct` flag is false;
- an `intrusion` row for every entry in `intrusions`;
- an `omission` row for every link whose `covered` flag is false.

Diff emits every contradiction first, then every intrusion, then every omission. A false belief
matters more than an invented step, and an invented step matters more than a step the user left out.

**The property a test must check.** Take one Check output. Replace every text field with a
different string. Keep every `id`, every `correct` flag and every `covered` flag. Diff must return
the same rows in the same order. A test that passes this property proves that Diff reads no text.

Two more tests hold. Diff is a pure function, so the same input always returns the same output. Diff
makes no model call and holds no prompt.

Two rules follow. A model must not compute the intrusion row. A model fills a gap by default,
and a model cannot detect its own gap filling. The owner must not fold Diff into Check, and must not
fold Diff into Probe.

### 3. Probe -- a model

Input: the first row of the Diff output, the Check output and the marked transcript. Output: one
question. Probe reads the source id of the row, and Probe then finds the entry in the Check output.
An intrusion row gives the `turnIndex`, and Probe takes the user words before that turn.

Probe runs once, and it takes the first row and no other row. The user answers. The app sends the
answer to Check, and Check returns the `verdict` field for that row.

Probe exists because Check reads words only. Check cannot separate "the user did not say the link"
from "the user does not know the link". Only a question separates the two. Probe asks one question,
and Probe must not supply the answer.

### 4. Close -- a model

Input: every row, the Check output, the verdict and the model. `src/close.ts` takes these four
things in this order. Close never receives the probe question. Close never receives the answer of
the user. Check reads that answer, and the verdict carries the result.

Close runs for every row. Output is one short statement per row. The statement gives the claim of
the user first, in the words of the user. It gives the missing mechanism, or the correction, second.

Close uses the verdict for the probed row. Close finds that row with the `rowId` of the verdict.
For every other row, Close must state that the user did not say the link. Close must not state that
the user does not know the link. The app asked no question about those rows, so the app holds no
evidence about them. Close must not show a score, a rating, a grade or a progress bar. Close must
not say that an explanation was unclear.

## The provided model, and the removed toggle

Decision 19 removed the omniscient toggle. The app showed two kinds of review, verified and
unverified, and the owner ruled that a wrong finding from a model that may not know the mechanism
is a risk the app must not take. One review remains. No code and no document may print the word
`verified` or the word `unverified`.

The end phase always runs on the provided model. Rule 53. Check, Probe and Close all run on the
provided model, for every session. The startup model never runs the end phase.

Decision 20 sets the guard. The app refuses to start a session when it holds no provided model.
Law 1 gives the reason: a session must not end with a question open, and only the review closes
that question. A session that cannot end with a review must not begin. The refusal names the fix:
set `HOLDTRUE_PROVIDED_KEY` and `HOLDTRUE_PROVIDED_MODEL`, or set `HOLDTRUE_PROVIDED_URL` and
`HOLDTRUE_PROVIDED_MODEL`.

There is no silent fall back. If the provided model fails, the app must not use the startup model
in its place without telling the user. The app states the failure on the screen. Rule 45 and rule
46 hold.

## The model layer

There is no default model. At startup the user makes one choice. The user sets up Ollama, and the
model runs on the machine of the user. The user enters an API key for a supported provider
instead. That one model runs the child, and only the child. Rule 53 keeps it out of the end phase.

The provided model is separate from the startup choice. It serves the whole end phase, for every
session that starts. Rule 53.

The owner sets the provided model one of two ways. The owner sets `HOLDTRUE_PROVIDED_KEY` and
`HOLDTRUE_PROVIDED_MODEL`, and the app opens Anthropic with that key. The owner sets
`HOLDTRUE_PROVIDED_URL` and `HOLDTRUE_PROVIDED_MODEL` instead, and the app opens that
OpenAI-compatible endpoint. A local proxy needs no key, so `HOLDTRUE_PROVIDED_KEY` stays optional
when the URL is set. The model name is required either way. A missing required variable gives no
provided model, and `POST /api/start` then refuses to start a session. Decision 20.

`HOLDTRUE_PROVIDED_MODEL` may hold several names with commas between them. Every name opens on
the one endpoint. The pick screen then shows the names, and the person picks one for the session.
No name starts picked. Rule 50. `POST /api/start` takes the choice as `providedModel`, and it
refuses a session with no choice when the list holds several names. The review runs on the
chosen model for the whole end phase. Rule 53. The talk screen names the choice. Decision 25.
`src/provided.ts` reads the variables and names one backend for each model.

An OpenAI-compatible endpoint gets a token budget of 16384 for each call. A model that thinks
spends tokens before its answer. A budget of 4096 gave such a model empty text on 2026-09-01. Anthropic keeps the budget of 4096, because thinking there is off unless a request
asks for it.

Every backend implements one interface. `ModelHandle` has two methods. `identify` returns the
attribution, and `ask` sends one system message and one user message. The child, Check, Probe and
Close call this interface, and they never call a provider API. `identify` reads the name from the
thing that answers, because an attribution must name what actually ran.

## The speech layer

The app takes typed words, and it takes spoken words. `src/speech.ts` holds the ear and the
voice. The ear turns one recording into words. The voice turns one line of the child into audio.
Both run inside the server process, on the machine of the user, on the sherpa-onnx runtime. The
package is `sherpa-onnx-node`. No audio leaves the machine. No audio reaches a disk. Cases V1,
V2 and V3. Decision 24.

There is no default speech model. Rule 50. The owner names two directories:

- `HOLDTRUE_STT_DIR` holds a speech-to-text export for sherpa-onnx. The code knows two layouts.
  The first is a NeMo transducer, which is the layout of NVIDIA Parakeet TDT. The second is
  Qwen3-ASR.
- `HOLDTRUE_TTS_DIR` holds a text-to-speech export for sherpa-onnx. The code knows two layouts,
  Kokoro and Supertonic.
- `HOLDTRUE_TTS_VOICE` picks the speaker id of the voice model. It defaults to zero. A speaker id
  is a setting of one named model, and not a model choice.
- `HOLDTRUE_SPEECH_THREADS` sets the thread count of the engine. It defaults to four.
- `HOLDTRUE_TTS_LANG` sets the language of a Supertonic voice. It defaults to `en`. Kokoro does
  not read it.

A missing variable gives no ear or no voice. The page then hides the Talk button, or it plays no
audio. A directory that the code does not know gives a stated reason, and `GET /api/boot` reports
the reason. The code reads the directory listing to pick the layout. It opens no model file
itself. The sherpa-onnx project publishes the exports on its GitHub releases page, under the tags
`asr-models` and `tts-models`. The owner downloads one archive of each kind, unpacks it, and
names the directory in the variable. `.claude/launch.json` holds a `voice` configuration that
loads `.env.local` and starts the app. The unit tests and the end-to-end check need no model.

One spoken turn runs in five steps:

1. The page records the microphone at 16 kHz through an AudioWorklet.
2. The page sends the samples as 16-bit PCM to `POST /api/hear`, with the rate in a header.
3. The ear decodes the samples inside the process. It returns the words as the engine wrote them.
4. The page sends those words to `POST /api/turn`, the way it sends typed words. Rule 10 holds
   between the ear and the model. No code trims a filled pause, a repeat or a full stop.
5. The page sends the line of the child to `POST /api/say`, and it plays the WAV that comes back.

`POST /api/hear` makes no model call, so rule 1 holds for the turn. The ear returns words only.
It returns no confidence, no timestamp and no pause. Rule 18. The attribution names the model
directory that answered and the runtime. Rule 24. On the review screen the same Talk button
fills the probe answer, and the user presses Answer.

Every document must state one limit. The speech model decides which sounds become words.
The code does not. In the round trip of 2026-09-01, Parakeet TDT v3 and Qwen3-ASR both wrote
"um" and "uh" from a synthetic voice. No measurement says how often they do so on a real voice.
Rule 10 binds the code. It cannot bind the model.

Four models ran on 2026-09-01, on one Apple M5 Max, from the int8 exports of sherpa-onnx. The
figures below are engineering measurements from one machine and one sentence of eight seconds.
Rule 28. The licence column repeats the licence file in each archive.

| Model | Kind | Licence | Time for the sentence |
|---|---|---|---|
| NVIDIA Parakeet TDT 0.6B v3 | ear | CC-BY-4.0 | 0.19 s |
| Qwen3-ASR 0.6B | ear | Apache-2.0 | 0.71 s |
| Kokoro v1.0 | voice | Apache-2.0 | 1.47 s |
| Supertonic 3 | voice | MIT | 1.56 s |

## Consent and disclosure

The app must disclose where the text of the user goes, and it must name the destination it
actually uses. An API key sends the transcript to that provider during the conversation. A local
Ollama backend sends nothing off the machine during the conversation. The ear and the voice send
no audio anywhere. The words that the ear writes go where typed words go, and the disclosure
says so. Every session sends the
whole transcript to the provider of the provided model at the end, because the end phase always
runs there. Rule 53.

The app must take the consent of the user before the first send. Decision 21 moves that consent to
the start screen, one checkbox, because every session now sends text at the end.

The owner has not decided the retention terms, the training terms and the deletion terms. `docs/decisions.md`
records them as an open decision. The owner must answer it before release. Do not invent a policy.

## Persistence

The server holds one session in memory. The server writes nothing to disk. Two browser tabs share
the one session. The findings appear once, and the app loses them when the process stops.

## The failure rule

A model that the app cannot reach is a result. It is never an exception. `ask` returns a string or
`null`. `ask` never throws. Each part states its own failure:

- the child returns a silent turn, and the turn carries a reason;
- Check returns a failure result. The app then states that no review ran. The app also states that
  the questions stay open;
- Probe returns a failure result. Close then runs on every row with no verdict. Close must state
  that the user did not say the link. Close must not state that the user does not know the link;
- Close returns a failure result, and the app shows the row and names the failure.

If the end phase cannot run at all, the app must state two things on the screen. The app must
state that no review ran. The app must state that the questions stay open. This is a stated failure,
and the app must not hide it.

The app must give a distinct reason for each cause:

- the local backend does not run;
- the provider rejected the key;
- the model name does not exist;
- the request timed out;
- the model spent its token budget before the answer. A thinking model does this.

The app must not render every failure as one sentence. The app must not show a stack trace. The app
must name a configuration that it cannot support.

## What exists today

Both phases run. Six files hold the live phase:

- `src/child.ts` holds the child prompt and the one turn;
- `src/model.ts` holds the Ollama backend and the Anthropic API key backend;
- `src/provided.ts` holds the list of provided models from the environment;
- `src/speech.ts` holds the ear and the voice;
- `src/server.ts` holds the routes and the one in-memory session;
- `src/topics.ts` holds the curated topic list;
- `src/page.html` holds the page, the Talk button and the End session button.

Six files hold the end phase:

- `src/types.ts` holds the shared types;
- `src/check.ts` holds Check;
- `src/diff.ts` holds Diff;
- `src/probe.ts` holds Probe;
- `src/close.ts` holds Close;
- `src/session.ts` holds the marked transcript and the order of the five steps.

`src/server.ts` runs the end phase at `POST /api/end`. It runs the ear at `POST /api/hear` and
the voice at `POST /api/say`.

Six test files exist. They are `src/child.test.ts`, `src/diff.test.ts`, `src/model.test.ts`,
`src/provided.test.ts`, `src/session.test.ts` and `src/speech.test.ts`. The speech tests pass a fake engine, so no test
loads the addon or a model. Rule 32. Check, Probe and Close hold no test file. No test can judge what a model
writes. Rule 33 and rule 34 forbid such a test. `src/e2e.ts` runs the end-to-end check against a
real service. Rule 31 asks for that check. `src/rig.ts` makes two models talk and counts
repetition, and it judges nothing.

`src/model.ts` obeys rule 50 today. It reads no tag list. It holds no default model name. The user
names the model at startup, for both backends. `src/model.ts` reports the model that answered, and
never the model in the setting. Rule 24 holds there.

The topic gate does not exist. The topic list in `src/topics.ts` is curated. The page also offers a
button named "Something else". That button does not open a text box. It starts a session with the
fixed title "Explaining". No code checks the topic. `docs/product.md` owns the eligibility rule.
