/**
 * Supply: one debt, checked against model knowledge.
 *
 * The child asserted something your graph does not hold. `tallyIntroduced` wrote it down. This
 * asks the model whether it is sound and gets back the sentence that closes it. One debt per call.
 *
 * **This is Supply as re-scoped on 2026-08-12, and it is much smaller than `docs/specs/supply.md`
 * describes.** That file was written on 2026-08-07 for a piece that hunted gaps in an understanding
 * with no ground truth. It no longer does that: it is handed specific propositions and checks each
 * one. Its banner says so, and says the code wins where the two disagree.
 *
 * **Ruling 7 is spent, not answered — decided 2026-08-16 by a three-voice council.** It asked
 * whether Supply and Contradict are one piece or two, and said not to build either until it was
 * ruled. The re-scope dissolved the question: it compared a gap-hunter against a
 * contradiction-finder, and the gap-hunter no longer exists. What is built here settles claims the
 * **child** made. Contradict's subject is the **user's** own explanation, its input carries anchors
 * and this one carries none, so they are two pieces about two speakers rather than two views of one
 * list.
 *
 * **The argument that decided it, because it is the one worth keeping.** The council's strongest
 * point against merging was that Supply's only mechanical check — *no finding names a link already
 * present in the explanation* — inverts its sign for a contradiction, which by definition names a
 * link that IS present. Merged, that guard can only be applied behind a discriminator the model
 * chooses, which hands the model the switch for its own guard rail and lets a mislabelled finding
 * escape silently in the Law 1 direction. Here it cannot happen: `tally.ts`'s `alreadyYours` has
 * already run the comparison in arithmetic, which is the whole reason the row is a debt. The guard
 * sits upstream of the model and the model never touches it.
 *
 * WHAT NOBODY MEASURES, stated here rather than in prose somewhere else. There is no eval for this,
 * by a recorded decision in `docs/decisions.md` — *the eval for the model-knowledge finding is
 * skipped, and the skip is recorded as a decision rather than left as an absence*. So a `Verdict`
 * is the model's account and not a fact, no number describes how often it is right, and the only
 * signal that it works is the owner reading it. `calibration` is `'uncalibrated'` on every result
 * because that is the honest word and the type will not let it be omitted.
 *
 * TWO THINGS THAT WOULD TRIP `AGENTS.md`'s LLM-judge ban, which this does not:
 *   - Aggregating verdicts into a rate. *Nine of twelve sound* is a model grading output and a
 *     figure beside a diagnosis at once — the ban plus invariant 7.
 *   - Scoring `settle` with a second model. The ban is narrowed to scoring contexts, and that is
 *     one. The pressure to reach for it went up when the eval was skipped; it did not loosen.
 */

import type { Attribution, ModelHandle } from './model.js'
import type { Debt } from './tally.js'

/**
 * The model's answer about one proposition. An account, never a fact.
 *
 * `unsound` is a contradiction of something the **child** said, which is not the same finding as
 * contradicting the user and does not make this Contradict — see the header.
 */
export type Verdict =
  | { readonly kind: 'sound'; readonly closing: string }
  | { readonly kind: 'unsound'; readonly closing: string }
  | { readonly kind: 'unsettled'; readonly reason: string }

/** One debt, checked. `debt` is copied by identity and never reworded. */
export type Settled = {
  readonly debt: Debt
  readonly verdict: Verdict
  readonly attribution: Attribution
}

/**
 * Two worked examples rather than a description of a voice, because that is the one prompt change
 * this repo has measured: describing a role let the model fill the label from its own prior, and
 * only examples moved it. See the child's prompt row in `docs/decisions.md`.
 *
 * The examples sit on a foreign topic so a copied surface is visibly off-topic.
 */
const SYSTEM = `A learner is explaining how something works to a child. The child said something the learner never said. Decide whether the child's statement is true of the mechanism, and write one sentence a teacher could say next.

RULES:
1. Judge the mechanism, never the person. Never say "you" and never say the learner is right or wrong.
2. verdict is "sound" if the statement is true of the mechanism, "unsound" if it is not.
3. closing is ONE sentence. If sound, say what makes it true and add the part the statement leaves out. If unsound, say what is actually the case.
4. Never merely restate the statement back. A sentence that adds nothing has closed nothing.
5. If you do not know, answer with verdict "unsettled" and say why in one short phrase.

EXAMPLE
topic: how a bicycle brake stops the wheel
statement: the pads rubbing the rim causes the rim to get cold
{"verdict":"unsound","closing":"The rubbing turns the wheel's motion into heat, so the rim gets hotter rather than colder, and that heat then leaves into the air."}

EXAMPLE
topic: how a bicycle brake stops the wheel
statement: squeezing the lever causes the pads to touch the rim
{"verdict":"sound","closing":"The lever pulls a cable that draws the two arms together, and that is what presses the pads onto the rim."}

Answer with JSON: {"verdict":"sound"|"unsound"|"unsettled","closing":"..."}`

const SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['sound', 'unsound', 'unsettled'] },
    closing: { type: 'string' },
  },
  required: ['verdict', 'closing'],
} as const

/**
 * Read the model's answer, tolerating everything the runner actually does.
 *
 * `model.ts` records five probes showing this backend ignores `format` entirely, so a schema buys
 * nothing and the payload is parsed as though none was sent. A fenced block is stripped because a
 * chat model wraps JSON in one whatever you ask.
 *
 * Anything that does not yield a verdict AND a non-empty sentence is `unsettled`. There is no
 * degraded mode where a verdict arrives without the sentence that closes it — invariant 5 says a
 * feature may not end on a finding, and a verdict with an empty `closing` is exactly that.
 */
const readVerdict = (raw: string | null): Verdict => {
  if (raw === null) return { kind: 'unsettled', reason: 'the model did not answer' }

  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(raw)
  const text = (fenced?.[1] ?? raw).trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { kind: 'unsettled', reason: 'the answer was not JSON' }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { kind: 'unsettled', reason: 'the answer was not an object' }
  }

  const { verdict, closing } = parsed as { verdict?: unknown; closing?: unknown }
  const sentence = typeof closing === 'string' ? closing.trim() : ''

  if (verdict === 'unsettled') {
    return { kind: 'unsettled', reason: sentence === '' ? 'the model declined to say' : sentence }
  }
  if (verdict !== 'sound' && verdict !== 'unsound') {
    return { kind: 'unsettled', reason: 'the answer named no verdict' }
  }
  if (sentence === '') return { kind: 'unsettled', reason: 'the answer closed nothing' }

  return { kind: verdict, closing: sentence }
}

/**
 * Settle one debt. Total: an unreachable model, junk, or a missing sentence is `unsettled`, never
 * a throw.
 *
 * **Every debt returns exactly one `Settled`, including one nothing could settle.** The older spec
 * said an unclosable finding is dropped, and that answer inverts here: there, Supply minted the
 * finding, so dropping it cost nothing; here the row already exists in the ledger, and dropping it
 * is silence about something the child introduced — the direction `tally.ts` names as the Law 1
 * failure. `unsettled` obliges the caller to leave the row open.
 *
 * `topic` is required and is not decoration. A debt carries the child's words verbatim, and the
 * child speaks in ellipsis — a row reading *it empties → the toilet fills up* has no referent for
 * *it*, and a model handed that alone resolves it to whatever is convenient.
 *
 * Stateless on purpose. `child-speech.md` ruling 4 says one closure does not retire an item, and
 * the transcript that refuted the alternative shows a child reproducing a corrected error ten turns
 * later. Handing the same debt twice must produce two results, so there is no cache and no dedup.
 */
export async function settle(debt: Debt, topic: string, model: ModelHandle): Promise<Settled> {
  const attribution = await model.identify()
  const user = `topic: ${topic}\nstatement: ${debt.cause} ${debt.relation} ${debt.effect}`
  const raw = await model.ask(SYSTEM, user, SCHEMA)
  return { debt, verdict: readVerdict(raw), attribution }
}
