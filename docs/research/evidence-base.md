# Evidence base: what may be claimed, and what may not

> **Reference doc.** Every empirical claim this product may make, its source, and the exact
> strength licensed. Built 2026-07-28 from primary-source retrieval after an audit found
> prior citations unsupported.
>
> **Rule of use:** claims absent here may not appear in product copy, pitch material, or a
> why-doc. Delete REFUTED claims wherever they appear. Effect sizes quoted as reported,
> never rounded upward.

---

## Part 1. REFUTED. Remove these from the docs.

| Claim as previously stated | Status |
|---|---|
| "Hand-authoring expectations is AutoTutor's known bottleneck, and removing that cost is our novelty" | **No source.** *bottleneck, cost, expensive, multidisciplinary* appear nowhere in Graesser (2016), ERIC ED586836, which reports the opposite: ASAT authoring tool shipped, licensing growing, coverage expanding. Our entire stated novelty rested on this. |
| "Trust in accuracy is the empirically-measured #1 weakness of AI tutors" (Fakour & Imani 2025) | **Misused.** Cross-sectional Likert perception survey, n=230, Taiwan. No learning outcomes, no AI-accuracy measurement; "3.7 vs 4.5" is *perceived* trust. Cannot support a false-correction-rate target. |
| "AutoTutor reaches human-tutor-level gains of 0.3–0.8σ" | **Two claims fused.** 0.3–0.8σ is vs. *reading text for equivalent time*; human-tutor parity is a separate claim from a separate source (VanLehn 2007). |
| "Speech is a truer diagnostic channel than writing" | **Refuted by our own citation.** Graesser (2016), citing D'Mello et al. (2011): no learning difference between spoken and typed contributions. Every IOED and calibration study below used *written* explanation. |
| "Knowing part-names is what fakes understanding" | **Tested and null.** Rozenblit & Keil 2002, p. 554: *"the ratio of known to total parts made a difference in initial confidence, but not in overconfidence, leaving it unclear whether the confusion of labels with mechanism contributes to the illusion."* Part-names predicted *initial confidence* (adj-R²=.777); the only surviving *overconfidence* predictor was visible/hidden parts ratio (adj-R²=.472, β=.687). |
| "Causal linkage cannot be faked" | **No source anywhere.** Counter-evidence is pointed; see Part 3. |
| "A leading question beats a stated correction" | **Unsupported.** Rosé, Moore, VanLehn & Allbritton (2001), the direct test, is null: ANCOVA F(1,18)=3.13, p<.1, n≈20; controlling for SAT, F(1,14)=1.64, not significant. |
| "Live spoken explanation is a channel an LLM cannot sit inside" | **Refuted by a shipping product.** Cluely (a16z-funded) *"operates discreetly on users' desktops, intelligently interpreting live audio and on-screen context to deliver proactive insights."* |
| "Hesitation and disfluency are surface markers of shaky understanding" | **Refuted for this use case, 2026-08-01.** Asserted in an earlier design review, no source. Holds narrowly for *answering factual questions*: Smith & Clark 1993, feeling-of-knowing drops track longer latency and more filled pauses; Litman et al. 2012 (ITSPOKE, 7,216 tutoring turns), pre-turn pause the strongest cue, averaging 3.077 s longer before uncertain turns; prosody-only detection only 63% precision against a 40% baseline. Fails for *explanation*: Schachter et al. 1991 (45 lecturers, own specialties, certainty at ceiling), filled pauses 1.39/min natural sciences, 3.84 social sciences, 4.85 humanities, F(2,42)=6.46, p<.01, differences vanishing when the same lecturers discussed a shared topic. Disfluency in exposition tracks the expressive option space, not certainty. No study tests whether disfluency localized to a causal link predicts that link being wrong. |
| "Understanding is connections, not facts" | **False dichotomy.** Expertise research runs the other way: experts hold vastly more, better-organized items. Replacement in Part 3. |

---

## Part 2. The foundation. Strong, primary-verified, load-bearing.

**The illusion of explanatory depth is real, large, and specific to mechanism.**
Rozenblit & Keil 2002, *Cognitive Science* 26:521–562. Post-attempt confidence drop:
**.918 devices · .860 natural phenomena · .351 narratives · .291 facts ·
−.173 procedures** (procedures slightly *rose*). Devices vs facts TIME×DOMAIN
F(1,147)=15.471, p<.001. Abstract: *"The illusion is far stronger for explanatory knowledge
than many other kinds of knowledge, such as that for facts, procedures or narratives."*
Replicated: Fernbach et al. 2013 Exp 2, F(1,110)=6.64, p<.01; Sloman & Vives 2022, N=739,
mechanism t(304)=4.75, p<.001, **reasons t(433)=−1.52, p=.13** (control unmoved: the effect
is specific, not generic humbling).
**Licenses:** the product targets a real, sized, well-replicated defect.

**The exposed gap is a real gap, not induced modesty.** R&K Study 5: judges rated actual
explanations significantly below self-ratings at T1/T2, *statistically indistinguishable*
at T3/T4; judges correlated r=.644 with T2 vs .449 with T1 (difference p<.001). Study 6:
forewarning shrank but did not remove the drop.
**Licenses:** acting on the post-attempt state as the truth.

**Learners cannot locate their own gaps.** Yang, Zhao, Yuan, Luo & Shanks 2023, *Review of
Educational Research*: 115 studies, 15,889 participants, 502 effects. Baseline
metacomprehension accuracy **MC = .178 [.155, .200]**, roughly a 54.5% chance of ranking a
well-understood text above a poorly-understood one. **Licenses:** the entire demand
argument. Not laziness; measured near-chance.

**But explaining is not privileged.** Same meta-analysis: self-explaining ΔMC=.179 vs
practice testing ΔMC=.169, a tie; delayed rereading the weak control at ΔMC=.063.
**Forbids:** any claim that explaining calibrates better than self-testing.

**Coverage and linkage genuinely come apart.** Shiroda et al. 2024, *CBE-Life Sciences
Education*, 816 explanation opportunities: **48% "partial mechanistic" (missing key factors
or failing to link them mechanistically)** vs 32% complete, 20% nonmechanistic.
**Licenses:** scoring linkage separately from coverage. **Does not license:** treating this
as a property of documents or artifacts; it measured undergraduate production.

**Multiple-choice conceptual scores are an upper bound.** Hestenes, Wells & Swackhamer
1992 (Force Concept Inventory): the score *"should be regarded as an upper bound on a
student's Newtonian understanding"* because *"Newtonian choices for non-Newtonian reasons
were fairly common"*, and *"Verification would require an interview or explanation from
the students."*

---

---

## Part 3. The defensible replacement for "connections over facts"

Not a theory of cognition. A **diagnostic asymmetry**, about what recitation can counterfeit:

> Naming the parts is cheap and fakeable. Producing the causal link between them is the
> step that separates a memorized explanation from a held one.

Licenses: R&K domain specificity (mechanism .918 vs facts .291), Shiroda's 48%
partial-mechanistic rate, FCI authors' concession above.

Limits, stated alongside:

- **Audience-directed explanation maximizes recitation.** Roscoe & Chi: explain-to-an-audience
  gave **87% knowledge-telling episodes vs 60%** for self-explanation to text, **3.7 vs 13.6**
  knowledge-*building*. Weisberg et al. 2008: mechanism-flavored language *"masked otherwise
  salient problems in these explanations."*
- **No head-to-head study shows mechanism rubrics discriminate better than coverage
  checklists.** Contrary: Hake 1998, r=+0.91 between conceptual and problem-solving course
  means.
- **Concrete construal diminishes the illusion.** Alter, Oppenheimer & Zemla 2010, *JPSP*
  99:436–451. Opening with "walk me through it step by step" shrinks our own diagnostic yield.
- **Confidence deltas are not item-specific.** Meyers et al. 2023, three preregistered
  studies, N=240/327/264: explaining one phenomenon lowers claimed understanding of an
  *unrelated* one. No per-topic metric on a confidence delta.
- **Effect size varies with the learner.** Gaviria & Corredor 2024, n=255: IOED replicated
  (M=0.99) but memory-task performance *negatively* associated with IOED magnitude. R&K
  Study 3: illusion *larger* at a less selective institution.

---

## Part 4. Repair is mandatory. This settles a product decision.

**An error elicited but not corrected persists as an error.** Butler & Roediger 2008,
*Memory & Cognition* 36:604: *"the selection of lures can lead students to acquire false
knowledge… In comparison with the no-feedback condition, both immediate and delayed
feedback increased the proportion of correct responses and reduced the proportion of
intrusions… Educators should provide feedback."* Surfacing without correcting is worse than
not surfacing, not neutral. *(Caveat: their errors were externally-presented lures, not
self-generated explanatory gaps. Transfer is an inference.)*

**Diagnosis alone yields virtually nothing.** Metcalfe 2017, *Annual Review of Psychology*
68:465: *"It is not enough to simply tell learners whether they were right or wrong. People
get virtually no benefit unless the feedback they receive provides the correct answer."*

**The correction must be a refutation, not an exposition.** Van Loon et al. 2015 via
Metcalfe: hypercorrection *"did not occur when students simply read standard texts that
presented the correct factual information without emphasis on the conceptual errors, it did
occur when the students read what they called 'refutation' texts."* → name the learner's
claim, *then* the missing mechanism. Hedging costs: emphasis on the error is what works.

**Supplying the correct solution roughly doubles the effect.** Kluger & DeNisi 1996,
*Psychological Bulletin* 119:254, Table 2: **d=.43 (k=114) with the correct solution vs
d=.25 (k=197) without.**

**Person-level feedback is net harmful.** Same source: discouraging feedback interventions
**d=−.14 (k=49)** vs d=.33 for all others; top-quartile threat-to-self-esteem d=.08 vs
bottom-quartile **d=.47**. Shute 2008, *RER* 78:153: *"Focus feedback on the task, not the
learner."* → "Your explanation had no machinery underneath it" is forbidden. "You said
pressure drives flow but not how the gradient is generated .  that step is X" is the form.

**A grade cancels a comment.** Shute 2008 summarizing Wiliam 2007: *"(a) students receiving
just grades showed no learning gains, (b) those getting just comments showed large gains,
and (c) those with grades and comments showed no gains."* A band beside a diagnosis destroys
it.

**Generation without consolidation has a name, and it is not productive failure.** Kapur
2016, *Educational Psychologist* 51:289: *"conditions that maximize neither performance nor
learning in the short or long terms. I refer to such design efforts as unproductive
failure."* Loibl, Roll & Rummel 2017: *"Without contrasting cases during problem solving and
without instruction building on student solutions, there seem to be no clear benefits."*
Bjork's criterion: *"If, however, the learner does not have the background knowledge or
skills to respond to them successfully, they become undesirable difficulties."*

**Calibration pays only through an available repair path.** Thiede, Anderson & Therriault
2003, *J. Educational Psychology* 95:66: *"The superior monitoring accuracy produced more
effective regulation of study. Differences in monitoring accuracy and regulation of study,
in turn, produced greater overall test performance."* Their participants had restudy
material *inside* the study: every measured calibration benefit sits downstream of acting on
it. "Calibration alone is the product" is off the ladder.

**The honest form of "ask, don't tell": ask first, then tell.** Asking is legitimate
elicitation before feedback and consolidation after it (Siegler 1995 via Metcalfe: *"How do
you think I knew that?"* asked **after** corrective feedback beat both feedback-only and
explain-own-reasoning), not a substitute for the correction between. VanLehn et al. 2006
bounds it: *"The value of interactive tutoring over reading text is minimal or non-existent
when: (1) content is controlled, and (2) students are required to answer questions as they
study the text, and (3) the students are studying text written to their level."* Kirschner,
Sweller & Clark 2006: unguided instruction *"may have negative results when students acquire
misconceptions or incomplete or disorganized knowledge."*

**On anxiety, the balanced statement.** Theobald, Breitwieser & Brod 2022, *Psychological
Science* 33(12):2073: *"Test anxiety did not predict exam performance over and above
students' knowledge level"* **but** *"high trait anxiety was associated with smaller
knowledge gains during the preparation phase."* It defeats interference-at-test, not
harm-to-learning. Use Metcalfe's framing: *"The concern that errors might evoke dysfunctional
emotional reactions appears to be exaggerated. Of course, sensitive handling of errors and
avoiding gratuitous punishments (verbal or otherwise) is essential."* Bandura, on a
first-session diagnostic: *"Failures undermine it, especially if failures occur before a
sense of efficacy is firmly established."*

---

---

## Part 5. The spoken channel: what it costs

**Apple's recognizer, worst of five tested.** Koenecke et al. 2020, *PNAS*: aggregate WER
**0.35 Black vs 0.19 white speakers**; *"for Apple, whose ASR has the worst overall
performance, the WERs for black and white speakers are 0.45 and 0.23."* Microsoft best,
0.27/0.15. On-device or cloud: unstated.

**Apple's own stuttering baseline:** CHI 2023, *"improves word error rate from 25.4% to
9.9%,"* so 25.4% is the consumer-grade rate. Google Euphonia: severely impaired speech ~89% WER
unadapted vs 13% personalized.

**No study measures Apple's *on-device* recognition for demographic disparity, and Apple has
published none.** Only public SpeechAnalyzer / SFSpeechRecognizer benchmark: LibriSpeech read
audiobook speech, not broken out by race, dialect, accent, age, or disability. **You cannot
cite a fairness number for the component you ship.**

**Automated speech scoring fails in a way that passes naive validation.** ETS RR-17-42,
Loukina & Buzick 2017: *"the word error rate was higher for these groups relative to the
control group, suggesting that the automatic speech recognition system contributed to the
discrepancies between SpeechRater and human scores"*; scores *"tended to be higher than the
human scores"* for speakers with speech impairments. AERA/APA/NCME **Standard 4.19** requires
evidence *"that the scoring algorithms do not introduce systematic bias against some
subgroups."*

**Oral assessment reliability.** Wass et al., *Medical Education* 2003: intercase reliability
0.65, high-stakes structured oral; 0.78 needs **four 20-minute orals, two examiners each**.
Unstructured vivas 0.3–0.4 (BMC Med Educ 2023), measuring fluency. Laurin-Barantke et al.
2016: test anxiety higher oral than written (M=48.1 vs 43.7, p<0.001).

**Learner reception of an AI oral.** Ipeirotis & Rizakos (NYU), arXiv 2603.18221: *83% found
the AI oral more stressful than written exams* (63% the following term); *"felt like a fair
evaluator"* drew **33%**, rising to 56%. On security: *"Live AI coaching via headset, phone,
or smart glasses is not fully preventable: a fluent student repeating coached answers
naturally would not be detectable from the transcript or video alone."* Its claim that
follow-ups expose rehearsal is **design rationale, not a measured result**.

**Law.** WCAG 2.1/2.2 does **not** prohibit speech-only input (Guideline 2.5 covers
pointers), so an inaccessible speech-only design can conform. WCAG 3.0 draft: *"Content or
functionality does not rely on speech alone."* European Accessibility Act Annex I §VII(f)
requires a non-vocal mode of operation, in force 28 June 2025 *(substance verified, wording
not; do not quote verbatim)*. DOJ Title II reaches a private app via *"contractual,
licensing, or other arrangements."* 28 CFR 36.309(b)(1)(i): exams must reflect aptitude
*"rather than reflecting the individual's impaired sensory, manual, or speaking skills
(except where those skills are the factors that the examination purports to measure)"*;
construct here is understanding, not speaking skill.

**EU AI Act Annex III(3)(b):** high-risk covers *"AI systems intended to be used to evaluate
learning outcomes, including when those outcomes are used to steer the learning process."*
Obligations bite 2 Aug 2026. Art. 6(3) derogation unavailable where profiling of natural
persons occurs. **Positioning as practice, not assessment of learning outcomes, is the
cheapest escape; deleting the band keeps it available.**

---

## Part 6. Open, and honestly so

- **No study tests the actual product configuration**: a self-generated explanatory gap,
  named, and what follows. Repair verdict: inference from four converging literatures, not
  replication.
- **Nobody has measured whether adaptive follow-ups expose rehearsal.** Single source,
  unmeasured design rationale; largest hole in any security claim.
- **No fairness data exists for on-device iOS recognition.**
- **Chi et al. 2001 Study 2** (tutors suppressed from giving explanations; students
  reportedly learned as much), secondhand only. Strongest live counter-argument to Part 4;
  retrieve before closing that section.
- **Unverified, cite only after retrieval:** Fischer et al. 2025, Harb et al. 2025,
  Dworzanski 2023, AIS 2019, IVA 2016; none independently checked.

---

## Part 7. The wider study-technique evidence

Added 2026-07-28, when the product became an all-in-one study tool. Primary PDFs, not
summarizers.

### Ship

**Practice testing.** Dunlosky et al. 2013, *Psychological Science in the Public Interest*,
**high utility**: *"Testing effects have been demonstrated across an impressive range of
practice-test formats, kinds of material, learner ages, outcome measures, and retention
intervals."* Rowland 2014: **g = 0.50** [0.42, 0.58]; high-exposure subset g = 0.66. Yang
et al. 2021, classroom, 222 studies / 48,478 students: **g = 0.499**.

**Feedback that contains the answer.** Rowland 2014: with feedback **g = 0.73** [0.61,
0.86]; without, **g = 0.39** [0.29, 0.49]. Converges with Kluger & DeNisi (Part 4),
d=.43 vs .25.

**Distributed practice.** Dunlosky's second **high utility**: *"It works across students of
different ages, with a wide variety of materials, on the majority of standard laboratory
measures, and over long delays."* Latimier et al. 2021, spaced vs massed retrieval
**g = 0.74**. Donoghue & Hattie 2021: **d = 0.85** (150 cases, N=152,952).

**Delay before testing.** Rowland: ≥1 day **g = 0.69**, <1 day **g = 0.41**.

**Prequestions.** St Hilaire, Chan & Ahn 2024: *"a moderate specific effect (g = 0.54,
k = 97) but a virtually nonexistent general effect (g = 0.04, k = 91)."*

### Refuse

Dunlosky's five **low-utility** verdicts, verbatim:

- **Highlighting / underlining**: *"In most situations that have been examined and with
  most participants, highlighting does little to boost performance … it may actually hurt
  performance on higher-level tasks that require inference making."*
- **Rereading**: *"The relative disadvantage of rereading to other techniques is the
  largest strike against rereading and is the factor that weighed most heavily in our
  decision to assign it a rating of low utility."*
- **Summarization**: effective *"for learners who are already skilled at summarizing;
  however, many learners … will require extensive training, which makes this strategy less
  feasible."*
- **Keyword mnemonic**: *"not highly efficient … and it may not produce durable learning."*
- **Imagery for text**: *"largely constrained to imagery-friendly materials and to tests
  of memory."*

**Expanding intervals, the premise of every spaced-repetition app.** Karpicke & Roediger
2007: *"Expanding the interval between repeated tests had little effect on long-term
retention in 3 experiments."* Latimier 2021, expanding vs uniform **g = 0.034**; *"do not
support the widely held belief that inter-retrieval intervals should be progressively
increased."*

**Any claim that SM-2 or FSRS improves learning.** No peer-reviewed trial exists. FSRS's
benchmark measures *"how well predicted probabilities of recall match the real data"*:
calibration, not learning. SM-2's author: *"constructed by means of the trial-and-error
approach,"* E-Factor *"constructed heuristically."*

**Interleaving for vocabulary.** Brunmair & Richter 2019: *"An advantage of blocking
compared to interleaving was found for studies based on words (g = −0.39)."*

### Conditional: state the condition or the claim is false

- **Retrieval without feedback works only above ~50% success.** Rowland, no feedback,
  ≤50% initial accuracy: **g = 0.03** [−0.21, 0.27], p = .79, *no effect at all*. Above
  75%: g = 0.56. **Sharpest design constraint in the corpus.**
- **Interleaving** needs confusable categories in immediate succession: **g = 0.73**
  unspaced vs **g = 0.22** spaced. Visual categories g=0.67; math strategy-selection
  (Rohrer 2020 RCT, d = 0.83, 54 classes). Overall g = 0.42.
- **Elaborative interrogation**: d = 0.56, but needs prior knowledge, discrete factual
  units, dense prompting; effects *"substantially diluted … or even reversed … when
  prompts are administered infrequently."*
- **Transfer**: Pan & Rickard 2018, d = 0.40 overall, d = 0.78 with both response
  congruency and elaborated retrieval, **d = 0.21 with neither**, g = 0.16 [−0.10, 0.43]
  for untested material.

### Design prescriptions

1. **Feedback is structural, not a setting.** Every attempt reveals the answer. Below 50%
   success without it, retrieval does nothing.
2. **Ship both free-response and multiple choice.** Lab favours production (cued recall
   g=0.72, free recall g=0.81, recognition g=0.36); classroom does not. Yang et al.:
   *"No significant difference in effectiveness … between recall and recognition tests,
   regardless of whether feedback was provided (recall: g = 0.541; recognition:
   g = 0.607)."* Little et al. 2012: *"properly constructed multiple-choice tests can
   indeed trigger productive retrieval processes."* Enforce **competitive, plausible
   distractors**, not the format.
3. **Match practice format to the target assessment.** Consistent g = 0.531 vs inconsistent
   g = 0.399.
4. **Uniform intervals, not expanding.** No defensible ratio rule exists: Cepeda 2008's
   optimal gaps *"depart noticeably from the fixed ratio of retention interval suggested by
   some earlier researchers"* (≈20% of delay at weeks, ≈5% at a year).
5. **Generated items must be grounded to a source span.** Law et al. 2025, GPT-4o vs human
   MCQs, high-stakes exam: **6% factual inaccuracies vs 4%**, **6% irrelevance vs 0%**,
   **14% inappropriate difficulty vs 1%**, and *"AI questions primarily tested lower-order
   cognitive skills, while human MCQs better assessed higher-order skills (χ² = 14.27,
   p = 0.003)."*
6. **Interleave only within confusable sets. Never for vocabulary.**
7. **Do not let the learner drive the schedule.** Kornell & Bjork 2008: *"78% of the
   participants did better with spaced presentations … but 78% of the participants said
   that massing was as good as or better than spacing."* Karpicke, Butler & Roediger 2009:
   *"A majority of students repeatedly read their notes or textbook … but relatively few
   engage in self-testing."*

---

---

## Part 8. Where this literature is weak

Read before treating Part 7 as settled.

**Publication bias is documented and material.** Rowland 2014: published g = 0.58 vs
unpublished **g = 0.25**. Pan & Rickard 2018: *"This result reinforces our earlier inference
of at least moderate publication bias in this literature"*, with a *negative* bias-corrected
intercept: no transfer effect once moderators are removed. Yang et al.'s p-curve disagrees:
bias risk small. Contested, unresolved.

**Testing barely beats other active strategies.** Yang et al.: vs restudying **g = 0.330**;
vs **other elaborative strategies g = 0.095.** Headline numbers come from comparisons
against filler tasks: retrieval practice beats doing nothing much, ties anything else
effortful.

**A major meta-analysis contradicts Dunlosky's rankings.** Donoghue & Hattie 2021:
rereading **d = 0.47**, summarization **d = 0.44**, underlining **d = 0.44**, vs practice
testing 0.74. Both cannot be right. Caveat: *"the majority of studies in the
meta-analysis were based on surface or factual outcomes."* Dunlosky graded generalizability;
Hattie pooled raw effect sizes. **Consequence: "refuse" means we built no affordance for it,
not that we claim it is useless.**

**Classroom generalization is weak.** Spaced retrieval practice was significant in **two**
of nine introductory STEM courses; the meta-analytic spacing effect vanished when calculus
was excluded. A 2026 study (n=67 and n=129, feedback, delayed posttests) found *"No
significant differences … between groups at delayed test."*

**Widely-cited numbers that do not exist.** Cepeda 2006 reports no overall *d* for spacing,
only accuracy (massed 36.7% vs spaced 47.3%). The circulating "d = 0.4 from Cepeda 2006" is
not in that paper.

**Most of this tests surface, near-transfer outcomes within a day.**

### Unverified

- Adesope et al. 2017 format effect sizes: secondary, via Yang et al.
- Lindsey et al. 2014 personalized review (16.5% over massed, 10.0% over uniform spacing):
  secondary. **The only known work measuring real learning from an adaptive scheduler.**
- **No randomized study compares LLM-generated study materials to human-authored ones on
  learning outcomes.** The grounding prescription rests on Law et al.'s flaw rates, not a
  grounding trial; no evidence retrieved that it measurably reduces unsupported claims.
- No head-to-head of algorithmic vs learner-controlled scheduling on final test performance.
