# Decisions

This file records the decisions of 2026-08-19. It owns these items:

- every reason
- every rejected alternative
- the build order
- the open decisions

`docs/architecture.md` owns the design itself.

**The previous documentation is gone.** The owner deleted it on 2026-08-19. Its rulings are not
binding. Do not cite them. Do not recover them from git. The research in `docs/research/` and the
transcripts in `docs/transcripts/` survive. They are evidence, not rulings.

**Both phases run.** The owner built every item in the build order on 2026-08-19.
`docs/architecture.md` lists every file in `src/` under "What exists today". The app does not have
a topic gate. Decision 11 records why. No eval measures what the end phase produces.

## 1. Two phases

**Decided.** HoldTrue runs a live phase and then an end phase.

**Why.** M3 needs a listener that cannot complete your chain. M4 needs a part that knows the correct
answer. One model cannot hold both roles in the same turn.

**The rejected alternative.** The owner rejects one model that corrects you mid-session.

## 2. Check decides link identity, and Diff is arithmetic

This is the most important decision in this file.

**Decided.** Check returns links with ids, and Check decides when two words name the same link. Diff
is a pure function over ids and flags. Diff never compares text, and Diff is not a model.

**Why.** Judging that "the gas gets squeezed" and "compression" are the same link is a model task. No
string rule does this task. The retired `cohere.md` design had this exact defect. Its matching layer
joined zero seams on real extractions. Raw string equality returned the identical node count.

The cause was grammatical form. The extractor wrote causes as noun phrases. It wrote effects as verb
phrases. Thus "the chain" and "pulls the chain" never joined. A closed three-link chain produced four
false flags. Stemming does not correct this defect.

This design moves identity into the model for that reason. It also leaves Diff exact, so a test can
pin every row without a model.

**The rejected alternative.** The owner rejects a second text-matching layer. Stemming, normalising
and cosine matching all compare surface form. The measured failure was not surface form. The owner
also rejects a model that reads the transcript and reports the gaps. That design has no oracle.

## 3. Diff orders contradictions, then intrusions, then omissions

**Decided.** Diff emits a contradiction first, an intrusion second and an omission last.

**Why.** A false claim is the worst thing you keep after the session. An intrusion is a cause the
child invented. You may now believe it. An omission may only mean that you compressed a step.

**The rejected alternative.** The owner rejects an order by count or by confidence.

## 4. Probe runs once, on the first row

**Decided.** Probe takes the first row of the Diff output and asks one question. The end phase must
not skip Probe.

**Why.** Check reads your words only. It cannot separate "you did not say it" from "you do not know
it". Your answer separates them. Decision 3 sorts by harm, so the first row is the worst row.

**The rejected alternative.** The owner rejects the phrase "the largest gap", which has no definition.

## 5. Close runs for every row

**Decided.** For the probed row, Close uses the verdict. For every other row, Close states that you
did not say the link.

**Why.** M4 needs a correct answer for each surfaced gap. Only one row carries a probe answer. For
every other row, the app has no evidence about your knowledge.

**The rejected alternative.** The owner rejects a Close that states you do not know the link.

## 6. The model layer has no default

**Decided.** The user makes one choice at startup, Ollama or an API key. That one model runs the
child. It also runs the end phase when the toggle is off.

**Why.** A local model keeps your text on the device. A key sends your text to a provider. A default
hides that consequence from the person who lives with it.

**The rejected alternative.** The owner rejects a BYOK default. It decides that question for you.

## 7. The omniscient toggle

**Decided.** The user sets the toggle for each session.

**Why.** Check needs ground truth about the mechanism. A small local model does not hold this ground
truth. The user must know which model produced a finding. The two labels carry that fact.

**The rejected alternative.** The owner rejects one silent quality level for every user.

## 8. No silent fall back

**Decided.** If the provided frontier model fails, the app must tell the user. The app must not use
the startup model in silence. The app states the failure. The app labels the session unverified.

**Why.** The user paid for a verified session. A silent swap returns a weaker finding under the label
the user paid for. The labels exist to prevent this failure.

**The rejected alternative.** The owner rejects an automatic retry on the startup model.

## 9. An unreachable model is a stated failure

**Decided.** If the end phase cannot run, the app states on the screen that no review ran and that
the questions stay open.

**Why.** The user reads a silent ending as a session that found nothing wrong. This result is the
worst outcome the product can produce. `model.ts` returns a result rather than throwing, so the app
can state the failure.

**The rejected alternative.** The owner rejects an empty screen and a generic error banner.

## 10. A button ends the session

**Decided.** The user presses a button to end the session. A child that stops asking questions is a
feature for a later build. The owner does not build this feature now.

**Why.** A quiet turn needs a rule that says when the child has no question left. No such rule
exists. The end phase cannot wait for a signal that nobody designed.

**The rejected alternative.** The owner rejects an end signal that the child produces today.

## 11. The owner does not build the topic gate

**Decided.** The owner curates the topic list. No part of the app checks a topic. A box for a
user's own topic is a design. The code has a button that starts a session with a fixed title.

**Why.** The eligibility rule is real. `docs/product.md` holds its figures. A check needs a
classifier that nobody designed. A warning is honest. A silent pass is not.

**The rejected alternative.** The owner rejects a session with no topic of the user's own. Such a
session serves fewer people.

## 12. One session in memory

**Decided.** The server holds one session in memory. Nothing goes to disk. The findings appear once.
The app loses them when the process stops.

**Why.** The product is unproven. Storage adds a privacy surface and a migration cost before anybody
knows whether the review is worth keeping.

**The rejected alternative.** The owner rejects a database and a session file.

## 13. Consent before the first send

**Decided.** The app must disclose where the text goes. The app must take the user's consent before
the first send. The retention terms, the training terms and the deletion terms stay open below.

**Why.** The startup choice decides whether your words leave the device. The user cannot consent to a
transfer nobody named.

**The rejected alternative.** The owner rejects a consent notice in the documentation only.

## 14. The deletion of the old documents

**Decided.** The owner deleted the old documents, and this log replaces them.

**Why.** The old documents held rulings that the product no longer follows. Several rulings
contradicted the code, so a reader could not tell a current rule from an obsolete rule.

**The rejected alternative.** The owner rejects an edit pass over the old files.

## 15. A model may write a test assertion

**Decided.** A model may write a test assertion. The owner removes the old rule that required a human
author.

**Why.** The rule cost a person for each assertion. It stopped no bad test. A testable oracle is the
real control. Diff has an oracle. The child's line has no oracle, whoever writes the assertion.

**The rejected alternative.** The owner rejects keeping the rule for a human author.

## The build order

This file is the only place the build order lives. The owner built every item in this list on
2026-08-19. The list stays because it records the order and the reason for each step.

1. **The model layer.** The startup choice, Ollama or a key. Every part below makes a model call.
2. **The disclosure and the consent screen.** The key path sends your text off the device. The
   consent must appear with the path that causes the transfer.
3. **The end signal button.** The end phase cannot start until a session can end.
4. **The marked transcript.** Check takes a transcript with a role on every turn.
5. **Check.** It returns the links, the ids and the flags that every part below reads.
6. **Diff.** It needs the ids and the flags from Check, and a test can pin it without a model.
7. **Probe.** It takes the first row from Diff, so Diff must sort first.
8. **Close.** It uses the probe verdict for one row, so Probe must run first.
9. **The omniscient toggle.** It swaps the model behind the end phase and adds the two labels.
10. **The review screen.** It shows the rows, the probe, the closures and the label.

The topic gate is not in this list. Decision 11 records why.

## Open decisions

The owner must answer each of these before release. Do not invent an answer.

1. ~~**The privacy terms.**~~ **ANSWERED 2026-08-20.** See decision 15.
2. ~~**The end signal design.**~~ **ANSWERED 2026-08-25.** See decision 17.
3. ~~**The topic gate.**~~ **ANSWERED 2026-08-25.** See decision 18. The gate design itself is a
   proposal. `docs/proposals/topic-gate.md` holds it, and the owner has not ruled on the design.
4. ~~**Is the end phase worth running with the toggle off?**~~ **ANSWERED 2026-08-25.** See
   decision 19.

## 15. HoldTrue saves nothing, and the provider speaks for itself

**Decided.** The app makes one promise, and the promise covers the app only. HoldTrue writes no text
to a disk. HoldTrue keeps one session in memory. HoldTrue loses that session when the process stops.

The app makes no promise about a provider. The owner does not control OpenAI, Anthropic or Meta. The
app must name the provider that receives the text. The app must tell the user to read the terms of
that provider.

**Why.** A promise about another company is a promise the owner cannot keep. A user needs to know
two things: what this app does, and where the text goes. The app can answer both.

**The rejected alternative.** The owner rejects a promise about retention, training or deletion at a
provider. Such a promise needs a contract that does not exist.

## 16. The opener guard fires on a pair, and stays

**Decided 2026-08-24.** The owner delegated this ruling to the agent. The guard in
`src/director.ts` stays as built. It reads the child's last two said lines. A shared opener adds
one literal ban line to the next block.

**Why.** Run C, with no guard, produced a block of six identical openers. That is the failure
that reads as broken. The guard ends such a block at three, for zero model calls. Run H shows the
mechanism fire and shows no harm and no leak.

**The rejected alternatives.** A ban on the first repeat is rejected. A ban on every turn forces
an alternation: ban A, the model picks B; ban B, it returns to A. That is the period-two rotation
that measured result 2 predicts. It also puts one fixed string into nearly every block, and a
fixed string in every block is the template risk of measured result 7. Dropping the guard is
rejected. The F against H counts show no gain at one conversation, but the guard exists for the
tail, and the tail is measured in run C.

## 17. A button ends the session, like ending a call

**Decided 2026-08-25.** The owner ruled. The end button stays, and it is the only end signal for
the MVP. The model for the surface is a voice call screen: one control that ends, one that holds.
The quiet child stays a later build. Rule 44 already says so. Case E13b stays open for that later
build.

## 18. The topic gate is required

**Decided 2026-08-25.** The owner ruled. The app must check the topic. Decision 11 is reversed on
the requirement. The design of the gate is not decided. `docs/proposals/topic-gate.md` holds two
designs and a recommendation. The owner rules on the design separately.

**Why.** Rule 19 scopes the product to a causal mechanism. Without a gate, only the curated list
enforces the scope, and the owner wants the person to bring their own topic.

## 19. One review, and the large model always runs it

**Decided 2026-08-25.** The owner ruled. The app shows one kind of review. The end phase always
runs on the provided model, the larger one. The unverified review is gone. The verified and
unverified labels are gone, because one kind of review needs no label. The child keeps running on
the startup model.

**Why.** A finding from a model that may not know the mechanism can be wrong, and a wrong finding
reaches a person as a claim about their own mind. The owner refuses that risk. One review, from
the strongest model available, or no review with a stated failure.

**The rejected alternative.** The dual label. It made the person read a trust taxonomy before
reading their own gaps.

**Open under this decision.** Two questions. First: the app holds no provided model, so does a
session start at all, or start with a warning that no review will run? Rule 46 covers the stated
failure either way. Second: the omniscient toggle loses its meaning and the code must lose it.
`docs/proposals/one-review.md` holds the removal plan and both questions.

## 20. No provided model, no session

**Decided 2026-08-27.** The owner ruled. The app refuses to start a session when it holds no
provided model. Law 1 gives the reason: a session must not end with a question open, and only the
review closes questions. A session that cannot end with a review must not begin. The refusal
screen names the fix: set the provided model.

## 21. Consent at the start screen, and a soft cap at twelve turns

**Decided 2026-08-27.** The owner ruled twice. Consent moves to the start screen: one checkbox,
one sentence that names the provider, because every session now sends text at the end. Rule 48
holds. The session gains a soft cap: at turn twelve the app shows one line that points at the End
button. The button stays the only end signal. Rule 44 holds.

## 22. A second model refutes the review before the person sees it

**Decided 2026-08-27, deferred past the MVP.** The owner asked whether the review can use
different models. The ruling: yes, as a refutation step and not as an ensemble. One provided
model runs Check. A second, different model receives each finding with one task: refute it. A
finding that survives reaches the screen. A finding that dies is dropped, silently, because
decision 19 removed the labels. A wrongly killed true finding costs a quieter review. A false
finding that survives costs a wrong claim about the person's mind. The design accepts the first
cost to avoid the second.

**The rejected alternative.** An ensemble that merges the link sets of two models. The merge
needs text comparison inside Diff, and rule 43 forbids it.

**Not in the MVP.** The step needs a second provided model and new calls. `docs/proposals/`
takes the design when the MVP ships.
