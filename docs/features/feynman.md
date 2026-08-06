# Feynman

> **The first shipping feature.** Governed by [`../philosophy.md`](../philosophy.md), which
> wins on any conflict. Evidence: [`../research/evidence-base.md`](../research/evidence-base.md).

You read something, close it, and teach it out loud to a curious 10-year-old. The child has
read your source and nothing else. It asks about the step you skipped. Then your source
answers, quoted, and you say it again with the step in.

The Feynman technique with one step outsourced: noticing your own gap. Baseline accuracy at
judging your own understanding is **.178**, a coin flip.

---

## The feature law: the gap is a missing connection, and the source decides

**Coverage never proves understanding.** Recitation can fake a list of parts, so coverage
alone never tops any scale and what we probe is always a connection.

> **Two senses of "coverage", do not confuse them.** The sense forbidden here is *naming the
> parts*: a list of components, which recitation fakes trivially. The sense the review phase
> reports is *which points your source makes, connections included, that your explanation
> addressed*. The second is legitimate precisely because the points being covered are
> themselves connections. A reader who slides between the two senses will conclude the feature
> contradicts its own law.

**The comparison runs against the user's source material, never a second reading of their
own words.**

The obvious design diffs a graph extracted from the explanation against the true graph. But
graph extraction from prose scores **~0.535 F1 for the best frontier model measured** and
**~0.30 at 8B**, and one study reached 95% precision at **9% recall**. A diff at that accuracy
is noise that tells someone they failed to say what they did say: the exact failure the
constitution prevents.

So authority comes from a quoted document. Extract the concepts the user named, which **is**
reliable; retrieve the passages linking them in their material; surface the link the source
makes and the explanation did not.

Two techniques, neither optional:

- **Per-sentence decomposition.** Never one-shot analysis over a whole explanation.
- **Span anchoring.** Every extracted item carries a verbatim quote plus character offsets;
  a quote that is not a literal substring of the source is rejected. Hallucination becomes
  validation failure, and Law 2's citations come free.

## The session

Two phases. The **live phase** runs while you are talking and touches nothing but your own
words. The **review phase** runs once you have stopped and is where your notes come in.
Revised 2026-08-05; reasoning in [`../decisions.md`](../decisions.md).

### Live

1. **Pick something from your material that works by a mechanism.**
2. **Say it out loud from memory, nothing visible.** The illusion collapses on producing, not
   recognizing.
3. **The child asks where your own chain breaks.** It knows no facts and consults no notes. It
   only knows you named a thing and never said what it does. Cheap, so it can interrupt.

No transcript-correction step: it is friction in the one place the session should feel like
talking. The cost is real and accepted — at 15–25% word error the child will sometimes quote
back words you did not say.

### Review

4. **Where your notes say otherwise.** The passage, and a question about which you meant.
   Checked before omissions: being told about a skipped step is strange if the surrounding
   explanation is wrong.
5. **Where your notes connect something you did not.** A quoted passage, never a claim about
   you.
6. **Answer one probe aimed at the gap.** Holding the mechanism and failing to say it is not a
   failure of understanding.
7. **Receive the refutation.** Your claim first, then the omitted mechanism, from a named
   source, in a register that is not the child's.
8. **Say it again with the step in.** Then one consolidation question, *after* the correction,
   never instead of it.
The review phase may be **agentic** — multi-step retrieval, search then read then search again.
Nobody is waiting. The line is agentic about *what to look for*, never about *what to say*.

**No score. No rating. No stored verdict. No shareable result.** A point-coverage readout was
added on 2026-08-05 and removed the same day after a design panel declined it four ways out of
four; see [`../decisions.md`](../decisions.md). *Do I need to study this again* remains
unanswered, and the panel's view is that the contradiction check answers it better than an
inventory would.

**An empty result means your notes contradicted nothing.** It does not mean you understand the
topic. Something you have wrong that your notes never mention will not surface here.

**Why voice.** You do not type at a child sitting in front of you. That is the whole reason,
and it is enough. It is *not* a claim that speaking reveals more than writing — that claim is
refuted in the evidence base and may not appear in this product.

## Boundary: a hard eligibility rule

The illusion is specific to causal mechanism: **.918 for devices, .860 for natural
phenomena, .291 for facts, and −.173 for procedures**. The negative means explaining a
procedure slightly *increases* confidence.

**A topic that is not a causal system is out of scope**, vocabulary included. Nothing there
to catch, and flashcards are better for it.

## Forbidden

| | Why |
|---|---|
| Ending a session on the finding | Core Law 1 |
| Treating a list of named parts as sufficient | Recitation fakes it. Not the same as the review phase's point coverage, which counts connections |
| Delivering a refutation before the probe has tested the gap | Step 6 exists for this |
| Comparing two extractions of the user's own words | The F1 numbers above |
| Paraphrasing a source instead of quoting it | Paraphrase is authorship |
| Any assertion in the child's voice | A character may ask, not tell |
| The child speaking from what the model knows about the world | Invariant 3. It knows your source, and nothing else |
| Saying an explanation was unclear | No ground truth exists for that |
| Letting a clarity count change an understanding finding | The two are orthogonal, and mixing them lies |
| Reading hesitation as doubt | Refuted. Disfluency tracks the topic, not the speaker |
| Confidence deltas as a stored metric | The effect is not topic-specific |
| Any rating of how good an explanation was | Invariant 7 |
| A progress ring or completion bar over covered points | A rating with quotes underneath. A mark beside a comment cancels the comment |
| Fact-checking against anything but the user's own notes | The notes are the only authority, and are assumed correct |
| Retrieval or notes in the live phase | That is what the review phase is for |

## The plan

Produced by [`../workflow.md`](../workflow.md) steps 1 to 3, which shows the prompts, the raw
responses, and the decomposition mistake worth catching. Steps 4 to 8 iterate over this
corrected result.

| Piece | Takes | Returns | Kind |
|---|---|---|---|
| **Anchor** | A document and a character range | A reference that finds that range again after re-parsing | Deterministic |
| **Index** | A folder of documents | Chunks with stable ids and offsets | Deterministic |
| **Transcribe** | Spoken audio | Text the user then corrects by hand | **Model**, outside the gate |
| **Retrieve** | A set of concepts | Ranked passages from the user's own library | Deterministic |
| **Extract** | The user's corrected explanation | The concepts named and the links asserted, with spans | **Model** |
| **Cohere** | The extracted graph, alone | Where the chain does not close | Deterministic |
| **Compare** | Extracted concepts plus retrieved passages | The link present in the source and absent from the explanation | Deterministic |
| **Contradict** | Extracted claims plus retrieved passages | Where a passage asserts otherwise, with both spans | **Model** |
| **Clarity** | The raw transcript, nothing else | Counts of measurable surface facts | Deterministic |

**The model surface is two pieces: Extract and Contradict.** It briefly reached four on
2026-08-05 when a point-coverage readout was added; that was reverted the same day and Points
and Cover went with it. Contradict stays, and needs its own eval set — one more labelling effort
on top of the one already scheduled.

What did not change: **the live phase still calls exactly one model.** Extract reads your words
and returns concepts and links with spans. Cohere is set arithmetic over that graph. So the
part that can interrupt you mid-explanation stays as cheap and as certain as it ever was, and
invariant 3 holds there trivially — nothing in the live phase consults a note.

Transcribe calls a model too. With the correction step dropped, **nothing downstream verifies
it any more**, so its errors now propagate into every finding rather than being caught by the
user first. That is the accepted cost recorded in [`../decisions.md`](../decisions.md).

Cohere and Compare *sound* like a model's job, so folding them into Extract remains the obvious
mistake. Both are set arithmetic over a graph and both carry property tests. Kept outside, the
omission shown to the user is certain even though the extraction feeding it is not.

**Cohere reads the graph. Clarity reads the prose.** That is the whole line between them. One
asks whether a concept has no incoming link; the other asks whether a pronoun has two
possible antecedents. Different inputs, so neither can drift into the other.

**Clarity is an instrument, not a judge.** It reports facts you could count by hand and makes
no claim about them. It never says an explanation was unclear, because that needs a ground
truth nobody has. It never touches the understanding path, so a wrong count cannot corrupt a
finding.

**Build order.** Corrected 2026-08-06; the previous version deferred the go/no-go behind the two
most expensive deterministic pieces, for a reason that does not hold.

0. **The falsification week.** Costs a day each and no code. See below.
1. **Anchor.** Every other piece produces or consumes anchors, so changing the format later
   touches all of them. *Done.*
2. **Extract, with its eval set.** **Does not need Index or Retrieve.** Its gold labels are spans
   into the *explanation text* — what the person said — and Anchor already resolves spans into
   arbitrary text. Hand-label against pasted explanations. Putting this fourth was the repo's
   most expensive error: it hid the one measurement that can end the project behind a month of
   work that only matters if the measurement passes.
3. **Index**, then **Retrieve with the abstain in front of it**. The abstain is twenty lines and
   is the only thing standing between a growing corpus and a verbatim quote from the wrong note.
   Build it before the retrieval it guards, not after.
4. **Cohere**, then **Compare**. Cohere needs only Extract; Compare needs both sides present.
5. **Contradict**, with its own eval set — whose collectability is itself unresolved, see below.
6. **Session**, then **Interface**. Last, always.

This now agrees with the project-level order in [`../decisions.md`](../decisions.md), which is
the single source for it. Where the two ever disagree again, that file wins.

### The falsification week, before step 2

Three measurements, each about a day, none needing a model or a line of code. **Write the kill
numbers down before running any of them** — a threshold chosen after seeing the result, by the
person who wants the feature to exist, is not a gate.

**Within-sentence rate.** Write out fifteen to twenty explanations from memory on real topics.
Mark every causal link by hand. Count what fraction have cause, effect and relation inside a
single sentence. Invariant 8 mandates per-sentence extraction, so that fraction is the ceiling on
everything Extract can ever see — a fact about how you speak, not about the model. Causal
extraction runs ~97% F1 within a sentence and roughly 5% across one, so "the pressure drops. so
the valve opens" is structurally invisible. **Suggested kill number: below 60%, invariant 8 needs
renegotiating rather than obeying.**

**The false-question rate.** Run Extract over those same explanations, then Cohere's set
arithmetic, and count how often Cohere flags a concept the gold labels show *was* linked. If
extraction misses most real links, nearly every concept looks unlinked and the child's modal
question lands on a step the user did explain.

**Vault eligibility.** Done 2026-08-06 for one vault; result in
[issue #26](https://github.com/danielhkuo/HoldTrue/issues/26). Roughly 13–16% of notes are causal
mechanisms, and of those nearly all already carry a quotable causal sentence. Eligibility is
**not** the binding constraint. Generalisability to other people's notes is open.

**A live-only first release is available; whether it is worth shipping is open.** The unrefuted
objection: strip the fiction and the modal session is a prompt followed by rereading your own
notes, which is on the do-not-build list, and the answerability gate selects the concepts you
most likely already knew. The counter is to treat the live child as an internal instrument and
ship Contradict first, since a contradiction is diagnostic by construction — and to ship against
typed text, since voice's only remaining justification is fiction. Unresolved.

**Clarity** and **Transcribe** sit outside this order. Clarity needs nothing but text and can
be built first or last. Transcribe is needed before any real session runs.

## Open

- **Validate extraction before building UI on it.** No benchmark exists, so measure it on 100
  to 150 labelled explanations. If a small local model cannot, this feature is cloud-only or
  it does not exist.
- **Which speech-to-text engine.** Open. The choice is constrained, not free: thinking-aloud
  speech runs 15 to 25% word error rate, and errors fall hardest on accented and non-standard
  speech. Apple's SpeechAnalyzer, Parakeet and Kokoro publish no fairness data at all. Step 3
  turns that error into typing rather than a false finding, but those users still type more.
- **When the child interrupts.** After you stop talking is cheap. Mid-sentence needs streaming
  transcription and streaming extraction, and is a much bigger build. It needs no retrieval
  either way, because the child never consults your library.
- **What Clarity counts.** Sentence length, pronouns with two antecedents, terms used before
  they are introduced, speech rate. Each has to be something you could count by hand.
- **Whether Cohere's finding survives bad extraction.** Link extraction runs about 0.5 F1, so
  Cohere will sometimes see a hole that is not there. This is why the child *asks* instead of
  telling: a wrong question costs one round trip, a wrong claim costs everything.

**Settled here, recorded in `decisions.md`:** voice-first input, the child as a listener that
knows only your source, the two checks in order, and Clarity as a separate instrument.

**Still refused: disfluency as a signal.** Transcription strips filled pauses, so the obvious
fix is a second model reading the audio for hesitation. Trivial to build, false at the
premise: **disfluency during explanation does not indicate uncertainty about the content.**
Schachter et al. 1991 recorded lecturers on their own specialties, certainty at ceiling, and
found filled-pause rates varying threefold by discipline (1.39 to 4.85 per minute),
differences that vanished on a shared topic. Disfluency tracks how many ways a topic can be
phrased, and this domain is conceptually open. A within-speaker baseline does not help: that
confound is within-speaker too. See the evidence base.
