/**
 * Probe. The third part of the end phase, and the only part that asks the user a question.
 *
 * Probe takes one Diff row. Probe returns one question for the user. The user answers.
 * The app then sends that answer to Check, and Check returns the verdict for the row.
 *
 * WHY THIS PART EXISTS. Check reads words. Check sees that the user did not SAY a step.
 * Check cannot see whether the user KNOWS the step. Only a question separates the two.
 * Rule 14 makes this part required. Probe serves M2, M4, E3 and C4.
 *
 * Probe runs one time in a session. Probe takes the first row of the Diff output. Rule 41 sets
 * this. Do not write "the largest gap". That phrase has no definition. Use `firstRow` below.
 *
 * PROBE MUST NOT SUPPLY THE ANSWER. Probe asks. Close answers. Three things hold that line:
 *   1. The prompt never receives the missing cause. The code sends the effect only. A model
 *      cannot leak a string that the prompt does not hold.
 *   2. The code keeps one question sentence and drops every other sentence. A statement cannot
 *      survive this cut, so the part cannot return a correction.
 *   3. The code rejects a question that names the cause and the relation of the missing link.
 *      A model can guess the cause from the subject. This guard catches that guess.
 *
 * Probe must not name the child. The aim always comes from the words of the user. Probe never
 * sends a child line as the aim. A question about an invented part accepts that the part exists.
 * That fault is case E2b and case E9. The transcript still holds the child lines, and the prompt
 * forbids their words. No code enforces that last point. Treat it as the weak guard here.
 *
 * Probe must not throw. A model that does not answer is a result. Rule 23 sets this. Probe
 * returns the failed member, and each distinct cause gets a distinct reason. Rule 25 sets this.
 * A failed probe is a stated failure. Close then runs on every row with no verdict.
 *
 * Probe must not judge the explanation. Probe must not say that a step is missing. Probe must not
 * say that the user is wrong. Probe must not say that the explanation was unclear. Rule 17 blocks
 * the last one, because no model can source a judgement with no ground truth.
 *
 * NO TEST FILE. This part has no oracle. No test can say that a question is the right question.
 * Rule 33 and rule 34 forbid such a test. `systemFor`, `promptFor` and `firstRow` are pure, so a
 * reader can inspect them without a model. An end-to-end run against a real service is the check
 * that applies here. Rule 31 sets that check.
 */

import type { ModelHandle } from './model.js'
import type { CheckResult, DiffRow, Turn } from './types.js'

/** What Probe returns. The asked member carries the question. The failed member carries a reason. */
export type Asked =
  | { readonly kind: 'asked'; readonly question: string }
  | { readonly kind: 'failed'; readonly reason: string }

/**
 * The row that Probe takes. It is the first row, and it is never another row.
 *
 * The caller uses this function to name the target. The name then carries rule 41 with it.
 * An empty list gives null, and the caller runs no probe.
 */
export const firstRow = (rows: readonly DiffRow[]): DiffRow | null => rows[0] ?? null

/* ── the aim ─────────────────────────────────────────────────────────────────────────────────── */

/**
 * The aim names one thing in the explanation. The question then asks what makes that thing happen.
 *
 * The three row kinds give three sources, and all three come from the user:
 *   - a contradiction gives the statement of the user;
 *   - an intrusion gives the user words that the child line answered;
 *   - an omission gives the effect of the missing link, and never the cause or the relation.
 *
 * The omission case is the reason this function exists. Diff points at a link. The link holds the
 * whole missing step. This code takes the effect and drops the rest, so the prompt never holds
 * the answer.
 */
type Aim = { readonly ok: true; readonly text: string } | { readonly ok: false; readonly reason: string }

const userTurns = (turns: readonly Turn[]): readonly Turn[] => turns.filter(t => t.speaker === 'user')

/** The user words before a child line. The child line itself never reaches the prompt as the aim. */
const beforeChild = (turns: readonly Turn[], at: number): string | null => {
  const said = userTurns(turns)
  const earlier = said.filter(t => t.index < at)
  const pick = earlier[earlier.length - 1] ?? said[0]
  return pick === undefined ? null : pick.text
}

const aimFor = (row: DiffRow, c: CheckResult, turns: readonly Turn[]): Aim => {
  if (c.kind === 'failed') return { ok: false, reason: 'the check result holds no report' }

  if (row.kind === 'contradiction') {
    const claim = c.claims.find(x => x.id === row.claimId)
    if (claim === undefined) return { ok: false, reason: 'the row names a claim that Check did not return' }
    return { ok: true, text: claim.text }
  }

  if (row.kind === 'intrusion') {
    const intrusion = c.intrusions.find(x => x.id === row.intrusionId)
    if (intrusion === undefined) {
      return { ok: false, reason: 'the row names an intrusion that Check did not return' }
    }
    const words = beforeChild(turns, intrusion.turnIndex)
    if (words === null) return { ok: false, reason: 'the transcript holds no user words' }
    return { ok: true, text: words }
  }

  const link = c.mechanism.find(x => x.id === row.linkId)
  if (link === undefined) return { ok: false, reason: 'the row names a link that Check did not return' }
  return { ok: true, text: link.effect }
}

/* ── the prompt ──────────────────────────────────────────────────────────────────────────────── */

/**
 * The worked example. One transcript, two aims, and the exact line each aim produces.
 *
 * Rule 9 asks for a worked example rather than a description. A description hands the model a
 * label, and the model fills a label from its own prior data. `src/child.ts` records that result.
 *
 * The subject is a candle. Rule B3 forbids a subject that `src/topics.ts` also holds. The child
 * prompt and the Check prompt already use a wing, a tide, a battery, a gut, a hurricane, a leaf,
 * a crankshaft, a river and a hot air balloon.
 */
const EXAMPLE = `[0] adult: you light the wick and the flame melts the wax right at the top
[1] child: Where does the melted wax go.
[2] adult: it climbs up the wick and then it burns

aim: the wax climbs up the wick
question: What makes the wax climb up the wick instead of running back down?

aim: the melted wax turns into a gas
question: What makes the melted wax turn into a gas?`

/** The system message. Pure, so a reader can inspect it without a model. */
export const systemFor = (): string =>
  `You read a transcript of one conversation. An adult explained how something works, from memory.
A child listened. Every line carries a mark and a number.

You then read one aim. The aim names one thing in the explanation.

Write ONE question for the adult. Write one sentence. End the sentence with a question mark.
Write nothing before it and nothing after it.

Worked example:

${EXAMPLE}

The rules for your question:

  Ask the adult what makes the thing in the aim happen.
  Ask for a cause. Never ask what a word means.
  Give no cause yourself. The adult gives the cause.
  Use the words of the adult where you can.
  Never use the words of a line marked child. The child invents things.
  Never say that the adult is wrong.
  Never say that a step is missing.
  Never say anything about the quality of the explanation.
  Never ask a question that the adult can answer with yes or no.

Now your transcript.`

/** The user message. The marked transcript, then the aim. */
export const promptFor = (turns: readonly Turn[], aim: string): string => {
  const script = turns
    .map(t => `[${t.index}] ${t.speaker === 'user' ? 'adult' : 'child'}: ${t.text}`)
    .join('\n')
  return `${script}\n\naim: ${aim}`
}

/* ── the cut and the guard ───────────────────────────────────────────────────────────────────── */

/**
 * The first question sentence in the answer, or null.
 *
 * A sentence ends at a full stop, a question mark or an exclamation mark. The code keeps the first
 * sentence that ends with a question mark. It drops every other sentence. A model that adds the
 * answer as a second sentence therefore loses that sentence. This cut is the second guard on
 * "Probe must not supply the answer". A statement cannot pass it.
 */
const questionFrom = (raw: string): string | null => {
  const flat = raw.replace(/```[a-z]*/gi, '').replace(/```/g, '')
  for (const sentence of flat.match(/[^.!?]+[.!?]*/g) ?? []) {
    const one = sentence
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(question|q)\s*:\s*/i, '')
      .replace(/^["'‘“]+/, '')
      .trim()
    if (one.endsWith('?')) return one
  }
  return null
}

/**
 * The words that carry no cause. The guard drops them from the question and from the link.
 *
 * A model drops one article and the run match then fails. "the compression raises" and
 * "compression raises" name one step. The guard must reject both. Every word here is four letters
 * or fewer, so the cut below leaves each one whole.
 */
const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'it', 'its', 'that', 'this'])

/**
 * The words of a string, cut to the first four letters of each word, without the stop words.
 *
 * The cut takes a verb in any form to one token. "raise", "raises" and "raising" all give "rais".
 * A leak guard needs this. A model writes "raise" where the link holds "raises", and a whole word
 * test then misses the leak. The cut also joins two different words, so the guard tests the
 * position of a match as well.
 *
 * The stop words go out. A run match reads the words in order, and one dropped article breaks the
 * run. The guard then passes a question that states the missing step.
 */
const stems = (s: string): readonly string[] =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w !== '')
    .map(w => w.slice(0, 4))
    .filter(w => !STOP.has(w))

/** Every start position where the first list holds the second list as a run. */
const runsOf = (hay: readonly string[], needle: readonly string[]): readonly number[] => {
  if (needle.length === 0 || needle.length > hay.length) return []
  const at: number[] = []
  for (let i = 0; i + needle.length <= hay.length; i += 1) {
    if (needle.every((w, j) => hay[i + j] === w)) at.push(i)
  }
  return at
}

/**
 * True when the question gave the missing step away.
 *
 * The guard applies to an omission row only. There the answer is the missing link, and this code
 * holds that link. A question that names the cause and the relation states the step. The effect is
 * the aim, so the question may name the effect.
 *
 * The two matches must not overlap. A cause and a relation often share a stem, as "the
 * compressor" shares one with "compresses". One word then answers for both, and the guard would
 * reject a question that names the cause alone. That question is a good question.
 *
 * The guard rejects, and Probe then returns a stated failure. Close runs with no verdict. That
 * cost is smaller than the cost of a question that hands the user the answer. Nobody has measured
 * the rate of either result.
 */
const leaks = (question: string, row: DiffRow, c: CheckResult): boolean => {
  if (row.kind !== 'omission' || c.kind === 'failed') return false
  const link = c.mechanism.find(x => x.id === row.linkId)
  if (link === undefined) return false
  const asked = stems(question)
  const cause = stems(link.cause)
  const relation = stems(link.relation)
  const here = runsOf(asked, cause)
  const there = runsOf(asked, relation)
  return here.some(a => there.some(b => a + cause.length <= b || b + relation.length <= a))
}

/* ── the part ────────────────────────────────────────────────────────────────────────────────── */

const failed = (reason: string): Asked => ({ kind: 'failed', reason })

/**
 * One model call. One question, or one stated failure.
 *
 * The caller pairs the question with `row.id` and sends both to Check. Check then returns the
 * verdict for that row. This part holds no verdict and writes no finding.
 */
export const probe = async (
  row: DiffRow,
  c: CheckResult,
  turns: readonly Turn[],
  model: ModelHandle,
): Promise<Asked> => {
  if (turns.length === 0) return failed('the transcript holds no turns')

  const aim = aimFor(row, c, turns)
  if (!aim.ok) return failed(aim.reason)
  if (aim.text.trim() === '') return failed('the row points at empty words')

  const answer = await model.ask(systemFor(), promptFor(turns, aim.text))
  // The model layer holds the reason for the last failed ask. Probe passes that reason through,
  // so a dead backend, a rejected key and a wrong model name each keep a distinct message.
  if (answer === null) return failed(model.lastReason?.() ?? 'the model did not answer')

  const question = questionFrom(answer)
  if (question === null) return failed('the model did not return a question')
  if (leaks(question, row, c)) return failed('the question gave the missing step away')

  return { kind: 'asked', question }
}
