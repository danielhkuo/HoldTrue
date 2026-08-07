# Feynman

> **The first shipping feature.** Governed by [`../philosophy.md`](../philosophy.md), which
> wins on any conflict. Evidence: [`../research/evidence-base.md`](../research/evidence-base.md).

You read something, close it, and teach it out loud to a curious 10-year-old. It asks about the
step you skipped. Then the answer arrives, and you say it again with the step in.

The Feynman technique with one step outsourced: noticing your own gap. Baseline accuracy at
judging your own understanding is **.178**, a coin flip.

> **Revised 2026-08-07, and this is the largest revision this page has taken.** It used to open
> *"the child has read your source and nothing else"*, and its feature law used to read *"the
> comparison runs against the user's source material."* Both are repealed. The finding now comes
> from what the model knows about the subject, and the user's own material becomes an optional
> retrieval path for whoever wants to hook one up. The diagnostic idea is unchanged — you explain
> from memory, something finds the step you skipped — but the authority behind the finding has
> moved from a document you can point at to a model you have to trust, and the reason to trust a
> finding has moved with it. The rule that replaces the repealed one lives in
> [`../philosophy.md`](../philosophy.md); this page records what it does to the feature and does
> not design around it. What the child's naivety is made of, now that it is no longer made of one
> document, is open: the design row that fixed it is superseded in
> [`../decisions.md`](../decisions.md).

---

## The feature law: the gap is a missing connection, and the model's knowledge decides

**Coverage never proves understanding.** Recitation can fake a list of parts, so coverage
alone never tops any scale and what we probe is always a connection.

> **Two senses of "coverage", do not confuse them.** The sense forbidden here is *naming the
> parts*: a list of components, which recitation fakes trivially. The sense the review phase
> reports is *which points about the mechanism, connections included, your explanation
> addressed*. Before 2026-08-07 that read *which points your source makes*; the points now come
> from the model by default. The second is legitimate precisely because the points being covered are
> themselves connections. A reader who slides between the two senses will conclude the feature
> contradicts its own law.

**The comparison runs against what the model knows about the subject, never a second reading of
the user's own words.**

The first half was repealed on 2026-08-07 and replaced by what you have just read; until then it
said *against the user's source material*, and everything under this heading was built on it. The
second half is untouched, because it never depended on the first. It rests on invariant 9's
opening clause — two extractions of the same person's words differ mostly by extractor noise —
and that reasoning survives the pivot intact.

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

**What that ceiling still bounds, and what it no longer reaches.** The argument above weighed a
diff between two artefacts *both* built by open information extraction, which is why one shared
ceiling condemned it. On the default path only one side is an extraction — Extract still reads
the user's spoken explanation, and that is the reliable half it always was. The other side is now
the model's own account of the mechanism, which open-IE benchmarks do not measure at all. So the
ceiling still rules out diffing two readings of the user's words, and it says nothing either way
about the finding the default path actually produces. That is not the argument getting stronger.
It is the argument losing half its subject, and the replacement half has no published number
behind it in either direction.

So authority no longer comes from a quoted document. It comes from the model. The rule that
replaces the one repealed here is stated in [`../philosophy.md`](../philosophy.md) rather than
invented on this page: the guard against a confident falsehood is now the capability of the model
the user chose to run, and the owner has deliberately assigned that choice to the user. Two things
follow that this page has to carry rather than assume.

**The app owes the user the truth about which model is answering**, and about what that model was
calibrated against. A responsibility the user has not been told he holds is not one he can
discharge.

**A stronger model is a free pass on recall, not on precision.** The reasoning that a cloud model
will pass any eval the local floor passes holds for finding gaps that are really there. It does
not transfer to not inventing gaps that are not, because larger models are frequently more fluent
and more confidently wrong, and precision is the axis Law 1 charges for: a wrong claim delivered
as a refutation is exactly the failure this feature was built to make impossible. Calibrating
against the weakest supported configuration stays sound. Treating the strong end as self-evidently
safe does not.

Two techniques, neither optional:

- **Per-sentence decomposition.** Never one-shot analysis over a whole explanation. Invariant 8
  still governs, and is still unwarranted pending the measurement described below.
- **Span anchoring.** Every extracted item carries a verbatim quote plus character offsets; a
  quote that is not a literal substring of its source is rejected. This holds wherever there is a
  source to anchor into: the user's own explanation, which Extract reads, and any passage the
  optional retrieval path returns. Invariant 2 narrowed to that scope rather than being repealed,
  so a citation is still a substring or it is a rejected extraction. **What anchoring stopped
  doing is the part worth reading twice.** Under the old law it made hallucination structurally
  impossible — every sentence was somebody's words, so a fabrication was a validation failure
  rather than a screen a user read and believed. On the default path the finding is not a quote of
  anything, so there is nothing for the validator to fail. That guarantee is gone, and nothing
  mechanical has replaced it.

## The session

Two phases. The **live phase** runs while you are talking and touches nothing but your own
words. The **review phase** runs once you have stopped and is where subject knowledge comes in.
Revised 2026-08-05, and again on 2026-08-07 when the source of that knowledge changed from the
user's notes to the model; reasoning in [`../decisions.md`](../decisions.md).

### Live

1. **Pick something from your material that works by a mechanism.**
2. **Say it out loud from memory, nothing visible.** The illusion collapses on producing, not
   recognizing.
3. **The child asks where your own chain breaks.** It knows no facts and consults nothing. It
   only knows you named a thing and never said what it does. Cheap, so it can interrupt. That is
   a description of what the live phase does — Extract, then set arithmetic — and since 2026-08-07
   it is no longer also a law: the law was invariant 3, and it is repealed.

No transcript-correction step: it is friction in the one place the session should feel like
talking. The cost is real and accepted — at 15–25% word error the child will sometimes quote
back words you did not say.

### Review

4. **Where the subject says otherwise.** What you said, set against what the model holds to be
   the case — or against a quoted passage, if you have hooked a source up — and a question about
   which you meant. Checked before omissions: being told about a skipped step is strange if the
   surrounding explanation is wrong. Until 2026-08-07 this read *where your notes say otherwise*,
   and the passage was the whole of it.
5. **Where the mechanism connects something you did not.** The model's account by default, a
   quoted passage on the retrieval path. **Never a claim about you** in either case: that half was
   never Law 2's to give, it is invariant 6, and invariant 6 is untouched.
6. **Answer one probe aimed at the gap.** Holding the mechanism and failing to say it is not a
   failure of understanding.
7. **Receive the refutation.** Your claim first, then the omitted mechanism. That ordering is Law
   1's *correct by refutation, not by exposition*, and it survives the pivot untouched. **Who
   delivers it, and in what register, is open.** The step used to end *from a named source, in a
   register that is not the child's*, and the named source was Law 2's conduit rule, gone with it:
   by default there is no attributable source, so there is no change of hands for a change of
   register to signal. The register switch itself has a second leg that Law 2 did not carry —
   `philosophy.md` also justified it under Law 1, on the ground that a naive listener cannot supply
   a correct answer and Law 1 demands one. That leg is still standing, but it rests on a naivety
   whose definition was repealed along with *the child knows your source and nothing else*, so it
   is holding up less than it looks. The honest statement is that step 7 kept its shape and lost
   its speaker. This page does not appoint a new one, and the reader should notice that two live
   pressures point opposite ways: *the roleplay is the product* pulls toward letting the child say
   it, and the reason the child was never allowed to say it was only ever half about provenance.
8. **Say it again with the step in.** Then one consolidation question, *after* the correction,
   never instead of it.
The review phase may be **agentic** — multi-step retrieval, search then read then search again.
Nobody is waiting. That sentence describes the retrieval path; by default there is nothing to
search, and whatever multi-step work replaces it is undesigned. The line that used to follow it —
agentic about *what to look for*, never about *what to say* — was Law 2's, and is repealed with
it. No narrower version has been written.

**No score. No rating. No stored verdict. No shareable result.** A point-coverage readout was
added on 2026-08-05 and removed the same day after a design panel declined it four ways out of
four; see [`../decisions.md`](../decisions.md). *Do I need to study this again* remains
unanswered, and the panel's view is that the contradiction check answers it better than an
inventory would.

**An empty result means nothing was found.** It does not mean you understand the topic, and it
means less than it used to. It used to mean *your notes contradicted nothing*, which was a small
claim about a bounded document you could go and read for yourself. It now means the model found
nothing, which is bounded by what the model knows and by nothing you can inspect. Something you
have wrong that the model does not know, or is wrong about in the same direction you are, will not
surface here — and unlike a missing passage, that failure leaves no trace anywhere.

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
supply its answer. The clause that used to follow — *and the answer still has to come from the
user's own notes* — was written on the morning of 2026-08-07 and repealed the same day. It does
not survive the pivot and should not be quoted from this page again. What survives is the harder
half: Law 1 carries its own evidence, is untouched, and bounds what the child may ask no matter
how central the roleplay becomes. A question the fiction makes irresistible and *nothing* can
close is still forbidden, and the answer must still come from somewhere the product is willing to
stand behind. The tempting *"which comes first?"* is still the clearest case, and it is worth
seeing that it never needed the notes clause: feedback loops are correct mechanism, the eligible
domain is full of them, and the question presupposes an order that does not exist. No source
closes it, the model included. Law 1 alone rules it out.

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

Worked through row by row on 2026-08-07 against the pivot. More rows survive than fall, because
most were never resting on Law 2 in the first place, and the difference between a rule that was
repealed and a rule that merely changed its reason is exactly the kind of thing a reader will get
wrong if it is left implicit. Repealed rows stay visible rather than being quietly deleted.

| | Why | Since the pivot |
|---|---|---|
| Ending a session on the finding | Core Law 1 | **Stands**, and binds harder: whatever now produces the finding must still close it |
| Treating a list of named parts as sufficient | Recitation fakes it. Not the same as the points the review phase raises, which are themselves connections | **Stands.** The coverage law is this feature's own and owes Law 2 nothing |
| Delivering a refutation before the probe has tested the gap | Step 6 exists for this | **Stands** |
| Comparing two extractions of the user's own words | The F1 numbers above | **Stands.** Invariant 9's first half was never touched |
| Paraphrasing a source instead of quoting it | Paraphrase is authorship | **Stands, narrowed.** *Paraphrase is authorship* was Law 2's reason and is gone. What remains is invariant 2: anything presented as a quote is validated as a literal substring, so a paraphrase dressed as a quotation is still a rejected extraction. Where nothing is presented as a quote, the row no longer reaches |
| Any assertion in the child's voice | A character may ask, not tell | **Repealed as stated.** *A persona may ask, it may never assert* was Law 2's consequence and fell with it. Whether the child may now assert is step 7's open question; this row is not an answer to it, and must not be cited as one |
| The child speaking from what the model knows about the world | Invariant 3. It knows your source, and nothing else | **Repealed.** This row is the pivot itself: model knowledge is now the default source of the finding. Invariant 3 went with it, and it was **mechanically checkable and had a test** — whatever replaces it should be too, or the repo loses a check it will not notice losing |
| Saying an explanation was unclear | No ground truth exists for that | **Stands.** The pivot supplies no ground truth for clarity and never claimed to |
| Letting a clarity count change an understanding finding | The two are orthogonal, and mixing them lies | **Stands** |
| Reading hesitation as doubt | Refuted. Disfluency tracks the topic, not the speaker | **Stands.** Evidence-gated, and the evidence is untouched |
| Confidence deltas as a stored metric | The effect is not topic-specific | **Stands.** Not to be confused with invariant 4's `confidence`, which is brake pressure inside the code, lost its stated rationale with Law 2, and is separately marked for review |
| Any rating of how good an explanation was | Invariant 7 | **Stands** |
| A progress ring or completion bar over covered points | A rating with quotes underneath. A mark beside a comment cancels the comment | **Stands** |
| Fact-checking against anything but the user's own notes | The notes are the only authority, and are assumed correct | **Repealed.** The notes are not the authority and are not assumed correct. They are optional input |
| Retrieval or notes in the live phase | That is what the review phase is for | **Stands, on a different reason.** The provenance reason is gone and the notes half is moot by default. What keeps the live phase clean is cost: it has to stay cheap enough to interrupt you mid-explanation. Whether *model knowledge* may enter the live phase is the hole invariant 3 left behind, and it is open |

Three of these are the reason this is not a generic study app: no rating, no progress bar, and no
clarity count leaking into an understanding finding. None of the three moved, and none of them
ever depended on where a claim came from. What the pivot changed is only where a claim is allowed
to originate.

## The plan

Produced by the feature entry in [`/holdtrue-workflow`](../../.claude/skills/holdtrue-workflow/SKILL.md).
The decomposition mistake worth catching — `Analyse` doing two jobs, one of which was set
arithmetic — is worked through in [`../workflow.md`](../workflow.md) under *Finding the seams*.
The piece loop iterates over the corrected result below.

**This table describes the retrieval path.** Marked 2026-08-07, not rewritten. **Index** and
**Retrieve** take the user's folder as their subject and **Compare** takes what Retrieve returns;
on the default path there is no folder, so all three have no subject. They are not wrong and they
are not deleted — they are what the optional retrieval hook needs, and the reasoning that produced
them stays valid there. **Contradict** is the row that comes closest to surviving the move, since
its shape is *your claim against what is the case*, but its second input and the source half of
its two-span output both assume a document, and nothing here decides what they become. **Extract**,
**Cohere**, **Transcribe** and **Clarity** all keep their jobs, because all four read the user's
own words; Extract's second listed input, a retrieved source passage, is retrieval-path work like
everything else that touches a folder.

**What the default path decomposes into is undecided.** It needs something that produces the
mechanism's missing link from the model rather than from a corpus, and this pass deliberately does
not name that piece, give it a signature, or place it in the build order. A decision taken in the
evening does not get its architecture the same evening, and this repo's own rule is that a row
with no reason behind it is not a decision.

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

**Both rulings above are superseded for the default path and both still hold for the retrieval
path.** #22 answered where the source side of the comparison gets its links; #20 answered which
corpus Retrieve searches. Neither question has a subject once there is no corpus. The reasoning is
not withdrawn and not deleted — it is still the right answer to a question the default path stops
asking.

**The model surface used to be two pieces: Extract and Contradict.** It briefly reached four on
2026-08-05 when a point-coverage readout was added; that was reverted the same day and Points and
Cover went with it. As of 2026-08-07 the count is wrong in the other direction, and honestly so:
the default-path finding is itself model output, produced by a step that has no row in the table
above because nobody has designed it. So the model surface is Extract, Contradict, and at least one
unnamed piece that carries the whole authority of the feature. Contradict still needs its own eval
set — one more labelling effort on top of the one already scheduled, and see below for what has
happened to the ground truth those labels were going to come from.

What did not change: **the live phase still calls exactly one model.** Extract reads your words
and returns concepts and links with spans. Cohere is set arithmetic over that graph. So the part
that can interrupt you mid-explanation stays as cheap and as certain as it ever was. That sentence
used to end *and invariant 3 holds there trivially — nothing in the live phase consults a note*.
Invariant 3 is repealed. What actually guarantees the live phase now is narrower and still true:
Extract's only input is the user's own transcript. Nothing forbids a future live-phase call from
reaching for model knowledge, because the thing that forbade it was invariant 3.

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
   touches all of them. *Done — 30 tests, mutation score 100%.* Its standing changed on 2026-08-07
   without its quality changing at all: it is no longer the foundation everything reads from,
   because the default path reads no documents. What it is now is the thing Extract's spans into
   the user's own transcript resolve against, and the infrastructure the optional retrieval path
   will need if anyone builds it. Not wasted, not deleted, and no longer the piece everything else
   waits on.
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

**Step 3 and Compare inside step 4 are retrieval-path work as of 2026-08-07.** Whether they are
built at all, and when, hangs on a default-path decomposition nobody has written. Step 5's
Contradict is in the same position with its inputs unsettled. Cohere still needs only Extract and
keeps its place, and step 2 is untouched and still the measurement that can end the project. The
order is not re-cut here; it is marked as resting on a question that is open.

This now agrees with the project-level order in [`../decisions.md`](../decisions.md), which is
the single source for it. Where the two ever disagree again, that file wins.

### The falsification week, before step 2

Three measurements, each about a day, none needing a model or a line of code. **Write the kill
numbers down before running any of them** — a threshold chosen after seeing the result, by the
person who wants the feature to exist, is not a gate.

**All three survive the pivot, and the measurement that does not survive is not in this list.**
The within-sentence rate and the false-question rate both score the user's own explanation against
hand marks on that same explanation, so neither ever depended on the notes; vault eligibility is
already done. What collapsed on 2026-08-07 is the evaluation of the *finding*. Compare's gold
labels were spans into real text and there is no real text on the default path, so *did the model
name a gap that is really a gap in this person's understanding* now has no gold standard short of a
subject expert per case. The 100–150 labelled items and the paired regression protocol were both
written assuming a document to compare against. This page has no replacement to offer and does not
invent one.

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

**What this rate covers, checked 2026-08-07.** Its gold labels are the causal links you hand-marked
in your own written-out explanations, not anything in your notes, so the measurement is intact and
still worth running exactly as written: it bounds how often the live child asks about a step you
did explain. This is worth stating because the pivot was described elsewhere as having taken the
false-question rate's ground truth away with the notes. On the text of this section that is not
what it measures, and the next person here should read the paragraph above rather than trust either
summary. What it does **not** cover is the default-path finding. Cohere is set arithmetic over the
explanation's own graph and never consulted a source, so nothing in this week measures whether
model knowledge names a real gap. That measurement does not exist and is not scheduled.

**Vault eligibility.** Done 2026-08-06 for one vault; result in
[issue #26](https://github.com/danielhkuo/HoldTrue/issues/26). Roughly 13–16% of notes are causal
mechanisms, and of those nearly all already carry a quotable causal sentence. Eligibility is
**not** the binding constraint. Generalisability to other people's notes is open.

**A live-only first release is available; whether it is worth shipping is open.** The unrefuted
objection was this: strip the fiction and the modal session is a prompt followed by rereading your
own notes, which is on the do-not-build list, and the answerability gate selects the concepts you
most likely already knew. **Both halves of that objection changed on 2026-08-07 and neither
resolved.** There is no rereading to fall back on, so a live-only session ends on a question whose
answer would have to come from the model — which is not on the do-not-build list, but is also a
prompt followed by a model explaining a thing, and the whole product then rests on Law 1 being
satisfied by output nothing validates. The answerability gate loosens in the same move, since what
the model can answer is very much wider than what one folder could, which weakens the *concepts you
already knew* half and does nothing for the first. The objection is differently shaped, not
smaller. The counter is to treat the live child as an internal instrument and
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
  to 150 labelled explanations. The labels are spans into the explanations themselves, so the
  work is unaffected by the pivot. The conclusion attached to it is not. *If a small local model
  cannot, this feature is cloud-only or it does not exist* was written when a small local model
  was the target; on 2026-08-07 the floor moved up to the largest model the user's machine can
  actually hold, with local-first intact, and what happens when someone runs something weaker is
  ruled in [`../philosophy.md`](../philosophy.md) rather than here.
- **Which speech-to-text engine.** Open. The choice is constrained, not free: thinking-aloud
  speech runs 15 to 25% word error rate, and errors fall hardest on accented and non-standard
  speech. Apple's SpeechAnalyzer, Parakeet and Kokoro publish no fairness data at all. Step 3
  turns that error into typing rather than a false finding, but those users still type more.
- **When the child interrupts.** After you stop talking is cheap. Mid-sentence needs streaming
  transcription and streaming extraction, and is a much bigger build. It needs no retrieval
  either way: the live child never consults a library, and by default there is not one to
  consult.
- **What Clarity counts.** Sentence length, pronouns with two antecedents, terms used before
  they are introduced, speech rate. Each has to be something you could count by hand.
- **Whether Cohere's finding survives bad extraction.** The best open-IE score anyone has
  published is 53.5 F1 on CaRB, a written-prose benchmark, and nobody has measured spoken learner
  explanation at all — so Cohere will sometimes see a hole that is not there, by an unknown
  margin. This is why the child *asks* instead of telling: a wrong question costs one round trip,
  a wrong claim costs everything.

**Settled here, recorded in `decisions.md`:** voice-first input, the two checks in order, and
Clarity as a separate instrument. *The child as a listener that knows only your source* sat on
this list until 2026-08-07 and is now superseded; what replaces it is open, and nothing on this
page should be read as having answered it.

**Still refused: disfluency as a signal.** Transcription strips filled pauses, so the obvious
fix is a second model reading the audio for hesitation. Trivial to build, false at the
premise: **disfluency during explanation does not indicate uncertainty about the content.**
Schachter et al. 1991 recorded lecturers on their own specialties, certainty at ceiling, and
found filled-pause rates varying threefold by discipline (1.39 to 4.85 per minute),
differences that vanished on a shared topic. Disfluency tracks how many ways a topic can be
phrased, and this domain is conceptually open. A within-speaker baseline does not help: that
confound is within-speaker too. See the evidence base.
