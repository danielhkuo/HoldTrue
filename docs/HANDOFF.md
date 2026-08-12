# Handoff — 2026-08-12

**Delete this file once it has been consumed.** It is a bridge between sessions, not a document.
Everything in it either belongs in `decisions.md` and the specs, or belongs in the bin.

Read [`README.md`](README.md) first for the map. This says only what a fresh session cannot
work out from the repo.

---

## 1. The direction, decided today and written nowhere else

**The model speaks. The arithmetic keeps the books.**

Per turn:

1. The user says a sentence.
2. `extract` reads it — their graph grows. Unchanged from what is built.
3. `cohere` finds what is still unconnected.
4. A model is handed the conversation so far, **plus the unconnected shapes as context, not as
   an instruction**.
5. The model says one line, as the child.
6. An auditor checks that line's content words against the user's graph. Anything new is logged.

At the end, the review phase reads the log and closes every entry.

**Why.** Two designs were built and measured against the same explanation today. Pure
deterministic templates produced a non-sequitur every fifth turn and cannot ask a forward
question. A model given the conversation turn by turn produced this:

```
you    when you push the handle down that pulls the chain and the chain lifts the flapper.
child  What does lifting the flapper do?
you    the flapper lifting lets the tank water rush into the bowl.
child  So the toilet fills up after it empties?
you    the rushing water pushes everything over the siphon…
child  Wait, what's a siphon?
```

Better on every turn — and turn 2 names *fills up* and *empties*, which the speaker never said.
That is the whole trade. The child reads well **because** it has knowledge the deterministic
version was banned from having, and that same knowledge is what can ratify a belief the user
never held.

So: let it speak, and log what it introduced. The guarantee changes from *it cannot say that*
to *it cannot say that without being caught*. Weaker, honestly weaker, and it is the guarantee
Law 1 actually needs — Law 1 never demanded silence, it demanded that what gets opened gets
closed.

**The part worth noticing: this makes Supply much smaller.** Supply's problem was finding gaps
in someone's understanding with no ground truth, which is why it carries ten open rulings and a
recorded decision to ship unmeasured. Under this design it is handed a list of specific
propositions the child introduced and checks each one. Tractable, and checkable.

**Costs, stated so nobody rediscovers them.** The auditor is vocabulary-level, so a reversed
chain or a negation built entirely from the user's own words passes it — proven today. Catching
that needs `extract` run over the child's turn too, which is one more model call and is worth
doing later, not first. And the nudge in step 4 may make the child stiff again; if it does, drop
it, because fluency is the thing being bought.

**Nothing is written yet.** `docs/specs/child-speech.md` still describes the deterministic
design, which this supersedes. That rewrite is the first job.

---

## 2. State of the code

Nine modules under `src/feynman/`, 86 tests green, `npx tsc --noEmit` clean.

| Module | State |
|---|---|
| `validate` + `normalise` | Built properly. Oracle, red team, 56 tests. Trust these |
| `extract` | Works. Calls the local model per sentence. `cutSentences` is a knowing violation of ruling 3 — sentence-cutting belongs in Transcribe |
| `model` | Ollama client. `muse-glimmer:30b-mlx` is live on this machine |
| `cohere` · `notice` · `voice` · `words` | Skeletons. Under the new direction, `notice` becomes an auditor and `voice` becomes the offline fallback |
| `demo` | `npm run demo`. The walking skeleton, sentence by sentence |

`src/index/anchor.ts` is the only piece built to the full procedure — 30 tests, mutation 100%.

---

## 3. Confirmed contradictions, verified against the files

Found by a four-way sweep and each one re-checked by opening the file. **This list exists
nowhere else.** Repealed rules kept visible as history are *not* on it — that convention is
deliberate and was filtered out.

**`docs/features/feynman.md` — the stalest file in the repo. Ten items, one pass.** It was
never revised after the 2026-08-10 rulings, and its own header says `philosophy.md` wins, so it
loses every conflict.

- `:167` "No score. No rating. No stored verdict." — invariant 7 was amended. Its own forbidden
  rows at `:248-249` are already right; only this blanket sentence is wrong.
- `:125-128` "It knows no facts and consults nothing" — `notice.ts` checks the just-landed
  sentence first and `term` consults `words.ts`.
- `:242` "whether the child may assert is step 7's open question" — ruled 2026-08-10.
- `:155-158`, `:21-23`, `:574-575` — three places calling settled things open.
- `:302` Extract's row: input is "corrected explanation" — the correction step was reversed
  2026-08-05, and the ruled input is sentences. The Transcribe row above it already disagrees.
- `:302`/`:350` "returns the concepts named" — it returns `{doc, links, sentences}`.
- `:558` "Step 3 turns that error into typing" — no such step; `:130` and `:357` say so.

**`docs/decisions.md` — the single source, disagreeing with itself. Seven items.**

- `:139` "two models on the finding path" — Supply is a third, named at `:421` in the same file.
- `:50` "the only thing left stopping it" — already relaxed three rows above.
- `:188` "an empty result means nothing contradicted your notes" — the notes are gone.
- `:361`/`:418` "both take a link set" — `Voice` takes a `Move`. `:420` names a `confused` move
  that does not exist.
- `:344` "no code" for the falsification week — corrected in `feynman.md:416`.
- `:432`/`:439` "the nine" open rulings — there are ten, and `:421` says ten.
- `:547` "the one piece actually built" — nine modules exist.

**`AGENTS.md`** — `:6-9` and `:91` both say `src/` holds only `anchor.ts`. The invariant-citation
roster at `:51` is missing four citers; the file's own prescribed grep finds them.

**`docs/philosophy.md:211`** — "which is why there is no score" still stands as a live claim
inside the *we do not claim* list. The amendment note amends the paragraph after it.

**`docs/specs/supply.md`** — written against a repo that no longer exists. Its `Link`,
`ModelHandle` and `Attribution` are all superseded by `extract.md` and the built types, and it
quotes invariant 7 in its pre-amendment form while its own preamble says quoting in full is
what makes force visible. It is the heaviest invariant-citing document here, so it is trusted
more than it deserves. **Put a banner on it.**

**`docs/specs/extract.md`** — `:92`'s signature takes sentences; `extract.ts` takes a string and
cuts them. The code knows and says so; the spec should say it too. The `resay` justification is
present-tense for a move cut from the MVP.

**`docs/specs/child-speech.md`** — `:34` "first match wins" is false (`notice.ts` skips a
candidate matching the previous turn). `:31` "Voice is handed phrases and never the graph" —
three `Move` variants carry `Link` objects.

**One code item.** `validate.ts:212` builds a `Doc` whose `text` is not what its `doc_id`
hashes, which `anchor.md` ruling C forbids. Contained — the fake never leaves the module and
the emitted spans are correct — but `resolveAnchor` would accept it as the transcript.

---

## 4. What the owner owes, and nobody else can do

**The falsification week.** Build-order entry 0, never started,
`measurements/within-sentence/explanations/` is empty. Fifteen to twenty explanations written
from memory with every causal link marked by hand.

It now clears two blockers rather than one. It is still the only measurement that can end the
project, **and** it is the gold set the Extract prompt work needs — three prompt variants were
tested today and the comparison was worthless because each agent built its own test set.

First decision, before a word is written: which kill number. The 60% line's premise was
falsified and `measurements/within-sentence/README.md` lists the three options and requires the
choice to be recorded as a premise falsification rather than a threshold adjustment.

---

## 5. Two findings that should not be lost

**The 35.70% silence figure did not reproduce.** One empty return in twenty-five sentences,
against a published figure the whole prompt is written to fight. The real loss is under-counting
*inside* a sentence — links carried by apposition, by purpose (*"to catch as much sun"*), by a
second conjunct sharing a subject. **The design's central worry may be aimed at the wrong
thing**, and the falsification week is what settles it.

**The model quotes exactly.** Across every probe today, every phrase it returned was a
character-for-character substring. The paraphrase problem `validate` was built to catch has not
appeared once. `validate` is still right to exist — it is the trust boundary — but `dropped` has
been zero every time, which is why `resay` was cut.

---

## 6. First three moves

1. **Rewrite `docs/specs/child-speech.md`** around section 1. It is the only thing blocking the
   build, and the current file describes a design that has been superseded.
2. **Build the loop.** `demo.ts` already runs sentence by sentence; swap `notice`+`voice` for a
   model call and add the auditor. Small.
3. **Then the doc cleanup in section 3**, starting with `feynman.md`.

Do not start another multi-agent pipeline on an internal helper. One was run on `validate` and
it found real bugs, but it cost a day on a module the user will never see. The heavy procedure
is for pieces a person touches.
