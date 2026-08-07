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

The obvious design diffs a graph extracted from the explanation against the true graph. The
figures that actually exist say that diff would be noise. Open information extraction — read
arbitrary prose, emit relation tuples — tops out at **53.5 F1 on the CaRB benchmark**, and that
is IMoJIE (arXiv:2005.08178), a **2020 BERT-based seq2seq system**, not a frontier model.
General-purpose models land lower and swing by benchmark: **LLaMA-2-13B scores 36.2 on CaRB and
25.7 on ReOIE, GPT-3.5 zero-shot 39.1 and 25.9**. A diff between two artefacts built at that
accuracy is noise that tells someone they failed to say what they did say: the exact failure the
constitution prevents.

**This argument now stands less firmly than the version it replaces, and that is worth saying
plainly.** Until 2026-08-07 the paragraph above credited 53.5 to *"the best frontier model
measured"*, quoted *~0.30 at 8B*, and cited *one study reaching 95% precision at 9% recall*. The
first was a misattribution, the second had no source behind the 8B figure specifically, and the
third could not be found at all. What survives is a written-prose benchmark ceiling around 0.5 F1
across every system that has been measured — enough to make the diff a bad bet, not enough to
close the question, because **no frontier-model open-IE score was found either way**. The
corrected numbers point the same direction; they no longer make the case overwhelming. If someone
produces a frontier-model number far above 53.5, this is the paragraph to reopen — and the
rejected alternative, diffing the explanation against a "true" graph, is rejected on this
evidence rather than on principle.

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

**The roleplay is the product.** Decided by the owner 2026-08-07, and recorded here in the
section it governs. It is the same form of argument [`../decisions.md`](../decisions.md) already
accepted for voice: a **fiction** argument, not a pedagogical one. It therefore does not face the
evidence gate, which governs claims about how people learn, and this claims nothing about that.
What it buys is a settled answer to a question that kept resurfacing — the child is not decoration
over a diagnostic, so design effort spent making it read as a child is spent on the product rather
than taken from it. The rejected alternative is the reading this replaces: the persona as a
delivery wrapper, defensible only while it improved the finding.

Two consequences, and both have to be stated rather than assumed.

**Nobody may defend a chattier child pedagogically.** The evidence base holds no row saying a
conversational partner teaches better, and two rows pointing the other way: audience-directed
explanation produced **87% knowledge-telling episodes against 60%** for self-explanation to text
(Roscoe & Chi), and opening with *"walk me through it step by step"* **shrinks** the diagnostic
yield (Alter, Oppenheimer & Zemla 2010). A fiction argument survives having no pedagogical
support. It does not survive being dressed as one, and an argument that the child should say more
because saying more helps the learner is refused on this evidence.

**The fiction does not suspend Law 1 or invariant 5.** Every question the child asks still has to
supply its answer, and the answer still has to come from the user's own notes. Those two carry
their own evidence and bound what the child may ask no matter how central the roleplay becomes: a
question the fiction makes irresistible and the notes cannot answer is still forbidden, and the
tempting *"which comes first?"* is the clearest case, since feedback loops are correct mechanism
and the eligible domain is full of them.

The open question this creates is named here, not answered: how much design budget the roleplay
may claim against the diagnostic, and what that implies for the live-only release discussed below,
is undecided. **This pass records the pivot; it does not redesign the session around it.**

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

Produced by the feature entry in [`/holdtrue-workflow`](../../.claude/skills/holdtrue-workflow/SKILL.md).
The decomposition mistake worth catching — `Analyse` doing two jobs, one of which was set
arithmetic — is worked through in [`../workflow.md`](../workflow.md) under *Finding the seams*.
The piece loop iterates over the corrected result below.

| Piece | Takes | Returns | Kind |
|---|---|---|---|
| **Anchor** | A document and a character range | A reference that finds that range again after re-parsing | Deterministic |
| **Index** | A folder of documents | Chunks with stable ids and offsets | Deterministic |
| **Transcribe** | Spoken audio | Text the user then corrects by hand | **Model**, outside the gate |
| **Retrieve** | A set of concepts | Ranked passages from the user's folder | Deterministic |
| **Extract** | The user's corrected explanation, **or a retrieved source passage** | The concepts named and the links asserted, with spans | **Model** |
| **Cohere** | The extracted graph, alone | Where the chain does not close | Deterministic |
| **Compare** | Links extracted from the explanation, plus links extracted from the retrieved passages | The link present in the source and absent from the explanation | Deterministic |
| **Contradict** | Extracted claims plus retrieved passages | Where a passage asserts otherwise, with both spans | **Model** |
| **Clarity** | The raw transcript, nothing else | Counts of measurable surface facts | Deterministic |

**Compare is set arithmetic over two link sets, not over concepts and passages.** The table
previously gave it `extracted concepts plus retrieved passages` in and a *link* out, and a passage
is not a link — nothing upstream established that the source asserted anything.
[#22](https://github.com/danielhkuo/HoldTrue/issues/22) closed that gap on 2026-08-06: Extract is
one model step run on two kinds of input, so both sides of the comparison are link sets and Compare
keeps its property test.

**Picking scopes the topic; retrieval searches the folder.** Step 1 above and Retrieve's row are
not in conflict — [#20](https://github.com/danielhkuo/HoldTrue/issues/20) settled that on
2026-08-06. A pasted article is stored as a folder of one, so corpus scope is a parameter rather
than a second code path.

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
single sentence. Invariant 8 mandates per-sentence extraction, so a link whose halves straddle a
full stop — *"the pressure drops. So the valve opens"* — is structurally invisible, and that
fraction is therefore the ceiling on everything Extract can ever see. A fact about how you speak,
not about the model. **Suggested kill number: below 60%, invariant 8 needs renegotiating rather
than obeying.**

Until 2026-08-07 this paragraph borrowed a justification — *"causal extraction runs ~97% F1
within a sentence and roughly 5% across one"* — and that borrowing does not hold. The pair is
Table 7 of **PubMedCausal** (Kunle-John et al., arXiv:2605.28363): intra-sentential F1 **0.9743**
against inter-sentential **0.0500**, DeepSeek-R1-32B few-shot, scored by **relaxed cosine
matching at a 0.75 threshold** rather than exact extraction, over **PubMed abstracts**, with the
5% computed on **202 instances — 3.1% of that corpus's 6,491 cause–effect pairs**. The corpus
was keyword-filtered for *"causality"* and is 96.9% intra-sentential by construction, so its
cross-sentence relations are the residue the filter missed: the hardest slice, not a
representative sample. In news the statistic nearly inverts — **EventStoryLine holds 3,885
inter-sentence causal pairs against 1,770 intra, roughly 31% intra-sentential.** The
intra-sentential share swings threefold between two *written* genres, so **no published number
covers spoken, from-memory explanation by a learner, which is this product's only genre.** That
is a better reason to run the measurement than the one it replaces, not a worse one: this week is
now the only evidence there is, rather than a confirmation of somebody else's corpus.

The kill number stays at 60% and has not been moved. What changed is that it is now a line
someone drew rather than one the literature implied, since a share that swings 31%–97% by genre
implies nothing about this one. If it is to be revised, it must be revised **now, before any
explanation is written, and recorded as a premise falsification** — which is a different act from
adjusting a threshold after seeing a result, and the second remains forbidden.

**Two extra columns, free.** For every cross-sentence link you mark, record two more facts: was
there a causal connective opening the effect sentence, and was the cause in the immediately
preceding sentence or further back. Neither costs a minute of extra collection, and between them
they replace every borrowed corpus statistic above with the only distribution that matters. The
first bounds how far a closed-class connective table could get; the second says whether a
one-sentence lookback window recovers most of what a per-sentence extractor loses or almost none
of it. Both are worth knowing before anyone argues about invariant 8 again. The procedure and the
file format for all of this live in
[`measurements/within-sentence/README.md`](../../measurements/within-sentence/README.md), which
is the operative document; this section states why the week exists, not how to run it.

**The false-question rate, per predicate.** Run Extract over those same explanations, then
Cohere's set arithmetic, and count how often Cohere flags a concept the gold labels show *was*
linked. If extraction misses most real links, nearly every concept looks unlinked and the child's
modal question lands on a step the user did explain. **Report this per predicate, not as one
number.** An aggregate hides the shape of the failure: a clean *"you named X and never said what
it does"* branch sitting beside a noisy one is a branch to retire, not a feature to kill, and a
single rate cannot tell those two situations apart. Each predicate's kill number gets written
down before the run, like every other number here.

**Vault eligibility.** Done 2026-08-06 for one vault; result in
[issue #26](https://github.com/danielhkuo/HoldTrue/issues/26). Roughly 13–16% of notes are causal
mechanisms, and of those nearly all already carry a quotable causal sentence. Eligibility is
**not** the binding constraint. Generalisability to other people's notes is open.

**A live-only first release is available; whether it is worth shipping is open.** The unrefuted
objection: strip the fiction and the modal session is a prompt followed by rereading your own
notes, which is on the do-not-build list, and the answerability gate selects the concepts you
most likely already knew. The counter is to treat the live child as an internal instrument and
ship Contradict first, since a contradiction is diagnostic by construction — and to ship against
typed text, since voice's only remaining justification is fiction. Unresolved, and the
2026-08-07 pivot recorded above sharpens rather than settles it: once the roleplay *is* the
product, "ship against typed text" stops being a cheap simplification and starts being a proposal
to ship without the thing being sold. That is a real cost to weigh, not a refutation of the
counter, and nobody has weighed it yet.

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
- **Whether Cohere's finding survives bad extraction.** The best open-IE score anyone has
  published is 53.5 F1 on CaRB, a written-prose benchmark, and nobody has measured spoken learner
  explanation at all — so Cohere will sometimes see a hole that is not there, by an unknown
  margin. This is why the child *asks* instead of telling: a wrong question costs one round trip,
  a wrong claim costs everything.

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
