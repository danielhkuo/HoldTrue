# Feynman

> **The first shipping feature.** Governed by [`../philosophy.md`](../philosophy.md), which
> wins on any conflict. Evidence: [`../research/evidence-base.md`](../research/evidence-base.md).

You read something. You close it and write out how the thing works, from memory, with
nothing visible. Feynman finds a causal link your source makes that your explanation
skipped, shows you that passage, and asks you to write it again with the step in.

It is the Feynman technique with one step outsourced: noticing your own gap, which people
are measurably bad at doing for themselves. Baseline accuracy at judging what you do and do
not understand is **.178**, about a coin flip.

---

## The feature law: the gap is a missing connection, and the source decides

**Coverage never proves understanding.** However many parts someone names, an explanation
that does not connect them has demonstrated nothing that recitation could not fake. So
coverage alone never reaches the top of any scale, and what we probe is always a connection.

**The comparison runs against the user's source material, never against a second reading of
their own words.**

This is a correction, and it is load-bearing. The obvious design is to extract a graph of
parts and links from the explanation, extract the true graph, and show the difference. It
does not work. Building a causal graph from prose scores **~0.535 F1 for the best frontier
model measured** and **~0.30 at 8B**, and one study reached 95% precision at **9% recall**.
A set difference between two extractions at that accuracy is noise. Shipping it would mean
confidently telling someone they failed to say something they did say, which is the exact
failure the constitution exists to prevent.

So the authority for *"there is a connection here"* comes from a document, quoted. We
extract the concepts the user named, which **is** reliable. We retrieve the passages in
their material that link those concepts. Then we surface the link the source makes that the
explanation did not.

Two techniques follow, and neither is optional:

- **Per-sentence decomposition.** Never one-shot analysis over a whole explanation.
- **Span anchoring.** Every extracted item carries a verbatim quote plus character offsets,
  and anything whose quote is not a literal substring of the source is rejected. That turns
  a hallucination into a validation failure, and it yields the citations Law 2 requires for
  free.

## The session

1. **Pick something from your material that is a causal system.**
2. **Explain it from memory, nothing visible.** The illusion collapses on the attempt to
   produce, not to recognize.
3. **See what your source connects that you did not.** It arrives as a quoted passage,
   never as a claim about your understanding.
4. **Answer one probe aimed at that omission.** This converts a gap in the text into a
   tested gap. Someone who holds the mechanism can still fail to write it, and we may not
   treat that as a failure of understanding.
5. **Receive the refutation.** Your claim first, then the omitted mechanism, from a named
   source, in a register that is not the persona's.
6. **Write it again with the step in.** Then one consolidation question, asked *after* the
   correction, never instead of it.

No score. No stored verdict. No shareable result.

## Boundary: a hard eligibility rule

The illusion this feature runs on is specific to causal mechanism: **.918 for devices,
.860 for natural phenomena, .291 for facts, and −.173 for procedures**. The negative figure
means that on procedures, attempting an explanation slightly *increases* confidence.

**A topic that is not a causal system is out of scope.** Not facts, not vocabulary, not
step-by-step procedures. There is nothing there for this feature to catch, and flashcards
are better for it.

## Forbidden

| | Why |
|---|---|
| Ending a session on the finding | Core Law 1 |
| Treating coverage as sufficient | Recitation passes coverage |
| Delivering a refutation before the probe has tested the gap | Step 4 exists for this |
| Comparing two extractions of the user's own words | The F1 numbers above |
| Paraphrasing a source instead of quoting it | Paraphrase is authorship |
| Any assertion in the persona's voice | A character may ask, not tell |
| Confidence deltas as a stored metric | The effect is not topic-specific |

## The plan

Produced by running [`../workflow.md`](../workflow.md) steps 1 to 3. That document shows the
prompts and the raw responses, including the decomposition mistake worth catching. This is the
corrected result, and it is what steps 4 to 8 iterate over.

| Piece | Takes | Returns | Kind |
|---|---|---|---|
| **Anchor** | A document and a character range | A reference that finds that range again after re-parsing | Deterministic |
| **Index** | A folder of documents | Chunks with stable ids and offsets | Deterministic |
| **Retrieve** | A set of concepts | Ranked passages from the user's own library | Deterministic |
| **Extract** | The user's written explanation | The concepts named and the links asserted, with spans | **Model** |
| **Compare** | Extracted concepts plus retrieved passages | The link present in the source and absent from the explanation | Deterministic |

Only Extract calls a model, and it does one job: read prose, return concepts and links with the
spans they came from. It does not decide what is missing, does not rank anything, and does not
write anything the user reads.

Compare is the piece worth understanding. Working out which link the source makes that the
explanation did not *sounds* like a model's job, and putting it inside Extract is the obvious
design. But given concepts on one side and passages on the other it is set arithmetic, so it
can carry a property test. Keeping it outside means the gap shown to the user is certain even
though the extraction feeding it is not.

**Build order.**

1. **Anchor.** Every other piece produces or consumes anchors, so changing the format later
   means touching all of them.
2. **Index.** Retrieve and Extract both need real chunks to work on.
3. **Retrieve.** Compare needs passages.
4. **Extract.** Needs the three above in place to generate inputs for its evaluation set.
5. **Compare.** Needs both sides present.
6. **Session**, then **Interface**. Last, always.

## Open

- **Validate extraction before building UI on it.** No benchmark exists for this exact
  task, so measure it on 100 to 150 labelled explanations. If a small local model cannot do it,
  this feature is cloud-only or it does not exist.
- Whether a persona asks the probe.
- **Local speech to text: researched twice, and the answer is no.** Two independent reasons,
  either of which is enough.

  *Transcription.* Thinking-aloud speech runs 15 to 25% word error rate against the 2 to 3%
  that read-speech benchmarks suggest. Degradation concentrates in the same groups the cloud
  numbers already harmed, and no local option has been measured to be fairer. There is no
  published fairness data at all for Apple's SpeechAnalyzer, Parakeet or Kokoro.

  *The parallel-track idea.* Since transcription strips filled pauses, the obvious fix is a
  second model reading the audio for hesitation while the first reads it for content. That is
  architecturally trivial. It fails on its premise: **disfluency during explanation does not
  indicate uncertainty about the content.** Schachter et al. 1991 recorded lecturers
  explaining their own specialties, where certainty is at ceiling, and found filled-pause
  rates varying threefold by discipline (1.39 to 4.85 per minute); the differences vanished
  when the same people discussed a shared topic. Disfluency tracks how many ways a topic can
  be phrased, and this feature's entire domain is conceptually open material. A within-speaker
  baseline does not help, because that confound is within-speaker too. See the evidence base.

  The defensible version of speech here is dictation as a drafting aid, where the user edits
  the transcript before submitting it. That makes the error rate friction rather than
  misdiagnosis. It is a later convenience, not part of this feature.
