# Extraction benchmarks: what the published numbers actually measure

> **Engineering measurements, not learning evidence.** [`philosophy.md`](../philosophy.md) scopes
> the evidence gate to claims about *how people learn*, and says in as many words that engineering
> measurements are a separate category, not gated there, but required to carry their source. This
> file is where they carry it. Nothing below is a claim about learning, and nothing below may be
> used as one. The reverse also holds:
> [`evidence-base.md`](evidence-base.md) governs learning claims and no benchmark F1 belongs in it.

> **Built 2026-08-07**, after a council traced three uncited figures already sitting in the repo
> and found that two were misread and one could not be found at all. Every figure below carries its
> source URL, its genre, its metric and its sample size inline, and is tagged **verified** (walked
> to a primary source in this pass), **second-hand** (reported by a paper about someone else's
> result, or by a search summary), **not found**, or **refused** (walked to the named source and
> contradicted by it).
>
> **Extended 2026-08-10**, after four researchers investigated the GPT-4 figure this file carries.
> Section 3 was rewritten — its citation was wrong, its sample-size claim belonged to a different
> paper, its gloss overstated, and one of its comparisons has been withdrawn. Sections 6 and 7 are
> new. **Four of the figures brought back by that pass did not survive checking and are recorded as
> refused rather than dropped**, on the standing principle that the table of things that failed is
> the most reusable part of this file. Three further figures were corrected rather than refused.
> **Where a source was read through a summarising fetch rather than eyeballed in the PDF, that is
> said at the point of use.**

## Where this file sits, and why it is not a row in the evidence base

Two placements were available. The evidence base is the older and more obvious one, and it was
rejected: its whole value is that its scope is sharp. It answers one question — *may the product
say this about learning?* — and a table of causal-extraction F1 scores answers a different question
that shares none of its rules of use. Blurring the two would cost more than the convenience is
worth, and `philosophy.md` already draws that line.

The second placement, the one `philosophy.md` names, is *with the decision the figure justifies*.
That is right for a figure that justifies one decision, and wrong here: the 97/5 figure alone
appears in `docs/features/feynman.md`, `docs/decisions.md`, `AGENTS.md` and
`measurements/within-sentence/README.md`, four copies of one claim with no source under any of
them. That is exactly how it survived. So the provenance lives once, here, and the four sites
point at it. A sibling under `research/` also matches what is already here: the STT files
([`stt-parakeet.md`](stt-parakeet.md), [`stt-cloud-byok.md`](stt-cloud-byok.md),
[`stt-local-candidates.md`](stt-local-candidates.md)) are engineering measurements kept the same
way.

## Verdict: no published figure covers the genre this project needs

**Nobody has measured causal extraction on spoken, from-memory explanation by a learner.** Not
approximately, not in an adjacent genre — the measurement does not exist. Everything below is
written text, and most of it is *edited* written text. This is the most useful sentence on the
page, because it is what makes the falsification week necessary rather than optional: there is no
number to substitute for the count, so the count has to be run. **Re-tested 2026-08-10 against a
fresh pass over fourteen sources, and it survives with more under it than before, not less** — the
gaps are now three rather than one, and they are enumerated at the end of
[section 7](#7-what-a-2732b-local-model-can-do-which-is-the-configuration-this-repo-committed-to).

**The nearest neighbour is RECCON, and it is not speech.** Poria et al., *Recognizing Emotion Cause
in Conversations* (arXiv:2012.11820, <https://arxiv.org/abs/2012.11820>), is the only widely-used
corpus that annotates cause spans in *dialogue*: over 1,000 dialogues and roughly 10,000 utterance
cause–effect pairs. Its main subset, RECCON-DD, is annotated from DailyDialog, whose own paper
(arXiv:1710.03957) describes it as *"human-written and less noisy"* — written text about daily
conversation, not a transcript of anyone speaking. The transfer subset, RECCON-IE, comes from
IEMOCAP, acted dyadic conversation. Neither is a person explaining a mechanism from memory.

**And RECCON already loses a fifth to a third of its score to a domain shift inside its own paper.**
Causal Span Extraction, F1<sub>Pos</sub> with conversational context, Table 4: SpanBERT **60.00 on
RECCON-DD against 37.80 on RECCON-IE**, a 22.2-point drop; RoBERTa-Base **58.17 against 26.88**, a
31.3-point drop. Same task, same annotation scheme, same authors — the change is only which
dialogues. A model moving from written dialogue to spoken learner explanation is a larger shift
than the one that cost those models a third of their score. *(Verified against
<https://ar5iv.labs.arxiv.org/html/2012.11820>.)*

**Speech adds a second penalty on top, and it compounds.** Romana, Koishida & Mower Provost,
*Automatic Disfluency Detection from Untranscribed Speech* (arXiv:2311.00867), on Switchboard
telephone conversation — 167,777 training / 9,722 dev / 7,529 test segments — states: *"when
comparing the use of manual transcripts to Whisper-FT, unweighted and weighted recall averages drop
from 0.71 to 0.26 and 0.86 to 0.36, respectively."* Whatever a text model scores on a clean
transcript is an upper bound on what it scores on ASR output, and the gap is not small.
**Caveat, flagged rather than smoothed over:** a table in the same paper lists Whisper-FT unweighted
and weighted *recall* at 0.44 and 0.60, with 0.26 and 0.36 appearing alongside as F1. The quoted
sentence and the table disagree on which metric 0.26 names. The direction and rough magnitude hold
either way; the exact metric behind 0.26 is unresolved and should be checked in the PDF before the
number is used anywhere it matters. Note also that Switchboard is spontaneous *conversation*, so
this is a bound borrowed from a third genre, not our own.

Consequently: the two-column addition to the falsification week — for each cross-sentence link
marked by hand, whether a connective opened the effect sentence and whether the cause was in the
immediately preceding sentence — is worth more than every published statistic on this page. It
costs no extra collection and it is the only distribution measured on the actual genre.

## 1. The 97/5 figure, and the five reasons it cannot carry a general claim

The claim in the repo is *"causal extraction runs ~97% F1 within a sentence and roughly 5% across
one."* It traces to **PubMedCausal**, Kunle-John et al., *A Span-Level Annotated Corpus for Causal
Relation Extraction in Biomedical Text* (arXiv:2605.28363, <https://arxiv.org/abs/2605.28363>).
The paper is real and the two numbers are in it: **intra-sentential Cosine Pair F1 0.9743 against
inter-sentential 0.0500**, DeepSeek-R1-32B with few-shot prompting. Its headline figure for that
same model is **Cosine Pair F1 0.6765**, and the best detection score in the paper is PubMedBERT at
F1 0.7391. **Verified** against the abstract and the full HTML text
(<https://arxiv.org/html/2605.28363v1>).

Everything in the rest of this section is verified from the same source, and each item is on its
own sufficient to stop the figure generalising:

- **The 5% is computed over 202 instances.** The corpus holds 6,491 adjudicated cause–effect pairs,
  of which **6,289 are intra-sentential and 202 inter-sentential (3.1%)**. A score over 202 items
  is a description of those 202 items.
- **The metric is relaxed cosine matching at a 0.75 threshold**, not exact span extraction. The
  paper's stated reason is to tolerate boundary variation in long biomedical spans. It is a more
  forgiving metric than the one an extractor would face here.
- **The corpus was keyword-filtered.** Its abstracts were retrieved from PubMed on the keyword
  *"causality"* over 1 January – 3 September 2025, 24,603 abstracts before preprocessing, 30,000
  paragraph rows annotated. Cross-sentence relations in such a corpus are the residue that a
  causality keyword filter failed to catch — the hardest slice available, not a representative
  sample.
- **The genre is PubMed abstracts**, the most compressed edited prose in circulation, written under
  a word limit by people trained to put a claim in one sentence.
- **The corpus is 96.9% intra-sentential by construction.** That is a property of biomedical
  abstracts, and it does not survive a change of genre. See section 2.

## 2. The intra-sentential share swings threefold between two written genres

EventStoryLine, the standard news-domain corpus for event causality, runs the other way. Version
0.9 as preprocessed by Chen et al., *Identifying while Learning for Document Event Causality
Identification* (arXiv:2405.20608, <https://arxiv.org/html/2405.20608>): **258 documents, 1,751
intra-sentence causal pairs against 3,727 inter-sentence** — intra is about **32%**. **Verified**
against that paper. A different pair of counts, **1,770 intra against 3,885 inter**, circulates
widely for the same corpus and probably reflects different preprocessing; it is **second-hand**
here, and it gives the same ratio, so the conclusion does not turn on which is right.

PubMed abstracts 96.9% intra-sentential, news 32%. Two *written* genres, a threefold swing. No
published number transplants into spoken learner explanation, and the direction of the transplant
error is unknown.

The supervised scores on EventStoryLine also show nothing like a 19× gap. Existence identification,
F1, as tabulated in the baselines of arXiv:2506.05675 (<https://arxiv.org/html/2506.05675>):

| Model | Intra-sentence F1 | Inter-sentence F1 | Ratio |
|---|---|---|---|
| BERT | 52.0 | 34.3 | 1.5× |
| ERGO | 63.9 | 47.1 | 1.4× |
| SENDIR | 66.2 | 48.3 | 1.4× |
| iLIF | 71.2 | 59.1 | 1.2× |

Roughly **1.2–1.5×**, against the 19× the 97/5 figure implies. **Verified** as the table printed in
that paper — which is itself reporting other authors' results, so it is second-hand *to the
originating papers*. That matters, because reproductions disagree: the council's own sweep recorded
BERT 52.1/32.6, RichGCN 55.2/42.2, ERGO 59.0/45.8, CHEER 62.6/48.4, SENDIR 66.2/48.3. SENDIR agrees
exactly, ERGO differs by five points. **Treat any single reproduction of these baselines as ±5 F1.**

## 3. Zero-shot LLM extraction scores badly, and the number says less than this file claimed

**Rewritten 2026-08-10 on four counts: the citation, the sample size, the gloss, and a comparison
that has been withdrawn.** Everything the section concluded about *direction* survives. Almost
nothing it said about *magnitude* did.

**The citation was three links long and terminated in the wrong place.** The 11.5 figure does not
originate in arXiv:2506.05675, which is where this file used to send readers. It originates in
**Gao, Ding, Qin & Liu, *Is ChatGPT a Good Causal Reasoner? A Comprehensive Evaluation*, Findings of
EMNLP 2023 (arXiv:2305.07375, <https://arxiv.org/abs/2305.07375>), Table 1**; arXiv:2506.05675
reproduces it. **Verified** — the title, the four authors, the *"Accepted to Findings of EMNLP 2023"*
comment field and the abstract against the arXiv listing, and Table 1 against the ar5iv full text
(<https://ar5iv.labs.arxiv.org/html/2305.07375>). Table 1, as read there:

| Model | Corpus | P | R | F1 |
|---|---|---|---|---|
| gpt-4 | Causal-TimeBank | 6.1 | 97.4 | **11.5** |
| gpt-3.5-turbo | Causal-TimeBank | 6.9 | 82.6 | 12.8 |
| text-davinci-003 | Causal-TimeBank | 8.5 | 64.4 | 15.0 |
| gpt-4 | EventStoryLine | 27.2 | 94.7 | 42.2 |
| gpt-3.5-turbo | EventStoryLine | 27.6 | 80.2 | 41.0 |
| text-davinci-003 | EventStoryLine | 33.2 | 74.4 | 45.9 |

Two things changed in the walk back to the primary source, and both are small enough to be worth
recording precisely. The reproduction printed **GPT-3.5 precision 7.0 where the original prints
6.9** — a rounding drift of one tenth, harmless in itself, and a clean demonstration that the old
table was a copy of a copy. More importantly, **the primary table carries one row per corpus per
model, with no intra-sentence or inter-sentence label on any of them.** The `intra-sentence` and
`inter-sentence` tags this file used to attach to every row, and the sixth row it used to print
(GPT-4 EventStoryLine inter-sentence, 16.9 / 64.7 / 26.8), are not visible in Table 1 and came in
through the reproduction. *Caveat on how this was read: the ar5iv text was fetched through a
summarising channel rather than eyeballed in the PDF, so treat the absence of a split as strong but
not certain. If anything downstream turns on the 11.5 being an intra-sentence-only figure, open the
PDF.* Nothing downstream should turn on it, for the reason in the next paragraph but one.

**This is a March-to-April 2023 GPT-4.** The paper states: *"We conduct our experiments using
OpenAI's official API (accessed between 3/1/2023 and 4/28/2023)."* That is more than three years
before the pivot that made model capability the guard, and two model generations before anything
this repo would run. The figure is not evidence about a model available today, and it should not be
quoted as though it were. What it is evidence about is a *protocol*, which is the whole of the rest
of this section.

**The "10% test split" this file used to report describes a different paper's protocol.** Gao et al.
state plainly: *"we sample 1000 instances from each dataset for evaluation."* One thousand instances,
randomly drawn, per corpus. The sample sizes are therefore known exactly, and the positive counts
can be recovered from the published precision and recall, which is worth doing because they close to
the integer:

- **Causal-TimeBank.** Recall 97.4% and precision 6.1%. Thirty-nine positive pairs gives 38 true
  positives (38/39 = 97.4%) and 38/0.061 = **623 total yes answers**.
- **EventStoryLine.** Recall 94.7% and precision 27.2%. One hundred and eighty-eight positives gives
  178 true positives (178/188 = 94.7%) and 178/0.272 = **654 total yes answers**.

So the model answered yes to **623 of 1,000 pairs (62.3%)** on one corpus and **654 of 1,000 (65.4%)**
on the other. **The behaviour is essentially identical across the two.** What differs is the base
rate — **3.9% against 18.8%** — and that alone is what turns one yes-bias into an 11.5 and a 42.2.
*Status: the 1,000-instance sample and the P/R/F1 are **verified** from the paper; the positive
counts and the yes counts are **reconstructed arithmetic**, not printed figures. They are reported
here because the reconstruction is exact to the integer under the published rounding, and a
researcher checked them against the authors' released evaluation files — that last check is
**second-hand**, I did not open those files.*

**The gloss this file carried overstates, and the fix is to change which number travels.** *"The
model says yes to almost everything"* is the right direction. Using **6.1 precision** to say it is
the wrong statistic, because 6.1 is mostly a report on the base rate. An always-yes classifier —
one that answers yes to all 1,000 pairs and has no ability whatsoever — scores F1 = 2p/(1+p) for
base rate p, which is **7.5 on Causal-TimeBank** and **31.7 on EventStoryLine**. GPT-4 scored 11.5
and 42.2. It clears the do-nothing baseline by four points and ten and a half points respectively:
real, small, and nothing like the collapse a 6.1 implies on its own. **The transferable number is
the 62% yes-rate, not the 6.1 precision.** A yes-rate transfers across genres; a precision computed
against a 3.9% base rate does not transfer anywhere.

> **Discrepancy, recorded rather than smoothed over.** The research pass that produced this section
> reported the always-yes baselines as **8.0 and 37.0**. I could not reproduce either from the base
> rates that same pass supplies: 2p/(1+p) at p = 0.039 gives 7.5, and at p = 0.188 gives 31.7, and
> recovering 8.0 and 37.0 would require base rates of about 4.2% and 22.7%. The arithmetic above is
> shown so the next reader can check it in one line rather than trust either figure. The conclusion
> is unaffected in direction and slightly *more* favourable to the model than the brief had it.

**Withdrawn: the comparison against section 2.** This file used to say that GPT-4's 11.5 sits *"six
points below the worst supervised inter-sentential number in section 2."* That sentence is gone. It
compares a score on Causal-TimeBank against scores on EventStoryLine, and those corpora differ
nearly fivefold in positive rate — 3.9% against 18.8% in the samples above. F1 is not comparable
across a base-rate gap that size, and the always-yes baselines make the point concrete: the same
null classifier scores 7.5 on one corpus and 31.7 on the other without changing its behaviour at
all. Cross-corpus F1 comparison is the error this section was itself committing.

**And the two corpora do not label the same relation, which compounds it.** Causal-TimeBank
annotates explicitly marked causality only, by design. EventStoryLine's link set is largely
*derived*: **2,265 causal relations were annotated by hand and the rest extended automatically
through within-document event coreference chains** — **second-hand**, from a search summary of
Caselli & Vossen's corpus paper and the corpus site (<https://cltl.github.io/EventStoryLine/>); I did
not open the paper. A figure of **117 links carrying an explicit causal marker** was reported to this
pass and **I could not confirm it from any source I opened; do not cite it.** A companion figure of
**5,519 total links** is also unconfirmed and matches neither count already in section 2 (1,751 +
3,727 = 5,478, or 1,770 + 3,885 = 5,655), so it appears to be a third preprocessing. The claim that
survives is the qualitative one, and it is enough: **one corpus labels explicit causality and the
other labels a coreference-extended superset, so a model scored on both is not being asked the same
question twice.**

**The prompt was one line, and this is the finding with the most carry-over.** The entire input,
per the paper's own description of its zero-shot condition, was:

```
Input: {sentence}
Question: is there a causal relationship between "{event1}" and "{event2}" ?
Answer:
```

No system message. No definition of what counts as causal. No output format. One sentence of
context. Gold event mentions handed to the model, so the detection problem was removed and only the
judgement remained. **A bidirectional consistency check — ask both orderings and require the two
answers to agree — was reported to this pass as roughly tripling F1 on Causal-TimeBank, at
gpt-4o-mini 34.4 and DeepSeek-Chat 40.6 against GPT-4's 11.5 without. Second-hand and unsourced: no
URL came with it and I could not locate the paper. Do not cite the numbers.** The idea is cheap
enough to test directly if anyone wants it, and the direction is consistent with everything else on
this page: yes-bias is the failure of a one-line prompt, not a measured ceiling on the capability.

**What the figure is still good for.** Read as a protocol result rather than a capability result, it
still supports the thing this repo needs it to support. A model given no definition, no format and
one sentence of context says yes about 62% of the time regardless of how often yes is correct, and a
model that says yes to almost everything produces findings. That was the failure mode Law 2 was built
to survive, and Law 2 was repealed on 2026-08-07, so nothing structural survives it now. Precision is
the axis Law 1 charges for, and the live risk the model-knowledge pivot accepts is exactly this one.
What may no longer be said is that a large model has been shown to *fail* at causal extraction. What
has been shown is that a 2023 model under a one-line prompt exhibits a yes-bias, which is a fact
about the prompt at least as much as about the model.

Sample size context, unchanged and still governing: Causal-TimeBank is **184 documents, 7,608
annotated relations, of which only 318 are causal**, per the survey table in arXiv:2411.10371
(<https://arxiv.org/html/2411.10371v5>). EventStoryLine is 258 documents, 22 topics, 5,334 event
mentions. Against those totals, a 1,000-pair sample holding 39 positives is a thin slice of a thin
corpus.

## 4. The axis that actually moves the number is explicit versus implicit

PubMedCausal's own table, same corpus and same model as the 97/5 split: **explicit causality F1
0.8803 against implicit 0.3920**, a 49-point gap, on 4,096 explicit pairs (63.1%) and 2,395 implicit
(36.9%). **Verified.** That gap is larger than the intra/inter gap in every source on this page
except PubMedCausal's own 202-item slice. Whether the cause and effect share a sentence matters
less than whether anything in the sentence says *because*.

**The share of causal relations carrying an explicit connective is genre-dependent and I could not
pin it down. Second-hand, do not cite.** The council recorded 28–34% for edited prose. I could not
reach a primary source for it in this pass. Two data points bracket the uncertainty rather than
resolving it: PubMedCausal itself measures **63.1% explicit** in biomedical abstracts, which is
double the council's figure; and a search summary attributes to Taboada a figure of **30.86% of
coherence relations marked in English** — but that is all coherence relations, not causal ones, and
I did not open the paper. The honest statement is that the explicit share is somewhere well short of
universal and swings hard by genre, which is enough to motivate the connective column in the
falsification week and not enough to put a percentage in a design doc.

## 5. The two open-IE figures: one misattributed, one absent

**"Graph extraction from prose scores ~0.535 F1 for the best frontier model measured" is
misattributed.** 53.5 is IMoJIE's optimal F1 on the CaRB benchmark, from Kolluru, Aggarwal, Rathore,
Mausam & Chakrabarti, *IMoJIE: Iterative Memory-Based Joint Open Information Extraction*, ACL **2020**
(arXiv:2005.08178, <https://arxiv.org/abs/2005.08178>). Optimal F1 **53.5**, AUC 33.3, last F1 53.3,
against CopyAttention 35.4 and CopyAttention+BERT 51.6. IMoJIE is a BERT-based sequence-generation
system extending CopyAttention — **not a frontier model, and six years old**. Whatever a frontier
model scores on CaRB, this is not it. **Verified** against <https://ar5iv.labs.arxiv.org/html/2005.08178>.

**"~0.30 at 8B" has no source for 8B. Second-hand.** The council recorded small models landing in
the high-20s to mid-30s on CaRB/ReOIE — LLaMA-2-13B 36.2 and 25.7, GPT-3.5 zero-shot 39.1 and 25.9 —
which makes the figure directionally plausible and specifically unsupported. Not retrieved in this
pass.

**"One study reached 95% precision at 9% recall" could not be found. Not found.** The council
searched several ways and got nothing. I did not re-run the search. Treat as unsupported: it is not
that the study is weak, it is that no one has produced it.

## 6. The literature that actually bears on this product, which was never cited here

**Added 2026-08-10.** Every figure above measures causal *extraction* — pull the cause and the effect
out of a text. That is not the task this product performs. Extract feeds Cohere and Compare, and what
reaches the user is a model reading someone's explanation and naming what is missing from it. There
is a literature on exactly that, under the names *feedback generation*, *short-answer scoring* and
*mistake finding*, and none of it was on this page. It is closer to the product than causal
extraction is, and it is worse news.

**Prompted models invent problems in correct work, at a measured rate.** Oli, Banjade, Olney & Rus,
*Can LLMs Identify Gaps and Misconceptions in Students' Code Explanations?* (arXiv:2501.10365,
<https://arxiv.org/abs/2501.10365>), tests zero-shot prompting against supervised fine-tuning and
ORPO preference alignment on student explanations of code. Two sentences from its results section are
the reason it belongs here, both **verified** against the full HTML (<https://arxiv.org/html/2501.10365v1>):
*"This issue was particularly evident when the input data was complete and correct. In these cases,
the LLMs would sometimes (27%) generate explanations that falsely identified problems in the code
explanation or even in code or focused on superficial aspects like formatting or style"*, and *"When
dealing with code explanations that were mostly correct with minor typos or issues, the LLMs
performed poorly, fabricating non-existent issues in 34% of our qualitative analysis sample."* Note
the shape: **the failure concentrates precisely where the learner did well.** A learner who explains
something correctly has roughly a one-in-three chance of being told about a problem that is not
there. That is invariant 6's nightmare arriving through the front door, and it is the same yes-bias
as section 3 wearing different clothes.

> **Correction to the figure this pass was given.** Human ratings of feedback accuracy were reported
> to me as **0.58–0.67**. Table 2 of the paper gives a *"Correct"* column running **0.56 to 0.78**
> across models and approaches, with LLaMA-3 ORPO at the top and GPT-4 prompted at the bottom — a
> wider spread, and one whose top end is reached by a *fine-tuned* model rather than a prompted one.
> Use 0.56–0.78 and say which end is which. Inter-rater agreement on that judgement was high,
> Cohen's κ = 0.94 for correctness, so the spread is a real property of the models and not of the
> raters. *(**Verified**, same fetch, read through a summarising channel rather than the PDF.)*

**Models confirm the expected answer and reject the unexpected one.** Yasir, Li, Gilson, Dey Tithi,
Tian & Barnes, *Confirming Correct, Missing the Rest: LLM Tutoring Agents Struggle Where Feedback
Matters Most* (arXiv:2605.16207, <https://arxiv.org/abs/2605.16207>), evaluates seven LLM feedback
agents over **10,836 solution–feedback pairs** in propositional logic tutoring. Its abstract, **verified**,
states that models *"achieved near-ceiling performance on optimal steps but systematically
over-rejected valid but suboptimal reasoning and over-validated incorrect solutions."* **This is the
single most relevant sentence on this page for HoldTrue.** A learner explaining a mechanism from
memory produces valid-but-non-canonical reasoning as the normal case, not the edge case; a system
that confirms the textbook path and rejects the rest is a system that punishes the learner for not
having memorised the textbook. *(**Second-hand and not confirmed:** the figures reported to this pass
of **516 proof states**, **F1 94–99% on optimal solutions against 0–76% on valid alternatives**, and
**LLaMA-3.3-70B rejecting 91% of valid alternative reasoning**, are not in the abstract and I did not
open the full text. The abstract's own count is 10,836 pairs, which is a different quantity from 516
states and may well be consistent with it. **2026 preprint, unreviewed.** Cite the direction, not the
numbers, until someone opens the PDF.)*

**And the damage concentrates in the middle of the quality range.** Gurin Schleifer, Ariely, Beigman
Klebanov, Salman & Alexandron, *Quality-Conditioned Agreement in Automated Short Answer Scoring:
Mid-Range Degradation and the Impact of Task-Specific Adaptation* (arXiv:2605.07647,
<https://arxiv.org/abs/2605.07647>), compares three few-shot LLMs (GPT-5.2, GPT-4o, Claude Opus 4.5)
against a fine-tuned BERT encoder and a second human expert, on two open-ended biology items and
several hundred student responses. **Verified** from the abstract: *"human-human agreement is highest
and stable across the full quality spectrum. All AI models perform well on fully correct and fully
incorrect responses, but exhibit substantial degradation on mid-range responses."* The paper draws
the consequence itself — mid-range degradation *"may lead to inequitable evaluation of responses
produced by students with developing understanding"* — and a student with developing understanding is
the entire population this product serves. *(**Second-hand:** the category-distance figures reported
to this pass — **0.5–0.8 on clearly-correct, 0.6–0.9 on clearly-wrong, 2.2–3.5 on partially-correct,
against a second human rater's 0.12–0.43** — are not in the abstract and I did not open the full
text. **2026 preprint, unreviewed.** The ratio they express is the abstract's own claim, so they are
plausible; they are not verified.)*

**Decomposing a task into more calls makes false alarms more likely, and this bears on invariant 8.**
Tyen, Mansoor, Cărbune, Chen & Mak, *LLMs cannot find reasoning errors, but can correct them given
the error location* (arXiv:2311.08516, <https://arxiv.org/abs/2311.08516>) — the paper that releases
the **BIG-Bench Mistake** dataset, which is the dataset's name and not the paper's — reports in
section 3.2 that *"accuracy on traces with no mistakes goes down considerably from direct,
trace-level prompting to CoT, step-level prompting"*, and gives the mechanism in one line: *"If each
generation call has some probability of identifying a mistake, then the more calls made on each
trace, the more likely the model will identify at least one mistake."* **Verified** against the full
HTML (<https://arxiv.org/html/2311.08516v3>).

**Flagged, not ruled on.** Invariant 8 mandates per-sentence decomposition, and is marked
*unwarranted pending measurement* as of 2026-08-07. This result is the first published thing this
repo has found that bears on it *against*, and it bears obliquely rather than directly: it says that
splitting a mistake-finding task into more calls costs accuracy on the clean cases specifically,
which is the same asymmetry as the 27%/34% above and the same one Law 1 charges for. It is not a
ruling. The genres differ, the task is mistake-finding in reasoning traces rather than causal
extraction from speech, and one paper does not settle an invariant that this repo has already agreed
will be settled by
[`measurements/within-sentence/`](../../measurements/within-sentence/README.md). **Recorded here so
that whoever runs that measurement knows to look at the clean-explanation false-alarm rate and not
only at the link-recovery rate.** Per invariant 8's own instruction: do not argue it either way from
a published number, including this one.

**Refused: the retrieval-augmented grading figure.** This pass was given *"73.6% on unseen answers,
22.3% on unseen questions against a 20% random baseline"* attributed to arXiv:2408.03811. The paper
is real — Wang & Ormerod, *Generative Language Models with Retrieval Augmented Generation for
Automated Short Answer Scoring*, 7 August 2024 (<https://arxiv.org/abs/2408.03811>) — and its own
tables contradict the claim. On SemEval-2013 SCIENTSBANK 3-way the proposed approach scores **74.8–78.7%
on unseen answers and 73.1–76.9% on unseen questions** across Claude 2, Claude 3 Haiku and Claude 3.5
Sonnet; on the 2-way task, 80.1–82.9% and 79.7–83.0%. No 22.3% appears, no 20% random baseline is
reported, and **unseen questions do not collapse relative to unseen answers** — the gap is a few
points, not fifty. The claimed generalisation failure is not in this paper. *(Read through a
summarising fetch of <https://arxiv.org/html/2408.03811v1>; if someone believes the 22.3% is real,
it belongs to a different paper and needs finding.)*

## 7. What a 27–32B local model can do, which is the configuration this repo committed to

**Added 2026-08-10.** [`docs/decisions.md`](../decisions.md) fixes the local floor at *"roughly a
27–32B-class model at 4-bit, about 20 GB resident"* and records, correctly, that **no model is named
and no accuracy figure is quoted, because nothing has been run at that size for this task.** Nothing
below changes that. What follows is the published surround: what models of that class have been
measured doing on adjacent tasks, and where the measurements stop. It is context for the eventual
run, not a substitute for it, and it is placed here rather than in the decisions table for exactly
that reason.

**A 32B model was the best open extractor of thirteen, and it was not close to good.** Anuyah,
Shajee-Mohan, Chauhan & Chakraborty, *Benchmarking LLMs for Pairwise Causal Discovery in Biomedical
and Multi-Domain Contexts* (arXiv:2601.15479, <https://arxiv.org/abs/2601.15479>), tests **13
open-source LLMs** on pairwise causal discovery across 12 datasets. **Verified** from the abstract:
the best detection model reaches **49.57% accuracy**, and *"the best for extraction,
Qwen2.5-Coder-32B-Instruct, reached just 47.12%."* Performance *"degraded substantially for implicit
relationships, multi-sentence links, and texts with multiple causal pairs"* — the same explicit-versus-implicit
and intra-versus-inter axes as sections 2 and 4, reproduced at open-model scale. **Two cautions
before this number is used.** First, **the metric is ambiguous**: the abstract calls the detection
figure *accuracy* and gives the extraction figure bare, and it was reported to this pass as *F1*. Do
not write "47.12 F1" until someone confirms it. Second, the claims that this model **beat both 70B
models in the comparison** and that its errors break down as **35.7% missed relations against 0.31%
false positives** are **second-hand** — not in the abstract, not opened by me. That error breakdown
is the most interesting claim in the whole brief if true, because it inverts section 3: at 32B with
candidates supplied, the failure mode would be *silence* rather than over-assertion, which would put
the yes-bias in the *detection* step rather than the judgement step. **It is also the claim most
worth confirming before anyone designs around it.** **2026 preprint, unreviewed.**

**Refused: the fivefold task-shape synthesis.** This pass was given the claim that prompted 27–32B
models score **~0.47–0.58 on relation extraction when arguments and a label inventory are supplied
and ~0.09–0.12 when they must find the arguments themselves**, a roughly fivefold effect, sourced to
*"two independent papers: arXiv:2601.15479 and arXiv:2602.17475."* **The second paper is not about
that.** arXiv:2602.17475 is Ferrazzi, Franzin, Lavelli & Magnini, *Small LLMs for Medical NLP: a
Systematic Analysis of Few-Shot, Constraint Decoding, Fine-Tuning and Continual Pre-Training in
Italian* (<https://arxiv.org/abs/2602.17475>), and it studies models *around one billion parameters*
on Italian clinical text. It supports no 27–32B figure, and its headline result runs the other way on
scale entirely: **a fine-tuned Qwen3-1.7B beats Qwen3-32B by an average of +9.2 points** across 20
clinical tasks. The synthesis therefore rests on one paper, not two, and one paper is not a
synthesis. **The task-shape claim is withdrawn.** *(The Italian paper is genuinely useful, just not
for this: it is the best evidence on this page that **task-specific fine-tuning at small scale can
beat prompting at large scale on structured extraction**, which is a live option this repo has never
priced. Different genre, different language, and it belongs in a decision about adaptation strategy
rather than in a benchmark table. **Verified** from the abstract.)*

**Qwen 2.5 32B is among the best abstainers measured, and reasoning tuning makes abstention worse.**
Kirichenko, Ibrahim, Chaudhuri & Bell, *AbstentionBench: Reasoning LLMs Fail on Unanswerable
Questions* (arXiv:2506.09038, <https://arxiv.org/abs/2506.09038>), evaluates **20 LLMs across 20
datasets** of unanswerable, underspecified, false-premise and stale questions. **Verified** against
the full HTML (<https://arxiv.org/html/2506.09038v1>): *"While GPT-4o and Qwen 2.5 perform the best on
average"*; *"we observe almost no effect of increasing scale on mean abstention over datasets"*; and
*"reasoning models DeepSeek R1 (Distill Llama 70B) and s1 show an average of 24% drop in abstention
compared to their non-reasoning counterparts."* **Record this as a model-selection rule, because it
is one of the few places on this page where the published work reaches an actual decision.**
Invariant 4 defines `confidence` as *"how strong is my reason to stay quiet"* — brake pressure — and
is itself marked for review. Whatever that review concludes, a system whose safety property is
*staying quiet when it should* has a measured reason to prefer an instruction-tuned Qwen 2.5-class
model at the 32B floor and a measured reason to be wary of a reasoning-tuned variant, and no reason
at all to expect a bigger model to help. *(Caveat on precision of reading: the quoted sentence names
the **Qwen 2.5 family**, not the 32B Instruct variant specifically; that the evaluated variant is
Qwen 2.5 32B Instruct came from the same fetch's framing rather than from the quoted sentence. Read
through a summarising channel, not the PDF.)*

**A propose-then-verify split buys precision at a small cost in recall, and the gain is not
frontier-only.** Ming, Han, Hong, Zhang & Kilicoglu, *ANCHOR-RE: An Agentic Neuro-Symbolic Framework
for Grounded Biomedical Relation Extraction* (arXiv:2608.03154, <https://arxiv.org/abs/2608.03154>),
folds ontology-guided reasoning, knowledge grounding and data-driven verification rules into LLM
inference. **Verified** from the abstract: micro-F1 rises from **0.654 to 0.676 on SemRepGS, 0.769 to
0.872 on DDI, and 0.939 to 0.941 on ChemProt** against direct prompting, and *"similar performance
gains observed with open-weight LLMs indicate that the benefits were not limited to the proprietary
backbone."* On a post-cutoff set of 100 articles published in 2026, manual assessment of 500 sampled
predictions gave **69% precision**. The abstract also names the problem in this repo's own terms:
LLMs *"remain prone to false-positive predictions."* *(**Second-hand and not in the abstract:** the
figures reported to this pass of **micro-precision 0.534→0.576 against recall 0.844→0.816**, and the
claim that **Qwen3-32B specifically** was one of the open-weight backbones. The abstract says
open-weight models were used without naming them. **2026 preprint, unreviewed.**)*

**Four-bit weight-only quantization is close to lossless for extraction, and the recovery is worse at
the small end — which is our end.** Kurtic, Marques, Pandit, Kurtz & Alistarh, *"Give Me BF16 or Give
Me Death"? Accuracy-Performance Trade-Offs in LLM Quantization* (arXiv:2411.02355,
<https://arxiv.org/abs/2411.02355>), runs over 500,000 evaluations across the Llama-3.1 family.
**Verified** against the full HTML (<https://arxiv.org/html/2411.02355v4>): on Open LLM Leaderboard
v1, *"8-bit quantization achieves 99.75% recovery, while W4A16-INT reaches a competitive 99.36%"*; on
the harder Leaderboard v2 the W4A16-INT recovery is **96.1% at 8B, 97.4% at 70B and 98.9% at 405B**;
on real-world tasks (Arena-Hard, HumanEval, RULER) it is **98.9%**.

> **Correction to the figure this pass was given.** The recovery was reported to me as
> **99.4–99.98%**. That range is the *best* benchmark suite only. The honest range is **96.1% to
> 99.4% depending on suite and model size**, and the material detail for this repo is the direction
> of the size effect: **recovery degrades as the model gets smaller**, and 27–32B is nearer the 8B
> end of that curve than the 405B end. Four-bit remains the right call at the floor. It is not free,
> and the published margin is thinner at our size than the quoted range implied.

**But do not build an abstention threshold on a quantized model's confidence.** Proskurina, Brun,
Metzler & Velcin, *When Quantization Affects Confidence of Large Language Models?*, NAACL 2024
Findings (arXiv:2405.00632, <https://arxiv.org/abs/2405.00632>), finds that GPTQ to 4-bit *"results
in a decrease in confidence regarding true labels"* and concludes that **quantization
"disproportionately affects samples where the full model exhibited low confidence levels in the first
place."* **Verified** from the abstract, quoted verbatim. Put the two quantization results together
and they say something sharper than either alone: **4-bit is fine for the extraction decision and
wrong to calibrate a suppression threshold on**, because the samples it degrades are exactly the
uncertain ones a brake would be reading. Given invariant 4, that is a constraint on how `confidence`
may be *computed*, not merely on what it means.

**Refused: the ConfBench confidence figures, which invert the paper's own finding.** This pass was
given, sourced to arXiv:2608.01792, the claim that at 27B *"verbalized confidence beat first-token
logprob 0.72 vs 0.62 AUROC"*, with ECE 0.22 and 1.93× the errors of random surfaced at a 30% review
budget. The paper at that identifier is Roy, Martin, Rostami et al., *Can You Trust the Confidence?
ConfBench for Vision-Language Models on Document Extraction* (<https://arxiv.org/abs/2608.01792>), and
it is a **vision-language** benchmark over 1,346 document variants and seven VLMs. Its abstract
reports the opposite of the claim on the exact comparison cited: **log-probability with first-token
aggregation *outperforms* other approaches.** No 27B model is named in the abstract, and none of the
0.72 / 0.62 / 0.22 / 1.93× figures appear there. **Refused in full.** The paper may still be worth
reading for the ECARB routing metric, and the underlying question — whether a local model's
verbalised confidence is worth more than its logprobs — remains open and untested here. It is not
answered by this citation, and the direction it was reported in is the direction the paper argues
against. **2026 preprint, unreviewed.**

**Refused: the Agents-K1 NER figures.** Reported to this pass as second-hand only, and they do not
survive even that. arXiv:2606.13669 is Cao, Zhan, Shi et al., *Agents-K1: Towards Agent-native
Knowledge Orchestration* (<https://arxiv.org/abs/2606.13669>), an end-to-end pipeline turning 2.46
million academic papers into scientific knowledge graphs. Its abstract does not evaluate Qwen3-32B
and reports no NER figures. Whatever the numbers were, this is not their source.

**Three gaps, recorded as gaps because that is the useful thing to do with them.**

- **Nobody has measured a 27–32B model at 4-bit on causal extraction.** The nearest is
  arXiv:2601.15479 at full precision on biomedical and multi-domain text, at 47.12.
- **Nobody has measured quantization's effect on extraction precision specifically.**
  arXiv:2411.02355 measures accuracy recovery on leaderboard suites; arXiv:2405.00632 measures
  confidence on classification. Neither measures whether a 4-bit model asserts more relations than
  its 16-bit self, which is the question a precision-charging design actually needs answered.
- **Nothing measures spoken, from-memory learner explanation.** This is the verdict at the top of the
  file, and the six sections added on 2026-08-10 did not dent it.

**The verdict is strengthened, not replaced.** Before this pass, "no published figure covers the
genre this project needs" rested mainly on the absence of a *speech* corpus. It now rests on that
plus three more independent gaps at the configuration this repo actually committed to, plus a
literature in section 6 that measures something much nearer the product and reports false-alarm rates
between 27% and 34% on correct work. The conclusion is the same and the ground under it is broader:
**run the count.**

## What is verified and what is not

| Figure | Status |
|---|---|
| PubMedCausal: corpus, genre, 6,491 pairs, Cosine Pair F1 0.6765, 0.9743/0.0500, 202 inter-sentential, 0.75 threshold, *"causality"* keyword filter, 0.8803/0.3920 explicit/implicit | **Verified**, arXiv abstract + full HTML |
| EventStoryLine 258 docs, 1,751 intra / 3,727 inter | **Verified**, arXiv:2405.20608 |
| EventStoryLine 1,770 / 3,885 | Second-hand; same ratio |
| EventStoryLine supervised intra/inter F1 table | Verified *as printed* in arXiv:2506.05675; second-hand to the originating papers; reproductions vary by ~5 F1 |
| GPT-4 11.5 F1 on Causal-TimeBank, and the whole zero-shot table | **Verified at the primary source**, Gao et al. arXiv:2305.07375 Table 1 — *re-sourced 2026-08-10*, previously cited to the reproduction |
| The API-call window 1 March – 28 April 2023 | **Verified**, quoted from arXiv:2305.07375 |
| The one-line zero-shot prompt | **Verified** as the paper's zero-shot condition |
| 1,000-instance random sample per corpus | **Verified**, quoted from arXiv:2305.07375 |
| 39 / 188 positives; 623 / 654 yes answers; 62.3% / 65.4% yes-rate; 3.9% / 18.8% base rates | **Reconstructed arithmetic** from verified P/R, exact to the integer. A researcher's check against the authors' released evaluation files is **second-hand** |
| Always-yes F1 7.5 (CTB) and 31.7 (ESL) | **Derived here**, 2p/(1+p). The 8.0 / 37.0 reported to this pass could not be reproduced — see the discrepancy note in section 3 |
| The old "intra-sentence" labels on the zero-shot rows, and the GPT-4 ESL inter row 16.9 / 64.7 / 26.8 | **Not in the primary table.** Came in through the reproduction; removed |
| GPT-3.5 Causal-TimeBank precision | Primary prints **6.9**; the reproduction printed 7.0 |
| EventStoryLine: 2,265 hand-annotated relations, rest extended by coreference | **Second-hand**, search summary + corpus site |
| EventStoryLine 117 explicit causal markers; 5,519 total links | **Not found.** Matches neither count in section 2. Do not cite |
| Bidirectional consistency ≈ triples F1; gpt-4o-mini 34.4, DeepSeek-Chat 40.6 | **Not found.** No URL supplied, paper not located. Do not cite |
| Causal-TimeBank 184 docs / 318 causal relations | Verified, survey table arXiv:2411.10371 |
| Falsely-identified problems 27%; fabricated issues 34% | **Verified**, quoted from arXiv:2501.10365 full HTML |
| Feedback-accuracy human ratings | **0.56–0.78** verified (Table 2). The 0.58–0.67 reported to this pass is **corrected** |
| *Confirming Correct*: seven agents, 10,836 pairs, over-rejects valid alternatives | **Verified** from the abstract, arXiv:2605.16207. 2026 preprint, unreviewed |
| 516 proof states; 94–99% / 0–76% F1; LLaMA-3.3-70B 91% rejection | **Second-hand**, not in the abstract, full text not opened |
| Mid-range degradation in short-answer scoring; human–human agreement stable | **Verified** from the abstract, arXiv:2605.07647. 2026 preprint, unreviewed |
| Category distances 0.5–0.8 / 0.6–0.9 / 2.2–3.5 vs human 0.12–0.43 | **Second-hand**, not in the abstract |
| Step-level prompting costs accuracy on clean traces | **Verified**, quoted from arXiv:2311.08516 §3.2. Paper title is *LLMs cannot find reasoning errors…*; BIG-Bench Mistake is its dataset |
| RAG short-answer grading: 73.6% unseen answers / 22.3% unseen questions / 20% random baseline | **REFUSED.** arXiv:2408.03811's own tables give 74.8–78.7% and 73.1–76.9%; no 22.3%, no random baseline, no collapse |
| Qwen2.5-Coder-32B-Instruct best extractor of 13 open models at 47.12 | **Verified** from the abstract, arXiv:2601.15479. **Metric ambiguous** — do not write "F1". 2026 preprint |
| 35.7% missed relations / 0.31% false positives; beat both 70B models | **Second-hand**, not in the abstract. Worth confirming — it would invert section 3's failure mode |
| Task shape worth ~5×: 0.47–0.58 with arguments given vs 0.09–0.12 without | **REFUSED as a synthesis.** arXiv:2602.17475 is a ~1B-parameter Italian medical NLP paper and supports no 27–32B figure. One paper is not two |
| Fine-tuned Qwen3-1.7B beats Qwen3-32B by +9.2 avg on 20 Italian clinical tasks | **Verified** from the abstract, arXiv:2602.17475 |
| GPT-4o and Qwen 2.5 best abstainers; no scale effect; reasoning tuning −24% | **Verified**, quoted from arXiv:2506.09038 full HTML. The 32B-Instruct variant specifically is a reading of the model list, not of the quoted sentence |
| ANCHOR-RE micro-F1 0.654→0.676 / 0.769→0.872 / 0.939→0.941; 69% post-cutoff precision | **Verified** from the abstract, arXiv:2608.03154. 2026 preprint, unreviewed |
| ANCHOR-RE micro-precision 0.534→0.576, recall 0.844→0.816; Qwen3-32B as a backbone | **Second-hand**, not in the abstract |
| W4A16-INT recovery 99.36% (Leaderboard v1), 96.1 / 97.4 / 98.9% (v2 by size), 98.9% real-world | **Verified**, quoted from arXiv:2411.02355 full HTML. The 99.4–99.98% reported to this pass is **corrected** — it is the best suite only |
| Quantization disproportionately hits low-confidence samples | **Verified**, quoted verbatim from arXiv:2405.00632 abstract |
| ConfBench: verbalized confidence 0.72 AUROC beats first-token logprob 0.62 at 27B; ECE 0.22; 1.93× at 30% budget | **REFUSED.** arXiv:2608.01792 is a vision-language document benchmark whose abstract reports first-token logprob aggregation *outperforming* the alternatives — the cited comparison runs the other way. No 27B in the abstract |
| Quantization AUROC 98%→93%, ECE 15pp→26pp | **REFUSED.** Unattributable to any opened source; magnitudes an order larger than the paper it appeared to describe |
| Agents-K1 Qwen3-32B NER figures | **REFUSED.** arXiv:2606.13669 is a knowledge-orchestration pipeline paper; its abstract evaluates no such thing |
| IMoJIE CaRB optimal F1 53.5, 2020, BERT seq2seq | **Verified**, ar5iv full text |
| RECCON 22.2 / 31.3-point domain-shift drop; DailyDialog is human-written | **Verified**, ar5iv full text + DailyDialog abstract |
| Disfluency recall 0.71 → 0.26 under ASR | Quote **verified**; the paper's own table disagrees on the metric. See the caveat in the verdict |
| 28–34% explicit-connective share | **Unverified.** Contradicted by PubMedCausal's 63.1% |
| ~0.30 at 8B; LLaMA-2-13B 36.2/25.7; GPT-3.5 39.1/25.9 | Second-hand, not retrieved |
| 95% precision at 9% recall | **Not found** |

## Still open

- **The explicit-connective share**, if anyone still wants a number for it. Start with Taboada, and
  expect it to be reported for coherence relations rather than causal ones specifically.
- **Which metric 0.26 names** in arXiv:2311.00867. One look at the PDF settles it.
- **The 32B error breakdown in arXiv:2601.15479** — 35.7% missed relations against 0.31% false
  positives. This is the highest-value unopened PDF on the page. If it holds, the 32B failure mode
  under supplied candidates is *silence*, not over-assertion, which would move the yes-bias from the
  judgement step to the detection step and change what Extract's prompt has to defend against. The
  same PDF settles whether 47.12 is F1 or accuracy.
- **Whether the bidirectional consistency result exists at all.** Reported as roughly tripling F1 on
  Causal-TimeBank, with no citation, and not located. Cheap to test directly against a local model
  rather than to keep searching for.
- **Whether a local model's verbalised confidence beats its logprobs.** The citation offered for this
  was refused, and the question is untouched. It bears directly on invariant 4 and on how a
  suppression threshold could be computed at 4-bit, given arXiv:2405.00632.
- **The full text of arXiv:2605.16207**, for the alternative-solution rejection rates. Its abstract's
  direction — confirms the optimal path, over-rejects valid alternatives — is the finding on this
  page most likely to describe what HoldTrue will actually do wrong.
- **Nothing here needs re-deriving to start the falsification week.** The week's own two extra
  columns replace every statistic on this page with the only distribution that applies to the
  genre, so the correct response to a gap in this file is usually to run the count, not to search
  again. **The 2026-08-10 pass is evidence for that rule rather than against it**: it opened
  fourteen sources, refused four figures, corrected three more, and moved the verdict not at all.
