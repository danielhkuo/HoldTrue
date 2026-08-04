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

1. **Pick something from your material that works by a mechanism.**
2. **Say it out loud from memory, nothing visible.** The illusion collapses on producing, not
   recognizing.
3. **The child repeats back what it heard.** You fix the words it got wrong. Now the
   transcript is yours, not the machine's guess at yours.
4. **The child asks where your own chain breaks.** It knows no facts. It only knows you named
   a thing and never said what it does.
5. **See what your source connects that you did not.** A quoted passage, never a claim about
   you.
6. **Answer one probe aimed at that omission.** Holding the mechanism and failing to say it
   is not a failure of understanding.
7. **Receive the refutation.** Your claim first, then the omitted mechanism, from a named
   source, in a register that is not the child's.
8. **Say it again with the step in.** Then one consolidation question, *after* the
   correction, never instead of it.

No score. No stored verdict. No shareable result.

**Two checks, in order.** The child checks whether your chain holds together. Your source
checks whether it is right. The child goes first: no point being told what your book says
until your own story closes.

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
| Treating coverage as sufficient | Recitation passes coverage |
| Delivering a refutation before the probe has tested the gap | Step 6 exists for this |
| Comparing two extractions of the user's own words | The F1 numbers above |
| Paraphrasing a source instead of quoting it | Paraphrase is authorship |
| Any assertion in the child's voice | A character may ask, not tell |
| The child speaking from what the model knows about the world | Invariant 3. It knows your source, and nothing else |
| Saying an explanation was unclear | No ground truth exists for that |
| Letting a clarity count change an understanding finding | The two are orthogonal, and mixing them lies |
| Reading hesitation as doubt | Refuted. Disfluency tracks the topic, not the speaker |
| Trusting a transcript the user has not corrected | Then they are not their own words |
| Confidence deltas as a stored metric | The effect is not topic-specific |

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
| **Clarity** | The raw transcript, nothing else | Counts of measurable surface facts | Deterministic |

Only Extract calls a model on the path that produces a finding. Its one job is to read prose
and return concepts and links with their spans. It decides nothing, ranks nothing, writes
nothing the user reads.

Transcribe calls a model too, but the user corrects its output before anything consumes it,
so its errors are friction rather than a false finding. Nothing downstream trusts it.

Cohere and Compare *sound* like a model's job, so folding them into Extract is the obvious
design. But both are set arithmetic over a graph, so both can carry property tests. Kept
outside, the gap shown to the user is certain even though the extraction feeding it is not.

**Cohere reads the graph. Clarity reads the prose.** That is the whole line between them. One
asks whether a concept has no incoming link; the other asks whether a pronoun has two
possible antecedents. Different inputs, so neither can drift into the other.

**Clarity is an instrument, not a judge.** It reports facts you could count by hand and makes
no claim about them. It never says an explanation was unclear, because that needs a ground
truth nobody has. It never touches the understanding path, so a wrong count cannot corrupt a
finding.

**Build order.**

1. **Anchor.** Every other piece produces or consumes anchors, so changing the format later
   touches all of them.
2. **Index.** Retrieve and Extract need real chunks.
3. **Retrieve.** Compare needs passages.
4. **Extract.** Needs the three above to generate inputs for its evaluation set.
5. **Cohere**, then **Compare**. Cohere needs only Extract; Compare needs both sides present.
6. **Session**, then **Interface**. Last, always.

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
