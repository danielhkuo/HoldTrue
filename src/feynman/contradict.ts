/**
 * Contradict: one link YOU stated, checked against model knowledge.
 *
 * Step 4 of the review in `../features/feynman.md`, and the piece that was missing. Supply settles
 * what the CHILD introduced. This settles what you said. Different speaker, different input type,
 * and — the part that makes it a separate piece rather than a flag on Supply — a different output,
 * because this one has to mint a probe.
 *
 * **Why the probe lives here and not in Supply.** `supply.md` ruling 3 asked who mints it, and for
 * Supply the question is spent: the child already asked, so the probe exists before Supply runs.
 * Nothing asks on your behalf about your own claim, so if this piece does not mint one, step 6 —
 * *answer one probe aimed at the gap* — has no subject.
 *
 * **The ordering is Law 1's and it is enforced by the shape of this result, not by a convention.**
 * `philosophy.md` and step 7 require *correct by refutation, not by exposition*: your claim first,
 * then the probe, and only then the correction. So `probe` and `correction` come back together and
 * the caller is expected to withhold the second until the person has answered the first. A caller
 * that renders both at once has turned a refutation into a lecture, which is the failure the
 * ordering exists to prevent.
 *
 * **This takes your own words, with anchors.** `Link` carries `cause`, `effect` and `sentence`
 * anchors, all validated as literal substrings by `validate`, so a finding here can quote you and
 * the quote resolves. That is the concrete difference from `supply.ts`, whose input is three bare
 * strings the child said and which therefore can never quote anybody.
 *
 * WHAT NOBODY MEASURES. `decisions.md` skipped the eval for the model-knowledge finding, and
 * `decisions.md` also leaves open whether that skip reaches Contradict — it is deliberately
 * unassumed in both directions. Nothing here resolves that. So every result names the model and
 * says `uncalibrated`, and a `contradicted` verdict is the model's account rather than a fact.
 *
 * **Being wrong here is the most expensive failure in the product.** A false Supply verdict
 * mis-settles something a child made up. A false verdict here tells a person that a thing they
 * understand correctly is wrong, which is the falsehood-teaching failure the whole design is built
 * to avoid. That is why `unsettled` is the default on any doubt and why rule 6 below is phrased
 * the way it is.
 */

import type { Attribution, ModelHandle } from './model.js'
import type { Link } from './validate.js'

/**
 * What the mechanism says about one thing you stated.
 *
 * `probe` rides with `correction` deliberately — see the ordering note in the header. `holds`
 * carries no probe, because there is nothing to correct and Law 1 asks nothing of a caller who
 * has nothing to open.
 */
export type Standing =
  | { readonly kind: 'holds'; readonly note: string }
  | { readonly kind: 'contradicted'; readonly probe: string; readonly correction: string }
  | { readonly kind: 'unsettled'; readonly reason: string }

/** One of your links, checked. `link` is passed through by identity, anchors intact. */
export type Checked = {
  readonly link: Link
  readonly standing: Standing
  readonly attribution: Attribution
}

/**
 * Worked examples, not a description — the one prompt change this repo has measured twice. The
 * examples sit on foreign topics so a copied surface is visibly off-topic.
 *
 * Rule 1 is invariant 6, quoted: *"Findings are phrased at the task, never the person."* A
 * correction that says *you are wrong* is banned by the constitution, not by taste.
 *
 * Rule 6 sets the default to `unsettled`, which is the opposite of what a fluent model wants to do.
 * The asymmetry is stated in the header: a wrong contradiction teaches a falsehood.
 */
const SYSTEM = `A learner is explaining how something works, out loud, from memory. They stated one cause-and-effect step. Decide whether the mechanism actually works that way.

RULES:
1. Talk about the mechanism, never about the person. Never write "you", never write "your", never say anyone is right or wrong.
2. verdict is "holds" if the step is true of the mechanism, "contradicted" if the mechanism works otherwise.
3. If it holds, note is ONE sentence adding the part the step leaves out. Never just restate the step.
4. If it is contradicted, write TWO things. probe is ONE question that makes someone look again at the step, and it must not give the answer away. correction is ONE sentence saying what actually happens.
5. A difference of wording is not a contradiction. Only the mechanism working otherwise is.
6. If there is any doubt at all, answer "unsettled" and say why in a short phrase. Saying a correct step is wrong is the worst thing you can do here.

EXAMPLE
topic: how a bicycle brake stops the wheel
step: the pads rubbing the rim causes the rim to get cold
{"verdict":"contradicted","probe":"Where does the wheel's motion go when the pads grab hold of it?","correction":"The rubbing turns that motion into heat, so the rim warms up and then sheds that heat into the air."}

EXAMPLE
topic: how a bicycle brake stops the wheel
step: squeezing the lever causes the pads to touch the rim
{"verdict":"holds","note":"The lever pulls a cable that draws the two arms together, which is what presses the pads onto the rim."}

EXAMPLE
topic: how bread rises
step: the oven heat causes the crumb to set
{"verdict":"unsettled","reason":"depends what is meant by set"}

Answer with JSON: {"verdict":"holds"|"contradicted"|"unsettled","note":"...","probe":"...","correction":"...","reason":"..."}`

const SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['holds', 'contradicted', 'unsettled'] },
    note: { type: 'string' },
    probe: { type: 'string' },
    correction: { type: 'string' },
    reason: { type: 'string' },
  },
  required: ['verdict'],
} as const

/**
 * Read the answer, tolerating everything this runner does — `model.ts` records five probes showing
 * it ignores `format` entirely, so the payload is parsed as though no schema was sent.
 *
 * **A `contradicted` verdict missing either half degrades to `unsettled`, never to a bare
 * correction.** Invariant 5 wants the answer supplied, and step 7 wants the probe first; a
 * correction with no probe is an exposition, which is the shape Law 1 rejects.
 */
const readStanding = (raw: string | null): Standing => {
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

  const o = parsed as Record<string, unknown>
  const str = (k: string): string => (typeof o[k] === 'string' ? (o[k] as string).trim() : '')

  if (o['verdict'] === 'holds') {
    const note = str('note')
    return note === '' ? { kind: 'unsettled', reason: 'the answer added nothing' } : { kind: 'holds', note }
  }

  if (o['verdict'] === 'contradicted') {
    const probe = str('probe')
    const correction = str('correction')
    if (probe === '' || correction === '') {
      return { kind: 'unsettled', reason: 'a contradiction arrived without both a probe and an answer' }
    }
    return { kind: 'contradicted', probe, correction }
  }

  const reason = str('reason')
  return { kind: 'unsettled', reason: reason === '' ? 'the model declined to say' : reason }
}

/**
 * Check one link. Total: an unreachable model, junk, or a half-formed contradiction is
 * `unsettled`, never a throw.
 *
 * `topic` is required for the same reason it is in `supply.ts` — a link reading *it goes over the
 * top causes it pulls the rest along* has no referent for either pronoun on its own.
 *
 * Stateless, and one link per call. `child-speech.md` ruling on reading one thing at a time
 * applies with more force here: a model handed a whole graph and asked what is wrong with it will
 * find something wrong with it.
 */
export async function contradict(link: Link, topic: string, model: ModelHandle): Promise<Checked> {
  const attribution = await model.identify()
  const step = `${link.cause.quote} ${link.relation} ${link.effect.quote}`
  const raw = await model.ask(SYSTEM, `topic: ${topic}\nstep: ${step}`, SCHEMA)
  return { link, standing: readStanding(raw), attribution }
}
