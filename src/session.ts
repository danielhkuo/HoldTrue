/**
 * Session. This part holds one session, and it runs the end phase.
 *
 * The part owns three things. It owns the marked transcript. It owns the omniscient toggle for
 * this session. It owns the two halves of the end phase.
 *
 * The end phase runs five steps in order. It runs Check, then Diff, then Probe, then Check again,
 * then Close. `openEnd` runs the first three steps. The app then asks the user one question.
 * `closeEnd` runs the last two steps. Probe takes the first row and no other row. Rule 41 sets
 * that choice. The second Check gives the verdict for the probed row. This part reads nothing
 * else from it. Diff and Close read the rows of the first Check, so the rows cannot change under
 * the user.
 *
 * The caller picks the model. Rule 20, rule 21 and rule 45 set the choice.
 * The toggle on picks the provided model, and the review carries the verified flag true.
 * The toggle off picks the startup model, and the review carries the verified flag false.
 * This part never puts the startup model in place of the provided model.
 *
 * A failed end phase returns the unavailable review. It never returns an empty findings list.
 * An empty list reads as "nothing was wrong", and that sentence is the worst output of this
 * product. Case C4 and rule 46 set this behaviour.
 *
 * A Check that returns no chain returns the unavailable review. An empty chain is no evidence.
 * The app cannot tell "no gap exists" from "Check produced nothing", so the app must not print
 * the first sentence. Case C4 sets this.
 *
 * A Close that writes no statement for any row returns the unavailable review. No model wrote
 * that list, so the app must not label it a review. Rule 46 sets this.
 *
 * The cases: M2, M4, E3, E4, B13 and C4. The rules: 11, 20, 21, 41, 42, 45 and 46.
 *
 * The live phase must call addTurn, and it must call nothing else in this file.
 * This part must not run the end phase during the live phase.
 * This part must not throw. A model that does not answer is a result. Rule 23 holds here.
 * This part must not read the text of a turn. It must not judge an explanation.
 * This part must not show a score, a rating or a grade. It must not write to disk.
 */

import { check } from './check.js'
import { close } from './close.js'
import { diff } from './diff.js'
import type { ModelHandle } from './model.js'
import { firstRow, probe } from './probe.js'
import type { CheckResult, DiffRow, Finding, Review, Speaker, Turn, Verdict } from './types.js'

/**
 * One session. The turns hold the marked transcript. The toggle holds the choice of the user.
 * The review holds the output of the end phase, and it is null until the end phase runs.
 */
export type Session = {
  turns: Turn[]
  omniscient: boolean
  topic: string
  review: Review | null
}

/** A new session. The transcript is empty, and no review exists yet. */
export const startSession = (topic: string, omniscient: boolean): Session => ({
  turns: [],
  omniscient,
  topic,
  review: null,
})

/**
 * One turn on the end of the transcript. The caller gives the speaker mark.
 *
 * This code never infers the mark from the text. The text goes in untouched, because rule 10
 * holds and because Close later quotes the user to the user. The function returns a new session,
 * and it changes no value of the old session.
 */
export const addTurn = (session: Session, speaker: Speaker, text: string): Session => ({
  ...session,
  turns: [...session.turns, { speaker, text, index: session.turns.length }],
})

/* ── the end phase ───────────────────────────────────────────────────────────────────────────── */

/** The probe that waits for an answer. The row id and the question stay fixed. Rule 41. */
export type Pending = {
  readonly checked: CheckResult
  readonly rows: readonly DiffRow[]
  readonly question: string
  readonly rowId: string
}

/** The review that states a failure. The app then says that the questions stay open. Rule 46. */
export const unavailable = (reason: string): Review => ({ kind: 'unavailable', reason })

/**
 * The role of the model that the toggle picked.
 * The reason must name the failing role, because rule 45 forbids a silent swap.
 * A role is not an attribution. A failed call produced no attribution. Rule 24.
 */
const role = (omniscient: boolean): string =>
  omniscient ? 'The provided model' : 'The startup model'

/**
 * One review from the findings of Close, or one stated failure.
 *
 * A finding with the stated flag false carries no words of a model. Close writes that text itself
 * when a row got no statement. A list of such rows is not a review. The screen would print the
 * label "the model wrote the findings below", and no model wrote them. The app therefore states
 * that no review ran, and it states that the questions stay open. Rule 46.
 */
const reviewOf = (findings: readonly Finding[], omniscient: boolean): Review => {
  const stated = findings.some(finding => finding.stated !== false)
  if (stated || findings.length === 0) {
    return { kind: 'reviewed', findings, verified: omniscient }
  }
  const first = findings[0]?.text ?? ''
  return unavailable(
    `${role(omniscient)} wrote no statement for any of the ${findings.length} rows. ${first}`.trim(),
  )
}

/**
 * The first half of the end phase. It runs Check, then Diff, then Probe.
 *
 * The function returns a review when the phase can finish here. It returns a pending probe when
 * the user must answer one question. Probe takes the first row and no other row. Rule 41.
 * A failed Probe is not a failed review. Close then runs on every row with no verdict, and Close
 * states that the user did not say the link. Rule 42.
 */
export const openEnd = async (
  live: Session,
  model: ModelHandle,
): Promise<{ readonly review: Review } | { readonly pending: Pending }> => {
  const omniscient = live.omniscient
  const first = await check(live.turns, model)
  if (first.kind === 'failed') {
    return {
      review: unavailable(`${role(omniscient)} failed the Check step. The reason: ${first.reason}.`),
    }
  }

  // An empty chain is a Check that produced nothing. Diff then emits no row, and the screen would
  // print "the review found nothing wrong". The app cannot tell that sentence from "Check gave no
  // chain", so the app must not print it. Case C4.
  if (first.mechanism.length === 0) {
    return {
      review: unavailable(
        `${role(omniscient)} returned no chain for this session. The review has no evidence.`,
      ),
    }
  }

  const rows = diff(first)
  const head = firstRow(rows)
  if (head === null) {
    // Check gave a chain, and Diff found no row. No question stays open, so this empty list is
    // honest. The check above already refused the case where Check gave nothing at all.
    return { review: { kind: 'reviewed', findings: [], verified: omniscient } }
  }

  const asked = await probe(head, first, live.turns, model)
  if (asked.kind === 'failed') {
    const findings = await close(rows, first, null, model)
    return { review: reviewOf(findings, omniscient) }
  }

  return { pending: { checked: first, rows, question: asked.question, rowId: head.id } }
}

/**
 * The second half of the end phase. It runs Check again, then Close.
 *
 * The row id comes from the caller, so no model can point a verdict at another row. An answer that
 * is null gives no verdict, and Close then states that the user did not say the link. Rule 42.
 * Close runs for every row, so no question stays open. Rule 11.
 */
export const closeEnd = async (
  live: Session,
  model: ModelHandle,
  wait: Pending,
  answer: string | null,
): Promise<Review> => {
  let verdict: Verdict | null = null
  if (answer !== null) {
    const again = await check(live.turns, model, {
      question: wait.question,
      answer,
      rowId: wait.rowId,
    })
    verdict = again.kind === 'checked' ? again.verdict : null
  }
  const findings = await close(wait.rows, wait.checked, verdict, model)
  return reviewOf(findings, live.omniscient)
}
