# HoldTrue: what the product is

HoldTrue is a study application. You explain one causal mechanism out loud, from memory. A model
answers as a curious 10-year-old child. The child does not hold the correct answer. A review then
finds the gaps in your explanation. The review closes the gaps. The product has two phases. The live
phase runs one model call per turn. The child stays ignorant. The end phase runs four parts in
order: Check, Diff, Probe and Close. `docs/architecture.md` describes both phases.
`docs/decisions.md` gives the reason for the split.

## What the code holds today

Both phases run. `docs/architecture.md` lists every file in `src/` under "What exists today". The
build takes typed input. The build does not accept voice. The app does not have a topic gate. The
server holds one session in memory. The server writes nothing to disk. The findings appear once.
The app loses them when the process stops. No eval measures what the end phase produces.

## A session

Every step in this list runs today.

1. You pick a topic from the curated list. You cannot type your own topic.
2. You give consent. The app names the destination: the provider of the provided model.
3. You explain the mechanism from memory. The app shows you no source text.
4. The child says one short line back. It asks about one step in what you just said. It can press
   the same step again.
5. At the twelfth turn, the app shows one line that points at the End button. Decision 21.
6. You press the end button.
7. The review opens. It lists the links you did not say, and the claims you said wrong.
8. The product asks you one question about the first row of that list.
9. The product states your claim, then states the missing mechanism. This runs for every row.

## The four mechanisms

Every part of the product serves one of these four mechanisms.

**M1 Production.** You produce the explanation instead of recognising one. The attempt shows you the
step you cannot say. Rozenblit & Keil 2002, *Cognitive Science* 26:521–562. The confidence drop
after the attempt depends on the topic type. The eligibility rule below holds the four figures.
Fernbach et al. 2013 and Sloman & Vives 2022 replicate the result.

**M2 Gap location.** You cannot find your own gap. Something outside you must find it. In this
product the child finds it. The child cannot follow you past the missing step. Yang, Zhao, Yuan, Luo
& Shanks 2023, *Review of Educational Research*. 115 studies, 15,889 participants, 502 effects.
Baseline metacomprehension accuracy is **MC = .178 [.155, .200]**. That is near chance.

**M3 Non-collusion.** The listener must not complete your chain for you. If the listener completes
it, the missing step never appears. The session then looks like a success.
**M3 has no row in `docs/research/evidence-base.md`.** Two studies bear on M3.
`docs/research/feynman-edge-cases.md` holds both studies. Frazier, Gelman & Wellman 2009 and Kurkul &
Corriveau 2018 measured what a child does after a poor explanation. The child re-asks the question.
The child also supplies an explanation of its own. Both studies carry the mark `CANDIDATE`. The
evidence rule therefore blocks both studies. The product treats M3 as a premise until someone files
a row. One engineering measurement bears on the risk. Su & Cardie 2026 (arXiv:2605.25284) measured
how often a model asks a clarifying question instead of filling a gap. The rate stays **below 5%**
in ordinary generation. The rate drops **to near 0% with context**. A session adds context every
turn. This result measures models, not people.

**M4 Closure.** A gap that opens must close. Something must state the correct answer after the gap
appears. Rowland 2014. Retrieval without feedback, at or below 50% success: **g = 0.03 [−0.21,
0.27], p = .79**. Above 75% success: g = 0.56. Butler & Roediger 2008, *Memory & Cognition* 36:604.
If nobody corrects an elicited error, the learner keeps that error as false knowledge. HoldTrue
targets the moment you cannot produce the step. The end phase is therefore not an extra part.

## The two laws

### Law 1. Anything that asks must supply the answer

The child asks questions. The child never answers them. The end phase must answer every question the
child opened. A session must not end with an open question. Kluger & DeNisi 1996, *Psychological
Bulletin* 119:254, Table 2. Feedback with the correct solution measures **d = .43 (k=114)**.
Feedback without the correct solution measures **d = .25 (k=197)**. Metcalfe 2017 states that people
get almost no benefit unless the feedback gives the correct answer. Van Loon et al. 2015, through
Metcalfe, sets the form. Close states your claim first. Close then states the missing mechanism.
Close must not present the correct mechanism on its own.

### Law 2. Every assertion names a source model

Every finding on the screen names the model that produced it. The provided model runs the whole
end phase, for every session. Rule 53. `docs/architecture.md` owns the provided model and the
model layer. If the provided model fails, the app must not use the startup model in its place. The
app states the failure. Decision 19 removed the two labels. One kind of review needs no label.

The child asserts nothing. It may name a thing. It must not supply a cause. The law also blocks a
statement that no model can source. "Your explanation was unclear" has no ground truth. No model can
produce that statement. The product must not print it.

**The product retires one old promise. Do not repeat it.** Earlier documents said that nothing leaves your
device unless you turn something on. There is no default model. You choose once at startup. You set
up Ollama, or you enter an API key. An API key sends your text to that provider during the
conversation. Every session sends the whole transcript to the provider of the provided model at
the end. Rule 53. The app must name the destination that it uses. The app must take your consent
before the first send. Decision 21 moves that consent to the start screen. The retention terms,
the training terms and the deletion terms stay open. `docs/decisions.md` holds that open decision.

## The eligibility rule

A session runs on a causal mechanism and on nothing else. Facts, vocabulary and procedures are out
of scope.

| Topic type | Confidence drop after the attempt |
|---|---|
| Devices | **.918** |
| Natural phenomena | **.860** |
| Facts | **.291** |
| Procedures | **−.173** |

Rozenblit & Keil 2002. The figure for procedures is negative. An explanation of a procedure raises
confidence a little. A procedure session therefore produces the opposite of the intended effect.
Check returns the true mechanism as a set of links. A fact has no links. A procedure has an order
rather than a cause. The end phase then has nothing to compare. **The owner did not build the topic
gate.** The owner curates the topic list. The page also has a button named "Something else". That button
starts a session with the fixed title "Explaining". You cannot type a topic today. A topic box is a
design, not code.

## The features

The product must produce these.

1. The child makes you keep producing an explanation. See case M1.
2. The child asks a question that needs a cause in the answer. See case E7a.
3. The child tells you where it lost you. See case E6a.
4. The end phase closes every gap the child opened. See case M4.

[`cases.md`](cases.md) holds the register. Read a case there before you change one here.

A later build adds the quiet turn. The child then goes quiet when it has no question. The owner did
not build the quiet turn. A button ends the session, and `src/page.html` holds it.

## The guards

The product must not produce these behaviours. `AGENTS.md` holds the rule text. This table gives the
rule number, what the product does about the behaviour, and how. Every entry describes the design.
The end phase does not run today.

The old design gave every guard to the child's prompt. The prompt did not enforce them. The owner
measured three repairs of one failure. Each repair moved the behaviour to a new word. No repair
removed it (`src/child.ts`, n≈1, one local model, three days). The end phase design therefore takes
most of the guards. Set arithmetic works there. A test can check a row. The middle column takes one
of three words.

- **Prevents** — the behaviour cannot happen.
- **Records** — the behaviour happens, and the review prints a row for it.
- **Neither** — the behaviour happens, and no row reports it.

| Rule | The product | How |
|---|---|---|
| 2 | Records | The intrusion row lists a child line that asserts a link your words do not contain. |
| 3 | Neither | Check credits a link to your turns only, so the child's agreement changes no finding. No row reports the line. |
| 4 | Records | A restatement that adds a link becomes an intrusion row. A restatement that adds no link gets no row. |
| 5 | Records | This behaviour is the exact target of the intrusion row. |
| 6 | Neither | The prompt lets the child press the same link again. Nothing enforces it. |
| 7 | Records | An analogy that supplies a cause becomes an intrusion row. An analogy that supplies no cause gets no row. Nothing stops the child. |
| 11 | Prevents | Close runs for every row, so no question stays open. |
| 16 | Prevents | The review prints rows. Nothing computes a number. |
| 17 | Prevents | Law 2 blocks the statement. No model can source a judgement with no ground truth. |
| 18 | Prevents | Nothing measures delivery. The live phase passes your words in untouched. |
| 19 | Neither | The topic gate is not built. The curated list and the warning are the only barriers. |
| 44 | Neither | The child never stops on its own. You end the session with a button. |

Rules 2, 4, 5 and 7 share one detector. That detector is the intrusion row. It finds a child line
that asserts something your words do not contain. Rule 7 is the weakest row.
`feynman-edge-cases.md` counts an analogy on 24 of 275 child lines. The rate is high. The design
records only the analogy that supplies a cause.

## What the product refuses to build, and why

**A score, a grade, a rating or a progress bar beside a finding.** Shute 2008 summarises Wiliam 2007.
Students who got only grades showed no gains. Students who got only comments showed large gains.
Students who got both showed no gains. A number beside a diagnosis destroys the diagnosis.

**A judgement of you rather than of the explanation.** Kluger & DeNisi 1996: discouraging feedback
interventions measure **d = −.14 (k=49)** against d = .33 for all others. The product names the link
you did not say. It does not name a quality of you.

**A hesitation detector or a disfluency signal.** `evidence-base.md` marks this claim REFUTED.
Schachter et al. 1991 measured filled pauses in lectures. The rate was 1.39/min in the natural
sciences and 4.85/min in the humanities. Every lecturer spoke on a personal specialty. Every
lecturer was fully certain. Disfluency follows the available wording, not the certainty.

**A session on a fact, a term or a procedure.** The eligibility rule above holds the figures.

**One model that listens and corrects at the same time.** That model repairs your explanation while
you speak. That model destroys M3.

**A claim about learning with no row in `docs/research/evidence-base.md`.** An engineering
measurement is a separate category. Each measurement carries its source where you use it.

**A promise that your text stays on your device.** Your text leaves the device unless you run a
local model.
