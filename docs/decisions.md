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

**Nothing in the end phase exists.** The live phase runs. `src/` holds these files:

- `child.ts`
- `model.ts`
- `server.ts`
- `topics.ts`
- `rig.ts`
- `page.html`
- `child.test.ts`

The app does not have these parts:

- the toggle
- the marked transcript
- the topic gate
- Check
- Diff
- Probe
- Close

Every decision below is a design. No decision below is a description of running code.

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

**Decided.** The owner curates the topic list. The free-text box carries a warning. No part of the app
checks the text the user types.

**Why.** The eligibility rule is real. `docs/product.md` holds its figures. A check needs a
classifier that nobody designed. A warning is honest. A silent pass is not.

**The rejected alternative.** The owner rejects removing the free-text box, which serves the user.

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

This file is the only place the build order lives. The owner built nothing in this list.

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

1. **The privacy terms.** Decision 13 requires a disclosure and a consent. It does not answer these
   questions:
   - How long does a provider keep your text?
   - May a provider train on your text?
   - How does a user delete the text?
2. **The end signal design.** Decision 10 ships a button. The owner must decide whether a quiet child
   ever ends a session, and what rule makes the child quiet.
3. **The topic gate.** Decision 11 ships a warning. The owner must decide whether the app checks the
   free-text box, and what a failed check does to the session.
4. **Is the end phase worth running with the toggle off?** A small startup model runs Check. This
   model may not hold ground truth about the mechanism. An unverified finding may be worse than no finding.
