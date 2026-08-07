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
> result, or by a search summary), or **not found**.

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
number to substitute for the count, so the count has to be run.

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

## 3. Zero-shot LLM extraction is far worse than any of the above

Same source, same table (arXiv:2506.05675). Zero-shot, existence identification:

| Model | Corpus / setting | P | R | F1 |
|---|---|---|---|---|
| GPT-4 | Causal-TimeBank, intra-sentence | 6.1 | 97.4 | **11.5** |
| GPT-3.5 | Causal-TimeBank, intra-sentence | 7.0 | 82.6 | 12.8 |
| text-davinci-003 | Causal-TimeBank, intra-sentence | 8.5 | 64.4 | 15.0 |
| GPT-4 | EventStoryLine, intra-sentence | 27.2 | 94.7 | 42.2 |
| GPT-4 | EventStoryLine, inter-sentence | 16.9 | 64.7 | 26.8 |

**GPT-4 scores 11.5 F1 intra-sentence on Causal-TimeBank** — six points *below* the worst supervised
inter-sentential number in section 2, and on the easy side of the split. The shape of the failure is
the part worth keeping: 97.4 recall against 6.1 precision. The model says yes to almost everything.
That is the failure mode Law 2 is built to survive, and it is measured, not hypothesised.

Sample size context: Causal-TimeBank is **184 documents, 7,608 annotated relations, of which only
318 are causal**, per the survey table in arXiv:2411.10371 (<https://arxiv.org/html/2411.10371v5>);
experiments use a 10% test split. These F1 values rest on a small number of positive items.
EventStoryLine is 258 documents, 22 topics, 5,334 event mentions.

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

## What is verified and what is not

| Figure | Status |
|---|---|
| PubMedCausal: corpus, genre, 6,491 pairs, Cosine Pair F1 0.6765, 0.9743/0.0500, 202 inter-sentential, 0.75 threshold, *"causality"* keyword filter, 0.8803/0.3920 explicit/implicit | **Verified**, arXiv abstract + full HTML |
| EventStoryLine 258 docs, 1,751 intra / 3,727 inter | **Verified**, arXiv:2405.20608 |
| EventStoryLine 1,770 / 3,885 | Second-hand; same ratio |
| EventStoryLine supervised intra/inter F1 table | Verified *as printed* in arXiv:2506.05675; second-hand to the originating papers; reproductions vary by ~5 F1 |
| GPT-4 11.5 F1 intra-sentence Causal-TimeBank, and the rest of the zero-shot table | Verified as printed in arXiv:2506.05675 |
| Causal-TimeBank 184 docs / 318 causal relations | Verified, survey table arXiv:2411.10371 |
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
- **Nothing here needs re-deriving to start the falsification week.** The week's own two extra
  columns replace every statistic on this page with the only distribution that applies to the
  genre, so the correct response to a gap in this file is usually to run the count, not to search
  again.
