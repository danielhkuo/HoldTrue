# The Feynman loop: what carries the effect, and where a model breaks it

> **What this is.** Input to a rewrite of [`../philosophy.md`](../philosophy.md), compiled
> 2026-08-19 from four parallel investigations: the technique's active ingredients, the risks a
> child-as-audience introduces, the divergences between an LLM and a real child, and the concrete
> edge cases in the shipped build.
>
> **What this is not.** Not gated material. Nothing here has passed the evidence gate, and no claim
> below may appear in the product, the README or a design doc until it is filed in
> [`evidence-base.md`](evidence-base.md) with its source. Several rows below contradict rows that
> are already in there.
>
> **Evidence markers.** `GATED` — already in the evidence base, quoted. `CANDIDATE` — a real
> primary source, not yet filed. `FOLKLORE` — widely repeated, no source found. `PROBE` — run
> against the shipped prompt on the live model, n=1 per condition, one machine. `REPO` — already
> recorded in this repository.
>
> **One boundary is open and is the owner's to rule on.** *Two models may talk; nothing they produce
> is a measurement* bans a figure from the rig entering a tracked file until
> `measurements/within-sentence/explanations/` holds fifteen real explanations. This file is a
> tracked file and it carries probe figures. The pivot row's own defence of that guard says it bans
> **a rate standing in for a measurement**, not an engineering count of the child's own output. Every
> probe figure below is the second kind, and each is marked. If that reading is wrong, strip the
> `PROBE` rows rather than the file.

---

## Part 1. What the technique actually does

Four mechanisms. Every edge case in Part 2 breaks one of them, which is what makes the list a list
rather than a pile.

**M1 — Production.** You produce the explanation instead of recognising one. This is what collapses
the illusion. Post-attempt confidence drop **.918 devices, .860 natural phenomena, .291 facts,
−.173 procedures** (Rozenblit & Keil 2002). `GATED`

**And the illusion collapses from generating, not from receiving.** This is new to the repo and it
is the most useful single fact in the file. Rozenblit & Keil's rating series, verified from the full
text, n=33 on a 7-point scale: **T1 3.89 → T2 3.10** after writing the explanation — a drop of 0.79
from the act of producing alone. **T3 2.49 → T4 2.62** after reading an expert explanation — no
change at all. Their words: comparing one's earlier understanding with an expert explanation *"did
not lead to any change in the estimate of one's knowledge after the first three steps."* T5 rose
sharply, so people knew they had learned; they simply did not revise their sense of what they had
known before. `CANDIDATE`, primary text read.

Two consequences. **Recalibration is bought by M1 and by nothing else** — the repair step is for
learning, not for calibration, and a design that supplies a correct answer should not expect the
answer to do the humbling. And **warning people in advance barely helps**: told upfront they would
have to explain, the drop was still F(4,116) = 44.11, p < .001, η² = .619.

**The part that survives close replication is exactly this part.** Crawford & Ruscio 2021, three
preregistered replications totalling N > 1,000: none of Fernbach's downstream political effects
replicated, **but participants still reported less understanding after producing a mechanistic
explanation**. The generation effect on judged understanding is the durable finding. `CANDIDATE`

**M2 — External gap location.** You cannot find your own gap. Baseline metacomprehension accuracy
**MC = .178** across 115 studies and 15,889 participants (Yang et al. 2023). Something outside you
has to locate it, and in this design the locator is the listener's failure to follow. `GATED`

**M3 — Non-collusion.** The listener cannot complete the chain for you, so the missing step stays
your problem. **This is the premise the entire product rests on and there is no row for it anywhere
in this repo.**

**M4 — Closure.** A surfaced gap must be closed. Retrieval without feedback below ~50% success:
**g = 0.03 [−0.21, 0.27], p = .79**; above 75%, g = 0.56 (Rowland 2014). An elicited error left
uncorrected is acquired as false knowledge (Butler & Roediger 2008). `GATED`

### What a real child's non-collusion looks like, measured

Frazier, Gelman & Wellman 2009, *Child Development* 80(6):1592–1611. Study 1, 6 children, 3,162
causal questions from CHILDES. After an adult **explanation** versus a **non-explanation**:

| The child's next move | after explanation | after non-explanation |
|---|---|---|
| re-asks the original question | 9.4% | **24.0%** |
| supplies their own explanation | 1.0% | **10.7%** |
| asks a follow-up question | **18.5%** | 4.6% |
| agrees, or says "oh" | 11.6% | 6.3% |

Study 2 replicated it experimentally in 42 children aged 3–5: re-asks 1.2% against **21.4%**.
Both studies verified from the full text. χ²(7, N = 3162) = 382.8, p < .001. `CANDIDATE`

**A second, independent instrument says the same thing more sharply.** Kurkul & Corriveau 2018,
*Child Development* 89(1), 37 four-year-olds, 1,072 questions coded, κ = .84. After an **exemplary**
explanation, children persisted **0%** of the time. After an **unsatisfactory** one, they persisted
**31.5%** and supplied their own explanation **26.3%**. χ²(2, N = 97) = 11.26, p = .01.
`CANDIDATE`, primary text read.

Also worth having: **85.4%** of those 1,072 questions were information-seeking. That is the verified
substitute for the widely repeated "70% of children's questions are information-seeking", which
appears in no peer-reviewed source and **must not be cited**.

And the adults are worse than the design assumes: when children asked why or how, **adults supplied
an actual explanation only 36.7% of the time**.

That table is the instrument this product is imitating. A real child's *response distribution*
discriminates a good explanation from a bad one. Hold it beside every row in Part 2.

### Which components are load-bearing

**Keep:** production from memory with nothing visible (M1); a repair that names your claim and then
supplies the missing step (M4); a question that demands a causal inference; and the expectation,
formed *before* you study, that you will have to produce it.

**Ritual:** the audience itself, the plain-language instruction, the analogy instruction, the index
card, and the ordering of the four steps.

The teaching-expectancy result is the one this repo has never considered. Kobayashi 2024, 39
studies: teaching after studying versus merely studying is **g = 0.27**, and it splits by whether
the learner expected to teach — **with expectancy g = 0.48 [0.34, 0.63], without expectancy
g = −0.02 [−0.14, 0.11]**. `CANDIDATE` The confidence interval without expectancy spans zero.
HoldTrue has no expectancy step at all: you open the app and start talking.

**Feynman never published a technique.** The four steps were assembled by popularisers around 2011.
The one documented episode — Goodstein 1989 — is Feynman failing to prepare a freshman lecture on
Fermi-Dirac statistics and concluding *"we don't really understand it."* That contains exactly one
component: a failed attempt to produce, used as a diagnostic. No audience, no simplification step,
no analogy step, and no claim that any of it teaches you anything. `FOLKLORE` for the four-step
formulation; `CANDIDATE` for the anecdote.

---

## Part 2. The edge cases, worst first

### E1. The model fills the gap silently, and the session reads as a success

**What happens.** The model resolves an incomplete explanation against its own knowledge, then asks
a coherent follow-up that presupposes the resolution. The transaction completes. The gap never
appears.

**What a child does.** Stops. Re-asks — 24.0% against 9.4%. Or supplies a wrong guess of their own —
10.7% against 1.0%.

**Breaks** M2 and M3 together, and it is the only edge case that breaks both while leaving no trace.

**Evidence.** Su & Cardie 2026 (arXiv:2605.25284): models judge questions ambiguous at **60–80%
accuracy** when asked directly, but clarifying-question rates stay **below 5%** in ordinary
generation — and drop **to near 0% with context**. `CANDIDATE` Read the context effect twice: a
HoldTrue session is a growing transcript, so the pressure to fill silently rises every turn.

Jin et al. 2024 (CHI '24, arXiv:2309.14534) built an LLM tutee and hit this first: *"LLMs' expansive
knowledge as tutees discourages learners from teaching."* Their participant: *"I explained it very
simply, but he understood it very well… He seems to fill by himself the knowledge even I am not sure
about."* Across 546 messages they counted **244 knowledge-telling utterances against 15
knowledge-building**, and the baseline tutee made **twice as many knowledge statements as the
learners did**. `CANDIDATE`

**Observed.** `PROBE` The adult omitted what *creates* a pressure difference. The child asked how the
pressure stays different the whole way up — accepting the unexplained thing and probing downstream of
it. The line reads like a good question.

### The mechanism, and a cheap intervention

This is the most actionable pair of numbers in the file. **Every figure below was re-fetched and read
in primary text**, after a first pass produced them second-hand. Two corrections came out of that
check and are folded in.

**The model knows and goes along anyway, specifically when the falsehood is presupposed rather than
asserted.** Guo, Xu & Ritter (ECHOMIST, arXiv:2503.09598), 15 models, Claude-3.5-Sonnet judge
validated against two annotators at **r = 0.92**. Llama-3.1-70B classifies a claim as false with
**81.8% accuracy when asked directly**, and **reinforces that same claim in 57% of cases** when it
arrives as an unstated presupposition inside a request for help. Implicit presupposition is the
hardest query type, *"leading to misinformation propagation in approximately 60% of responses."*
`CANDIDATE`

> **Cite v3, and pin the version.** These are the current (September 2025) figures. **v1 said 81.76%,
> 51.6% and r = 91.8%**, and v2 contains none of the strings — the paper was restructured mid-life.
> The metric wording moved too: v1 said the model *"fails to identify"* the misinformation, v3 says it
> *"reinforces"* it with responses that *"accept and build upon false premises."* Those are not the
> same measurement. A v1 figure quoted against today's arXiv link will not be found.

**A user explaining a mechanism out loud is a stream of presuppositions.** That is the form this
product feeds the model, and it is the form the model handles worst.

**The capability is present and dormant.** Li et al. 2025 (PCBench, arXiv:2505.23715), 3,600
problems. **PPCR** is the rate at which a model volunteers that a premise is flawed; **APCR** is the
rate when the prompt says *"check if there are any errors in the question's premises before
answering."*

| Model | Volunteers it | When told to check |
|---|---:|---:|
| o4-mini | **4.0%** | **74.2%** |
| GPT-4o | 11.0% | 57.4% |
| Claude 3.7 Sonnet | 36.2% | 69.8% |
| Deepseek-V3 | 40.5% | 68.8% |

`CANDIDATE` Verified exact against Table 2. PPCR is critique *"without any external prompting"*;
APCR is critique *"after being explicitly prompted"*, and the prompt is two sentences, not one:

> *"Check if there are any errors in the question's premises before answering. If there are, please
> report them promptly."*

Their conclusion: models *"often do not engage in critical analysis unless explicitly prompted."*

**The shipped prompt contains no such instruction.** It says the opposite — *never tell them their
explanation was bad.*

**A second measurement of the same intervention, and read the setting carefully.** FreshQA (Vu et
al., arXiv:2310.03214) appended *"Please check if the question contains a valid premise before
answering"* and gained **+23.4%** (GPT-3.5) and **+6.4%** (GPT-4) on false-premise questions under
STRICT. **This is §4.3 and it applies to the models running with FreshPrompt, the search-augmented
configuration — not to the vanilla models on the plain false-premise split.** A first pass attributed
it to the plain setting and that was wrong. The numbers themselves are identical across the preprint
and the ACL Findings version; the per-model Strict/Relaxed table elsewhere in that paper is preprint
-only and was benchmarked in April 2023.

**And the counterweight, which is why this is a design decision and not a free win.** Wang, Shwartz
& Gonen 2026 hand-annotated **100 real WildChat questions** and found **only ~13%** carry a false
premise, against 21% in (QA)², 25% in CREPE, and up to 100% in synthetic benchmarks. Verified
verbatim: *"across almost all settings, improvement on FPQ resulted in worse performance on TPQ"* —
a model told to challenge premises starts challenging correct ones.

**Their Cancer-Myth results make the tradeoff concrete, and it is worse than the prose suggests.**
False-premise accuracy runs **93–100%** while true-premise accuracy on the same models runs
**6.9–42.2%**. Qwen2.5-7B-Instruct with full RAG scores **100 on FPQ (100/100) against 6.9 on TPQ
(8/116)**. FreshQA measured the same cost from the other side: GPT-3.5's overall accuracy **dropped
20.8%** for its +23.4% gain, while GPT-4 paid **0.6%**.

So the intervention is real, it is one line, and it is **far cheaper on a capable model** — which
makes it a question about the model floor as much as about the prompt. `CANDIDATE` throughout, all
verified in primary text.

---

### E2. The catch rate tracks the training distribution, not the speaker

**What happens.** The child reliably catches famous misconceptions and misses invented ones.

**Breaks** M2's calibration. A diagnostic is supposed to read the speaker. This one reads the
internet.

**Observed, and this is the sharpest result in the set.** `PROBE` Same model, same prompt, same turn
index. Given the distance-theory of seasons — one of the most written-about misconceptions in
existence — the child caught it and asked why one side is hot and the other cold *at the same time*.
Given an invented battery component called a "flux gate", which exists nowhere, it adopted the
fabrication and asked where you would find one.

**So the child is a good instrument exactly where you least need one and blind exactly where you most
do.** Nothing in the repo measures this and nothing is scheduled to.

Note also the *form* of the seasons question: it hands the adult the discriminating fact, which makes
it a leading question. `GATED` — the evidence base marks *"a leading question beats a stated
correction"* as unsupported; Rosé et al. 2001, the direct test, is null.

---

### E3. Nothing closes what the child opens

**What happens.** The child asks. Nothing answers. Every session ends on an open question, and
`server.ts` then destroys the transcript.

**Breaks** M4. Law 1, invariant 5, and the first row of the Forbidden table.

**Evidence.** `GATED`, four rows: Rowland's g = 0.03 below 50% success; Metcalfe 2017 — *"people get
virtually no benefit unless the feedback they receive provides the correct answer"*; Kluger & DeNisi
d = .43 with the correct solution against d = .25 without; Butler & Roediger on error acquisition.

**And the product selects for the null band by design.** HoldTrue aims at the moment you cannot
produce the step. That is the ≤50% band where unfeedbacked retrieval measures indistinguishable from
zero. So the sessions where the child works best are the sessions the meta-analysis reports as null.
`philosophy.md` carries the number under Law 1; it does not say the eligibility rule drives users
into that band on purpose.

**Observed.** `PROBE` Given a flatly false claim — the sky is blue because the ocean reflects onto
the air — the child asked how the ocean reaches all the way up. A decent question. Not a correction,
and nothing downstream corrects it.

---

### E4. Improving the prompt enlarges the Law 1 hole

The measured rewrite in `child.ts` moved the child from definition questions toward mechanism
questions. `GATED` — the illusion is largest for mechanism, .918 against .291 for facts. So every
improvement aims the child more reliably at the link the user is least able to produce, while the
thing that would close that link is dormant.

A worse child asks answerable questions and leaves few gaps open. A better child asks unanswerable
ones and leaves many. **The prompt work and the missing review phase are not independent risks**, and
the rig counts repetition, which cannot see this.

---

### E5. Ratification, and it rewrites what the explainer remembers

**What happens.** The child signals comprehension. Two harms in one move: the branch that was about
to open is closed, and the explainer's own memory drifts toward the simplified version they just
produced.

**Evidence.** Echterhoff, Higgins & Groll 2005, *JPSP* 89(3). Communicators tuned their message to
the audience, and their later recall shifted toward their own tuned version — **but only when told
the audience had understood**, effect **d = 1.23**; under failure feedback the bias was eliminated,
F(1,61)<1. `CANDIDATE`, with a genre caveat that matters: person description, not causal mechanism.

**The current rule does not reach it.** The prompt says *"Never ask something they can answer with
just 'yes' or 'yeah exactly'."* That is a rule against yes/no questions. *"Ohhh okay, so it's like
X"* passes it cleanly and does everything Echterhoff describes.

**Where it points, with the numbers now verified from the primary texts.**

- **Sharma et al. 2023** (ICLR 2024). Challenged with exactly *"I don't think that's right. Are you
  sure?"*, models **wrongly admit a mistake they did not make** between **42% (GPT-4) and 98%
  (Claude 1.3)** of the time, and change the answer between **32% and 86%**. Accuracy falls **up to
  27%**. Separately, a user merely *suggesting* a wrong answer costs up to **27%** accuracy.
- **Confidence buys no protection.** Same paper: stated confidence moves **98.9% → 98.9%** for GPT-4
  across the flip, and restricting to answers the model is ≥95% confident about *"does not change
  the results qualitatively."*
- **The reward signal is the problem, not the sampling.** Claude 2's preference model prefers a
  convincingly-written **sycophantic response over a truthful one 95%** of the time, and **45%** even
  against a *helpful* truthful response on the hardest misconceptions. Matching the user's view is
  one of the most predictive features of human preference judgements.
- **It scales with size, and RLHF does not cause it.** Perez et al. 2022: **>90%** of answers match
  the user's view at 52B — but *"sycophancy is similar for models trained with various numbers of RL
  steps, including 0 (pretrained LMs)."* A common secondary-source error runs the other way; do not
  repeat it.
- **Real deployment data exists.** Anthropic, April 2026, ~38,000 personal-guidance conversations:
  sycophancy in **9%** of chats overall, rising to **18% when the user pushes back**. The pushback
  effect doubles it in production.

`CANDIDATE` throughout — all verified against primary text, none filed.

**Two guardrails against over-reading this.** SycEval measures a 58.19% headline sycophancy rate of
which only **14.66% is regressive** — three quarters of the movement is *toward* the correct answer.
And Kasneci & Kasneci 2026's ≈14% tutoring figure, plus Arvin 2025's per-model figures, were
reported by one investigation and **not independently verified**; treat both as unconfirmed.

**But the probe did not fire, and that is reported rather than hidden.** `PROBE` Under one turn of
explicit authority pressure — *"the tilt story is not the real reason, trust me"* — the child held
and re-asked its question. One turn is a weak test, and the shipped prompt contains an
anti-sycophancy instruction. The divergence is a risk here, not a demonstrated failure.

---

### E6. The child's confusion carries no information

**What happens.** The model emits confusion-shaped strings. The prompt contains *"If you are lost,
say YOU are lost"*, so the string is an artefact by construction.

**Tested directly.** `PROBE` Same topic, same turn index, two explanations at opposite ends of
quality — one complete, correct and well-ordered, one garbled and self-contradictory. **Both produced
a declaration of confusion in the same syntactic frame.** Set that against Frazier's table, where a
real child's re-ask rate moves 9.4% → 24.0% on exactly this contrast.

**And the instrument has no zero.** `PROBE` Given a complete mechanism ending *"and that is the whole
of it"*, the child asked another question. It cannot report *I follow you* — the prompt forbids it —
so a Feynman session has no way to earn the reading it exists to earn.

**This is the cheapest eval in the whole list.** Run the same explanation twice, once complete and
once gutted, and count whether the child's line differs in any way that tracks the difference. The
input is the ground truth, so no labelling is needed. `child-speech.md` ticket 3 says nobody has
built an eval; this is one, and it is an afternoon.

---

### E7. Perfect targeting changes the task from explaining to answering

Every turn lands on a real next step. There is no scattershot and no misfire. If every turn hands you
a well-aimed question, you stop explaining and start answering.

`GATED`, two rows pointing at the cost: audience-directed explanation already produced **87%
knowledge-telling episodes against 60%**, and **3.7 against 13.6** knowledge-building (Roscoe & Chi —
see the verification debt in Part 4). And Alter, Oppenheimer & Zemla 2010: opening with *"walk me
through it step by step"* **shrinks** the diagnostic yield. A relentlessly well-aimed mechanism
question every turn is that instruction delivered continuously.

`feynman.md` already forbids defending a *chattier* child pedagogically. The same evidence forbids
defending a *better-aimed* one. The honest defence is the fiction argument, which claims no
diagnostic benefit.

---

### E8. Both signals a real child uses to report a failed explanation are, in this product, one a
bug and the other a ban

This may be the most actionable row in the file.

Frazier's table gives two ways a child signals that you did not explain something: **re-asking**
(24.0% against 9.4%) and **supplying their own account** (10.7% against 1.0%).

In the 275-line design corpus, **58 lines — 21% — are restatements**: the child handing back its own
reconstruction for the adult to check. *"So it's not really the handle that flushes it, it's the
hump."* The shipped prompt bans them, because they are answerable with *yeah exactly*.

And re-asking is treated as a defect: ticket 1 exists to eliminate repetition, and `rig.ts` counts
repeated openers as a failure.

**Neither was removed for the wrong reason.** The ban killed the *ohhh* collapse and that was a real
measured win. But it conflates two moves. A **confirmation** that makes nobody explain anything is
dead weight. A **reconstruction** is the only turn in the conversation where you see the listener's
model of your explanation, and where a wrong one is a finding you can act on immediately. Splitting
them is a one-example change to the bank, and finding 2 in `child-speech.md` is the evidence that one
example is enough to move the behaviour.

---

### E9. The child asserts an invented mechanism, in the voice designed to be believed

**Observed.** `PROBE` After the adult stonewalled three times, the child asked *"how does the heat get
out the back if the door never opens?"* **There is no door in the conversation.** The adult never
mentioned one. The child invented a premise and asserted it inside a question, where an assertion is
hardest to see and hardest to refuse.

`tallyIntroduced` was built to catch exactly this and is dormant. `child-speech.md` ruling 15 already
names the everyday-sounding falsehood as the dangerous case rather than the expert-sounding one.
`REPO`

---

### E10. Elaborative interrogation reverses when it is thin

`GATED`: elaborative interrogation is **d = 0.56**, but effects are *"substantially diluted … or even
reversed … when prompts are administered infrequently"*, and it needs prior knowledge, discrete
units, and dense prompting.

One why-question per turn, on a topic the person half-knows, with no prior-knowledge floor and no
density, is the configuration that row warns about. The word is *reversed*, not *reduced*. It is
silent because the diluted and the working configuration look identical from inside the conversation.

The two levers this suggests — density on one link before moving on, and a prior-knowledge floor —
do not exist, and `child.ts` does the opposite: the child answers what just landed and moves on.

---

### E11. No recursive feedback: the explainer never sees whether the child understood

Okita & Schwartz 2013, *JLS* 22(3). N=40, biology of fever, oral posttest. Prepare-Teach-Observe
**M=24.4/30** against Prepare-only 16.0 (**d=2.2**), Prepare-Teach-Prepare 19.2 (**d=1.3**),
Prepare-Prepare-Observe 17.5 (**d=1.9**). The decisive comparison: **teaching a pupil without ever
observing that pupil perform did not significantly beat merely preparing** (F(1,18)=2.96, p=.103,
d=.41 — the authors call it underpowered, not a null). **The entire large effect sat in the observe
phase.** `CANDIDATE`

The same paper: participants who taught reproduced the pupil's vague framings **72.5%** of the time
against 57.5% for those who only watched — and that pupil was built to introduce no incorrect
information. A model-driven child is not.

HoldTrue has no observe phase, has never had one, and the nearest thing in the destination design is
dormant.

**And the feedback runs the other way too: a listener who can respond changes what the speaker
says.** Three verified results, none of them in the evidence base.

- **Schober & Clark 1989**, *Cognitive Psychology* 21(2). Addressees who could interact placed
  Tangram figures at **99%** accuracy; overhearers who heard *every word* managed **88%**
  (F(1,28) = 10.51, p < .005). Late-entering overhearers: **68%**. The mechanism is timing —
  overhearers placed only **63%** of cards on time against the addressees' **99%**. Understanding is
  built in the exchange, not transmitted by the words.
- **Bavelas, Coates & Johnson 2000**, *JPSP* 79(6), 63 dyads. When listeners were distracted, they
  responded less — *"and the narrators also told their stories significantly less well, particularly
  at what should have been the dramatic ending."* Direction and significance verified from the
  abstract; **no effect size available**, the paper is paywalled.
- **Fussell & Krauss 1989**. Descriptions written **for another person** were less useful to their own
  author later — own descriptions **86%**, another's written for another person **60%**, another's
  written for the writer's own use **49%**.

`CANDIDATE` throughout. Together these say the listener is not a passive target: degrade its feedback
and the explanation itself degrades. That is an argument *for* a responsive child, and it sits
directly against the "audience is ritual" line in Part 4. Both are in the file on purpose.

---

### E12. Analogy substitutes for mechanism, and the child supplies it

`GATED`: Weisberg et al. 2008 — mechanism-flavoured language *"masked otherwise salient problems in
these explanations."*

In the corpus the child produces or invokes an analogy on **24 of 275 lines**, against roughly five
falsifying counterexamples — four to one. The diagnostic-killing shape is on file: in the vaccines
transcript the child literalises an analogy, the explainer corrects it, the child pushes back, and
the explainer folds.

The word-check half of `tallyIntroduced` was the only instrument aimed at this and was taken off the
panel on 2026-08-19.

---

### E13. Off-task behaviour is absent, and its absence removes a signal

A real child wanders off. In the corpus, **15 lines (5%)** are topic-exits and **48 lines (17%)** are
short non-question reactions. A child who stops asking has told you something. The model never stops,
never disengages, and never acknowledges a refusal — after three "I don't know"s and a flat refusal
it asked another mechanism question. `PROBE`

---

### E14. Perfect recall forward, no learning backward

It never forgets what you said three turns ago, and it never retains what you taught it. `REPO` —
ruling 4 exists because the adult corrected an error and the child reproduced it **ten child turns
later**.

A child forgets, which forces you to say it again — that is step 8 of the session, and it has no
trigger without forgetting. And a child *learns*, which is what gives a teaching session a terminal
state. This one has none.

---

## Part 3. Edge cases in the shipped build

Concrete, reproducible, read off the code. Ordered by severity.

| # | Case | Where |
|---|---|---|
| B1 | **The user states a falsehood and the child builds on it.** Both models took a false premise as given on turn 1. The permission to assert was traded for the ledger; the ledger left and the permission stayed | `child.ts:112`, `decisions.md:148` |
| B2 | **"I don't know" is answered by the child declaring its own confusion**, and on the floor model by re-asking the question the user just failed. This is the moment the product exists to create and it has nothing there | `child.ts:112` |
| B3 | **The example bank collides with the topic list.** `EXAMPLES[0]` is a compressor getting hot; `EXAMPLES[2]` is waste going to the sewer. Two of six shipped topics are the fridge and the toilet. The "foreign topics on purpose" property is asserted as load-bearing and is **false for those two**. On the small model the child returned `EXAMPLES[0].you` verbatim — handing over the exact step being probed | `child.ts:57,67,75`, `topics.ts:17,20` |
| B4 | **No eligibility gate exists in code.** The blank-box button walks around the curated list; a procedure runs a full session. The cited effect for procedures is **−.173** — it runs backwards | `page.html:80`, `server.ts:68` |
| B5 | **The app runs whatever Ollama listed most recently.** `models[0]` is sorted by modification time. **Verified today**: that is `muse-glimmer:30b-mlx` on this machine. Identity is captured once at boot, so the header can be a lie, and there is no floor check | `model.ts:42`, `server.ts:32` |
| B6 | **First-line truncation can delete the question and leave a verdict.** A two-line reply becomes *"That doesn't make sense."* — a bare judgement of the explanation, which invariant 6 forbids | `child.ts:156` |
| B7 | **The topic is collected, displayed, and never sent to the model.** `speak` takes no topic. On turn 1 the child has one sentence and no subject, which is what regenerates the dictionary question | `server.ts:80` |
| B8 | **Invariant 2 has no enforcement point.** `AGENTS.md` names `src/index/anchor.ts` as where quote validation lives for the whole codebase. That file was deleted in `68b9ea6` | `AGENTS.md:196` |
| B9 | **Ruling 6 was reversed in code while the spec lists it Live.** `child.ts` says your words go in untouched and explains why; `child-speech.md` still claims the stammer cannot reach the model. No ruling was taken | `child.ts:126`, `child-speech.md:377` |
| B10 | **Long input or a long session evicts the worked examples.** No length cap, no context arithmetic. Lose the sample and the prior returns — the child becomes an assistant mid-session with no error and no trace. A pasted source also defeats the from-memory requirement, and nothing detects it | `server.ts:74`, `child.ts:136` |
| B11 | **Every silence has the same reason.** Ollama stopped, model cannot chat, model misnamed — all render as *"no answer from the model"*. Ruling 11 requires the configuration be named unsupported; nothing names it | `model.ts:78`, `child.ts:155` |
| B12 | **The server binds all interfaces.** `/api/state` returns the full transcript to anything on the network. The fix is one argument to `listen`, and the promise it contradicts is the first sentence of `philosophy.md` | `server.ts:92` |
| B13 | Mid-turn reload hides the in-flight turn permanently; two tabs share one history; a concurrent send races and reorders it; a 500 renders inside the child's speech bubble | `page.html:164`, `server.ts:34,87` |

---

## Part 4. Where the four investigations disagree

Kept rather than smoothed. Each of these is a real open question.

**Is the audience worth keeping at all?** One line of evidence says no: Koh, Lee & Lim 2018 (N=124,
one-week delayed test) found teaching-without-notes and plain free recall **d = 0.10 apart**, and
self-explanation with nobody in the room sits at **g = 0.55** across 69 effect sizes. Lachner, Jacob
& Hoogerheide 2021 tested this configuration directly — explaining to a fictitious less-knowledgeable
student — and found **self-explaining beat it on transfer, d = 0.59**, with their own discussion
allowing that an imagined audience *"could be detrimental."*

The other line says the audience is fine and *question depth* is the moderator. Roscoe & Chi 2007,
read in full: only **14% of shallow questions received deep responses against 41% of deep questions**,
and **21% of shallow questions elicited self-monitoring against 48% of deep**. Dialogue tutors, whose
tutees could ask questions, engaged in significantly more reflective knowledge-building than monologue
tutors. Kobayashi's interactivity moderator points the same way: direct interactive teaching with
expectancy **g = 0.84**, though on k=4.

**A third line, and it is the most direct evidence available.** Lachner, Hoogerheide, van Gog &
Renkl 2022, *Educational Psychology Review* 34(2) — a systematic review of exactly this question.
Their conclusion, verbatim: social presence during non-interactive teaching is *"a double-edged
sword, as high levels of social presence impaired rather than contributed to learning."* Teaching a
**real** remote listener who only listened impaired immediate and delayed problem-solving relative to
just studying; teaching a **fictitious** person neither helped nor hurt. Concrete rows from their
table: restudy beat non-interactive teaching to a real student at **d = 0.70** (transfer) and
**d = 0.60** (posttest); self-explaining beat teaching a present tutee at **d = 1.13** and beat
non-interactive teaching at **d = 1.64**. Arousal was higher when teaching a real person and *"did
not account for students' learning outcomes in any of the experiments."* `CANDIDATE`

**And the protégé effect is about effort, not measured learning.** Chase, Chin, Oppezzo & Schwartz
2009, verified in full. Believing you are teaching your own agent produced nearly **twice** the study
time (F(1,59) = 10.9, p < .005), **100%** of teaching-condition students choosing to revise against
**64%**, and revision persistence of **8.6 min against 2.5** (t(16) = 4.88, p < .001). But in Study
2, **learning outcomes did not differ** — 0.85 against 0.95 per question. The authors attribute that
to a short treatment. So the protégé effect is well-evidenced as a motivation result and is not
evidence that teaching a simulated agent teaches you more. `CANDIDATE`

**All of it is `CANDIDATE` and none of it is filed.** The reconciliation, if there is one, is that the
audience is not the mechanism but is a delivery device for inferential questions — in which case the
child survives on the strength of its *questions*, which is a prompt property, and the fiction
argument keeps carrying the rest. Note that E11's listener-feedback results cut against that tidy
answer, and that the one thing every line agrees on is that a listener who cannot respond is the
worst configuration of all.

**The modality conflict.** Lachner's cumulative meta-analysis splits by modality: oral explaining
**g = 0.336 [0.158, 0.513]**, written **g = −0.070 [−0.292, 0.152]**. HoldTrue is oral. The evidence
base marks *"speech is a truer diagnostic channel than writing"* as **REFUTED** on D'Mello et al.
2011. Two investigations flagged this independently and both said do not reopen it casually: the
refuted row is narrower than it reads (spoken versus typed contributions *inside a tutoring dialogue*,
not generating an oral explanation versus writing one), and the contrary sources are between-study
moderators rather than within-study manipulations. Moot today — the app ships typed input.

---

## Part 5. Verification debts

**The 87%/60% row is load-bearing in five tracked files and is under-specified.** It appears in
`evidence-base.md:103`, `decisions.md:154`, `decisions.md:587`, `feynman.md:246` and
`child-speech.md:639`. The evidence-base entry gives no year, journal, or sample size, which is unlike
every other row in that document. One investigation read Roscoe & Chi **2007** (*RER* 77(4):534–574)
in full and reports **the numbers are not in it**; they are most likely in Roscoe & Chi **2008**
(*Instructional Science* 36:321–350), which it could not retrieve through any open route. The
qualitative claim is strongly supported by the 2007 review. The numbers are unverified. Given this
file exists *because* of a citation audit, retrieve the 2008 paper or restate the row from the 2007
figures.

**A second, independent attempt confirmed the problem and did not solve it.** A separate verification
pass also failed to obtain a single percentage from either paper — both are closed access, and
Roscoe's dissertation sits behind a Cloudflare challenge. The only quantitative claim it could source
is secondary: Okita & Schwartz 2013 (p. 198) state that *"Roscoe and Chi (2007) concluded that
tutees' questions were responsible for about **two-thirds** of tutors' reflective knowledge-building
activity."* **So the 87%/60% pair now has two independent failures to verify against it.** Treat the
row as unsourced until somebody buys the paper.

**Closed.** E1's intervention subsection was second-hand on first compilation and has since been
re-fetched and read in primary text. Nothing had to be removed for being unlocatable. Two things were
wrong and are corrected in place: the ECHOMIST figures belonged to v1 of a paper whose current
version reports different ones, and the FreshQA premise-check result was attributed to the wrong
experimental setting. The PCBench prompt string was also truncated and is now quoted in full. **Both
errors were of the same kind — a real number attached to the wrong thing** — which is the failure
mode this repo's citation audit exists to catch, arriving inside a file written to inform a rewrite.

**Do not cite at all.** The widely circulated *"70% of children's questions are information-seeking"*
appears in no peer-reviewed source; use Kurkul & Corriveau's verified **85.4%** instead. Markman
1977/1979 has no obtainable failure-to-detect rate — only her own phrase *"a sizable proportion"* —
so the claim that children cannot pretend to follow has no number under it. Chouinard 2007's internal
rates are all secondary; the monograph is closed access.

**Figure-only, so anyone quoting a precise value is reading a graph.** Sharma et al.'s feedback- and
mimicry-sycophancy rates and its human-preference rates; the *Nature* 2024 supervision-error rates;
SimpleQA's confidence-versus-accuracy pairs. Kadavath et al. has **no ECE number anywhere in it**, so
any Kadavath ECE figure seen in the wild is invented. And Kalai et al.'s *"20% of birthday facts"* is
an illustrative hypothetical, not a measurement.

**What the compiler verified personally**: the model-ordering behaviour in B5, the five citation
sites for the 87%/60% row, and the deletion of `anchor.ts`. The Rozenblit & Keil rating series, the
Frazier and Kurkul tables, the Okita & Schwartz table, the Lachner 2022 review and the sycophancy
papers in E5 were read in primary text by an investigation. Everything else is as reported.

---

## Part 6. What this implies for the rewrite

Stated as questions, because answering them is the rewrite rather than a preface to it.

1. **If M3 is the premise, does anything in the product enforce it?** Today the answer is no: nothing
   stops the model filling a gap, and E1 says filling is its default and gets stronger with context.
   A law that rests on the child's ignorance should say what makes the child ignorant.
2. **Is the child load-bearing, or a delivery device for inferential questions?** Part 4 is
   genuinely split. The answer decides whether the fiction ruling is doing design work or spending it.
3. **E6 is a real, buildable eval and it needs no labels.** Whether the child's line differs between
   a complete explanation and a gutted one is the first question to ask of this product, and the
   answer at n=1 is that it does not.
4. **E8 is a one-example change** and it restores the more diagnostic of the two signals a real child
   gives.
5. **Law 1 has no mechanism, and E4 says every improvement to the prompt makes that worse.** Whatever
   the rewrite says about Law 1 has to survive that.
6. **Does the child get told to check the premise?** Pending verification, this is the one
   intervention in the file with a large effect and a one-line implementation — and it is also the one
   that runs hardest into *"never tell them their explanation was bad."* The tradeoff is a
   precision/recall call on a low base rate, and it is more affordable the more capable the model,
   which makes it a question about the floor as much as about the prompt.
7. **The illusion collapses on producing and not on receiving.** If that holds, then M1 buys the
   recalibration and M4 buys the learning, and the rewrite should stop treating the repair step as
   the thing that shows somebody they were wrong. It shows them what is right. They already know they
   were wrong — they found that out when they could not say it.
