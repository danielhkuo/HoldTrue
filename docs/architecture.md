# Architecture

HoldTrue has two phases. The live phase is a conversation. The end phase is a review. The owner
built the live phase only. The end phase is a design, and no code in `src/` runs any part of it.

This document names every part, and gives the input, the output and the kind. A part is a model call
or plain code. The document says which one.

## The parts and the order

```
  LIVE PHASE  --  built
    the user says a line
         v
    [ CHILD    model ]  one short line back, one model call per turn
         v
  ................  nothing below this line exists in src/  ................
         v
    the user presses the End button    -- a design, not code
         v
    TRANSCRIPT          every turn marked "user" or "child"  -- a design, not code
         v
  END PHASE  --  a design, not code
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

1. The user says a line.
2. The server appends the line to the transcript as a user turn.
3. The server makes one model call, and the model returns one line.
4. The server appends that line to the transcript as a child turn.

The child stays ignorant. It reads only three things. It reads the system prompt with its worked
examples. It reads the transcript of this session. It reads the line the user just said.

The child never reads a source text, an answer key, or the Check output. `docs/product.md` owns the
reason. The live phase produces no findings. It produces the transcript.

## The transcript

The transcript is one ordered list of turns. Each turn carries a speaker mark, a kind and the text.

```json
{ "topic": "How a fridge makes things cold", "turns": [
    { "speaker": "user",  "kind": "said",   "text": "the compressor squishes the gas" },
    { "speaker": "child", "kind": "said",   "text": "Why does that make it hot?" },
    { "speaker": "child", "kind": "silent", "reason": "the backend is not running" } ] }
```

Three rules hold for every transcript:

- Every turn carries a speaker mark. The mark is `user` or `child`.
- The code must not infer the mark from the text. The server sets the mark when it appends the turn.
- A child turn that produced no line keeps its place and carries a reason.

The mark exists for one reason. The child invents things. A recorded probe shows the child asking
about a door that the user never mentioned. Without the mark, Check reads that invented door as a
claim of the user. Close then corrects the user for a sentence the child wrote.

Check must take the claims from the user turns only. Check must use the child turns for one purpose.
That purpose is to find a child line that asserts a cause the user's words do not contain. The live
phase stores turns in pairs today, and the server must flatten the pairs into this marked list. No code implements the
flattening.

## The session end

The design ends a session with a button. The user presses the button. That press is the only end
signal in the design. No code implements the button.

A child that goes quiet is a feature for a later build. No code implements quiet. No document may say that
quiet ends a session today. The session end starts the end phase. A session must not end with a
question open. The last child question stays open until Close answers it.

## The end phase

Four parts run in order. Part 2 is plain code. Parts 1, 3 and 4 are model calls. No code implements any part.

### 1. Check -- a model

Input: the topic and the marked transcript. The second call also carries the probe answer. Check
reports, and Check does not decide what the app shows.

Output has four fields:

- `mechanism` -- a list of links. Each link carries an `id`, a `cause`, a `relation`, an `effect`
  and a `covered` flag. A covered link also carries the `span` of the user's words that covers it.
- `claims` -- the claims of the user. Each claim carries an `id`, a truth value and a `span`.
- `intrusions` -- the child lines that assert a cause the user's words do not contain. Each
  intrusion carries an `id`.
- `verdict` -- present only when the app supplies a probe answer. It names one link `id` and says
  whether the answer supplies that link.

```json
{ "mechanism": [
    { "id": "L1", "cause": "the compressor", "relation": "compresses", "effect": "the gas",
      "covered": true, "span": "the compressor squishes the gas" },
    { "id": "L2", "cause": "compression", "relation": "raises", "effect": "the temperature",
      "covered": false } ],
  "claims":     [ { "id": "C1", "truth": false, "span": "the coils make the cold" } ],
  "intrusions": [ { "id": "I1" } ] }
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

Input: the Check output. Output: an ordered list of rows. Each row carries one `id` and one type.

Diff reads three things and nothing else. It reads the `id` of a link, a claim or an intrusion. It
reads the truth value of a claim. It reads the `covered` flag of a link. Diff never reads `cause`,
`relation`, `effect`, `span` or any other text. Diff never compares text.

The arithmetic:

- a `contradiction` row for every claim whose truth value is false;
- an `intrusion` row for every entry in `intrusions`;
- an `omission` row for every link whose `covered` flag is false.

Diff emits every contradiction first, then every intrusion, then every omission. A false belief
matters more than an invented step, and an invented step matters more than a step the user left out.

**The property a test must check.** Take one Check output. Replace every text field with a
different string. Keep every `id`, every truth value and every `covered` flag. Diff must return the
same rows in the same order. A test that passes this property proves that Diff reads no text.

Two more tests hold. Diff is a pure function, so the same input always returns the same output. Diff
makes no model call and holds no prompt.

Two rules follow. A model must not compute the intrusion row. A model fills a gap by default,
and a model cannot detect its own gap filling. The owner must not fold Diff into Check, and must not
fold Diff into Probe.

### 3. Probe -- a model

Input: the first row of the Diff output, and the marked transcript. Output: one question.

Probe runs once, and it takes the first row and no other row. The user answers. The app sends the
answer to Check, and Check returns the `verdict` field for that row.

Probe exists because Check reads words only. Check cannot separate "the user did not say the link"
from "the user does not know the link". Only a question separates the two. Probe asks one question,
and Probe must not supply the answer.

### 4. Close -- a model

Input: every row, the probe question, the answer of the user, and the verdict.

Close runs for every row. Output is one short statement per row. The statement gives the claim of
the user first, in the words of the user. It gives the missing mechanism, or the correction, second.

Close uses the verdict for the probed row. For every other row, Close must state that the user did
not say the link. Close must not state that the user does not know the link. The app asked no
question about those rows, so the app holds no evidence about them. Close must not show a score, a
rating, a grade or a progress bar. Close must not say that an explanation was unclear.

## The omniscient toggle

The user sets the toggle for each session.

**Toggle ON.** HoldTrue provides a frontier model. That model runs the whole end phase: Check, Probe
and Close. The user pays for the feature. The user configures nothing and supplies no key. The session sends
the transcript to a remote service that HoldTrue operates. The app must label the findings of the
session `verified`.

**Toggle OFF.** The startup model runs the whole end phase: Check, Probe and Close. The app must
label the findings of the session `unverified`. The app must give the reason with the label. The
model of the user checked the explanation of the user.

There is no silent fall back. If the provided model fails, the app must not use the startup model in
its place without telling the user. The app must state the failure on the screen, and the app must
label the session `unverified`.

## The model layer

There is no default model. At startup the user makes one choice. The user sets up Ollama, and the
model runs on the machine of the user. The user enters an API key for a supported provider instead.
That one model runs the child, and it runs the end phase when the toggle is off.

The provided frontier model is separate. It serves the end phase when the toggle is on, and it is
not part of the startup choice.

Every backend implements one interface. `ModelHandle` has two methods. `identify` returns the
attribution, and `ask` sends one system message and one user message. The child, Check, Probe and
Close call this interface, and they never call a provider API. `identify` reads the name from the
thing that answers, because an attribution must name what actually ran.

## Consent and disclosure

The app must disclose where the text of the user goes, and it must name the destination it actually
uses. An API key sends the transcript to that provider. A local Ollama backend sends nothing off the
machine. The omniscient toggle sends the transcript to a service that HoldTrue operates. The app
must take the consent of the user before the first send.

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
- the request timed out.

The app must not render every failure as one sentence. The app must not show a stack trace. The app
must name a configuration that it cannot support.

## What exists today

The live phase runs. Five files hold it:

- `src/child.ts` holds the child prompt and the one turn;
- `src/model.ts` holds the Ollama backend;
- `src/server.ts` holds the routes and the one in-memory session;
- `src/topics.ts` holds the curated topic list;
- `src/page.html` holds the page.

Two more files exist. `src/rig.ts` makes two models talk and counts repetition, and it judges
nothing. `src/child.test.ts` holds the tests for the child.

The end phase does not exist. The code holds no Check, no Diff, no Probe and no Close. It holds no
toggle, no marked transcript, no consent screen and no API key path. Ollama is the only backend in
the code today. The code also breaks rule 50 today. `src/model.ts` reads `GET /api/tags` and takes
the first model in the list. The user makes no choice. `src/server.ts` reads the model name once at
start, so the screen can name a model that never answered. The end button does not exist, and the "Start another" button only resets the
session.

The topic gate does not exist. The topic list in `src/topics.ts` is curated. The page also offers a
button named "Something else". That button does not open a text box. It starts a session with the
fixed title "Explaining". No code checks the topic. `docs/product.md` owns the eligibility rule.
