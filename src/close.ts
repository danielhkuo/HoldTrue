/**
 * Close. The last part of the end phase, and the part that satisfies Law 1.
 *
 * Close takes every row that Diff emitted. Close makes one model call for each row. Close returns
 * one Finding for each row, in the order of the rows. The count of the findings always equals the
 * count of the rows. A session must not end with a question open, so no row may lose its finding.
 *
 * Close serves M4, E3, E4, C4 and B2. It also serves rules 11, 15, 16, 17, 42 and 46.
 *
 * THE ORDER INSIDE ONE FINDING. The statement of the user comes first. The mechanism comes second.
 * The user must recognise the claim as their own before the correction arrives. This order is
 * Law 1: correct by refutation, and never by exposition.
 *
 * THE PROBED ROW. Probe asked one question about one row. The verdict carries the answer to that
 * question. A verdict with the supplied flag true means the user produced the step. Close must not
 * correct the user on that row. A verdict with the supplied flag false means the answer did not
 * give the step. Close then states the mechanism.
 *
 * EVERY OTHER ROW. Close states that the user did not say the link. Close must never state that
 * the user does not know the link. The app asked no question about that row, so the app holds no
 * evidence about the knowledge of the user. Only the probe separates the two. See rule 42 and
 * case E3.
 *
 * THE INVARIANT. A finding speaks about the explanation, and never about the person. "You said X
 * but not how Y" is the form. "Your explanation was shallow" is forbidden. See rule 6 and case E5.
 *
 * THE STATED FLAG. A row that got no statement carries the stated flag false. No model wrote that
 * text. The caller reads the flag. A list with the flag false on every row is not a review, and
 * the caller must state that no review ran. See rule 46.
 *
 * Close must not do these things:
 * - It must not throw. A model that does not answer is a result. A failed row keeps its place, and
 *   the text of that finding names the failure. See rule 23 and rule 46.
 * - It must not write a score, a rating, a grade, a mark or a count of anything. See rule 16.
 * - It must not say that an explanation was unclear. No model can source that. See rule 17.
 * - It must not judge the person.
 * - It must not read the transcript. Check already read it, and Close speaks from the report.
 * - It must not drop a row, add a row or change the order of the rows.
 *
 * WHERE THE CORRECTION COMES FROM. Every prompt carries the chain that Check returned. The model
 * writes the correction from that chain. The chain is the report of one model on one transcript,
 * and it is the only source of truth this part has.
 *
 * ONE CALL FOR EACH ROW. A single call for every row can drop a row, and a dropped row leaves a
 * question open. One call for each row cannot drop a row. The calls run one after the other. A
 * provider refuses a burst for rate, and a refused row loses its finding.
 *
 * NO PROHIBITION FILTER RUNS IN CODE. The prompt holds the prohibitions above. No code reads the
 * sentence back and judges it. There is no oracle for a sentence, so rule 33 forbids that judge. A
 * filter that rewrote a finding could also delete the correction, and Law 1 requires the correction.
 *
 * NO TEST FILE. This part has no oracle. No test can say that a finding is a good finding. Rule 33
 * and rule 34 forbid such a test. An end-to-end run against a real model is the check that applies
 * here. See rule 31.
 */

import type { ModelHandle } from './model.js'
import type { CheckResult, Claim, DiffRow, Finding, Intrusion, Link, Verdict } from './types.js'

/* ── the shape of one row for the model ──────────────────────────────────────────────────────── */

/**
 * What the probe says about one row.
 *
 * `unsaid` means that no question asked about this row. `supplied` means that the answer gave the
 * step. `missing` means that the answer did not give the step.
 */
export type Situation = 'unsaid' | 'supplied' | 'missing'

/** The fields of a link that the prompt shows. The span and the id stay out of the text. */
type Step = Pick<Link, 'id' | 'cause' | 'relation' | 'effect' | 'covered'>

/** The fields of a claim that the prompt shows. */
type Said = Pick<Claim, 'id' | 'text' | 'correct'>

/** The fields of an intrusion that the prompt shows. */
type ChildLine = Pick<Intrusion, 'id' | 'text'>

/** The report that Close reads. Close reads the checked member of a CheckResult and nothing more. */
export type Report = {
  readonly mechanism: readonly Step[]
  readonly claims: readonly Said[]
  readonly intrusions: readonly ChildLine[]
}

/* ── the renderers ───────────────────────────────────────────────────────────────────────────── */

/** One link as one line of the chain. The mark says whether the user said the step. */
const line = (step: Step, at: number): string =>
  `  ${at + 1}. ${step.covered ? 'said' : 'not said'}: ${step.cause} ${step.relation} ${step.effect}`

/** The chain, with a mark on every step. */
const renderChain = (chain: readonly Step[]): string =>
  chain.length === 0
    ? 'the chain: the report holds no chain'
    : ['the chain:', ...chain.map(line)].join('\n')

/** The statements of the user, with a mark on every statement. */
const renderClaims = (claims: readonly Said[]): string =>
  claims.length === 0
    ? 'the statements of the adult: the report holds none'
    : [
        'the statements of the adult:',
        ...claims.map((c, at) => `  ${at + 1}. ${c.correct ? 'true' : 'not true'}: ${c.text}`),
      ].join('\n')

/** The one row, by kind. The block names the kind and gives the words for that kind. */
const renderRow = (kind: DiffRow['kind'], words: string): string => {
  if (kind === 'contradiction') {
    return `the row: one statement of the adult is not true.\nthe statement: ${words}`
  }
  if (kind === 'intrusion') {
    return `the row: one line of the child supplies a cause.\nthe child line: ${words}`
  }
  return `the row: the adult did not say one step of the chain.\nthe step: ${words}`
}

/** The whole user message for one row. */
const message = (report: Report, kind: DiffRow['kind'], words: string): string =>
  `${renderChain(report.mechanism)}\n\n${renderClaims(report.claims)}\n\n${renderRow(kind, words)}`

/* ── the worked examples ─────────────────────────────────────────────────────────────────────── */

/**
 * One worked example. The renderers above build the input, so the example and the real message
 * always carry the same shape. The output holds one sentence group for each situation.
 *
 * Rule 9 asks for a worked example rather than a description. A description gives the model a
 * label, and the model fills a label from its own prior data.
 *
 * Three subjects appear below: a candle, rust and lightning. No subject here matches a topic in
 * `src/topics.ts`, an example in `src/child.ts` or the example in `src/check.ts`. A copied surface
 * is then visibly foreign, and it does not answer the user. See case B3.
 */
type Worked = {
  readonly kind: DiffRow['kind']
  readonly report: Report
  readonly words: string
  readonly out: Readonly<Record<Situation, string>>
}

const CANDLE: Worked = {
  kind: 'omission',
  report: {
    mechanism: [
      { id: 'L1', cause: 'the flame', relation: 'heats', effect: 'the wax at the top', covered: true },
      { id: 'L2', cause: 'the heat', relation: 'turns', effect: 'the wax into a gas', covered: false },
      { id: 'L3', cause: 'the burning gas', relation: 'keeps', effect: 'the flame hot', covered: false },
    ],
    claims: [{ id: 'C1', text: 'the wax at the top melts', correct: true }],
    intrusions: [],
  },
  words: 'the heat turns the wax into a gas',
  out: {
    unsaid:
      'You said the flame heats the wax at the top. You did not say what the heat turns that wax into. The heat turns the wax into a gas, and the gas is the thing that burns.',
    supplied:
      'You said the flame heats the wax at the top. Your answer to the question then gave the next step: the heat turns the wax into a gas, and the gas is the thing that burns.',
    missing:
      'You said the flame heats the wax at the top. The heat turns the wax into a gas, and the gas is the thing that burns.',
  },
}

const RUST: Worked = {
  kind: 'contradiction',
  report: {
    mechanism: [
      { id: 'L1', cause: 'the air', relation: 'reaches', effect: 'the iron surface', covered: true },
      { id: 'L2', cause: 'the water on the iron', relation: 'carries', effect: 'the oxygen to the metal', covered: false },
      { id: 'L3', cause: 'the iron', relation: 'gives', effect: 'its electrons to the oxygen', covered: false },
      { id: 'L4', cause: 'the iron oxide', relation: 'flakes off', effect: 'and shows new metal', covered: false },
    ],
    claims: [{ id: 'C1', text: 'the air alone makes the rust', correct: false }],
    intrusions: [],
  },
  words: 'the air alone makes the rust',
  out: {
    unsaid:
      'You said the air alone makes the rust. Your words did not say the water. The water on the metal carries the oxygen to the iron, and the iron then gives its electrons to that oxygen.',
    supplied:
      'You said the air alone makes the rust. Your answer to the question then gave the part that was not there: the water on the metal carries the oxygen to the iron.',
    missing:
      'You said the air alone makes the rust. The water on the metal carries the oxygen to the iron, and the iron then gives its electrons to that oxygen.',
  },
}

const LIGHTNING: Worked = {
  kind: 'intrusion',
  report: {
    mechanism: [
      { id: 'L1', cause: 'the ice pieces in the cloud', relation: 'rub', effect: 'against each other', covered: true },
      { id: 'L2', cause: 'the rubbing', relation: 'moves', effect: 'the charge to the bottom of the cloud', covered: false },
      { id: 'L3', cause: 'the charge', relation: 'grows until it tears', effect: 'a path through the air', covered: false },
    ],
    claims: [{ id: 'C1', text: 'the ice in the cloud rubs together', correct: true }],
    intrusions: [{ id: 'I1', text: 'Is it the metal in the rain that pulls the spark down?' }],
  },
  words: 'Is it the metal in the rain that pulls the spark down?',
  out: {
    unsaid:
      'The child asked whether the metal in the rain pulls the spark down. Your words did not say metal, and no metal is in this chain. The rubbing ice moves the charge to the bottom of the cloud, and that charge tears the path through the air.',
    supplied:
      'The child asked whether the metal in the rain pulls the spark down. Your answer to the question gave the real step: the rubbing ice moves the charge to the bottom of the cloud.',
    missing:
      'The child asked whether the metal in the rain pulls the spark down. The rubbing ice moves the charge to the bottom of the cloud, and that charge tears the path through the air.',
  },
}

/**
 * Two examples for one row. The example of the same kind comes last.
 *
 * Both examples show the same situation as the row. The prompt then never shows the model a
 * sentence for a situation that this row is not in.
 */
const pairFor = (kind: DiffRow['kind']): readonly [Worked, Worked] => {
  if (kind === 'contradiction') return [CANDLE, RUST]
  if (kind === 'intrusion') return [CANDLE, LIGHTNING]
  return [RUST, CANDLE]
}

/** One example as prompt text. */
const renderWorked = (w: Worked, situation: Situation): string =>
  `This is the input:\n\n${message(w.report, w.kind, w.words)}\n\nThis is the output:\n\n${w.out[situation]}`

/* ── the prompt ──────────────────────────────────────────────────────────────────────────────── */

const FRAME = `An adult explained how something works, out loud and from memory. A child listened
and asked questions. Another part then read the whole conversation. That part found the true chain,
the statements of the adult, and the child lines that supplied a cause.

You write the text for one row of that report. You write it to the adult.

Put the words of the adult first. Put the mechanism second. The adult must recognise their own
statement before the correction arrives.

Write two or three short sentences and nothing else. Write no title, no label, no list and no
quotation marks around the whole text. Write about the one row that the message names, and write
about no other row.

Take every part of the mechanism from the chain in the message. Do not add a step that the chain
does not hold.

You must not write these things:
  - a score, a rating, a grade, a mark, a percentage or a count of anything;
  - a judgement of the adult. Write about the explanation, and never about the person;
  - "your explanation was unclear", "you do not understand" or any sentence like them;
  - "you do not know" or "you did not know";
  - praise, encouragement or a summary of how the session went;
  - an analogy.`

const SITUATION: Readonly<Record<Situation, string>> = {
  unsaid: `Nobody asked the adult about this row. The adult did not say this in the conversation.
Write that the words of the adult did not say it. Never write that the adult does not know it. The
session holds no answer to that question, so that sentence has no source.`,

  supplied: `The app asked the adult one question about this row. The answer gave the step, so the
adult produced the step. Do not correct the adult here. State the words of the adult, then state
that their answer gave the step, then give the step in one clause.`,

  missing: `The app asked the adult one question about this row. The answer did not give the step.
State the words of the adult, then state the step. Write nothing about the adult. Write about the
explanation only.`,
}

/** The system message for one row. Pure, so a caller can read it without a model. */
export const systemFor = (kind: DiffRow['kind'], situation: Situation): string => {
  const [first, second] = pairFor(kind)
  return `${FRAME}

${SITUATION[situation]}

Worked example.

${renderWorked(first, situation)}

Worked example.

${renderWorked(second, situation)}

Now your row.`
}

/** The user message for one row. Pure, so a caller can read it without a model. */
export const promptFor = (report: Report, kind: DiffRow['kind'], words: string): string =>
  message(report, kind, words)

/* ── the material for one row ────────────────────────────────────────────────────────────────── */

/** The words that one row points at, or the reason that the report does not hold them. */
type Material =
  | { readonly ok: true; readonly words: string }
  | { readonly ok: false; readonly reason: string }

/**
 * The words for one row.
 *
 * A row carries an id and a kind only. This function reads the id and takes the words from the
 * report. A row that points at nothing is a stated failure, and never a throw.
 */
const materialFor = (row: DiffRow, report: Report): Material => {
  if (row.kind === 'contradiction') {
    const claim = report.claims.find(c => c.id === row.claimId)
    return claim === undefined
      ? { ok: false, reason: `The report holds no statement with the id ${row.claimId}.` }
      : { ok: true, words: claim.text }
  }
  if (row.kind === 'intrusion') {
    const intrusion = report.intrusions.find(i => i.id === row.intrusionId)
    return intrusion === undefined
      ? { ok: false, reason: `The report holds no child line with the id ${row.intrusionId}.` }
      : { ok: true, words: intrusion.text }
  }
  const link = report.mechanism.find(l => l.id === row.linkId)
  return link === undefined
    ? { ok: false, reason: `The report holds no step with the id ${row.linkId}.` }
    : { ok: true, words: `${link.cause} ${link.relation} ${link.effect}` }
}

/* ── the answer of the model ─────────────────────────────────────────────────────────────────── */

/**
 * The statement, from the raw answer of the model.
 *
 * A model wraps a sentence in a fence, in quotation marks or in a bullet. This function removes
 * that wrapper and joins the lines into one paragraph. It changes no word. It judges no word.
 * Rule 10 covers the words of the user, and this text holds the words of a model.
 */
const tidy = (raw: string): string => {
  const lines = raw
    .split('\n')
    .filter(l => !/^\s*```/.test(l))
    .map(l => l.trim().replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, ''))
    .filter(l => l !== '')
  const joined = lines.join(' ').trim()
  const unlabelled = joined.replace(/^(finding|statement|output|answer|text)\s*:\s*/i, '')
  const unquoted = /^"[^"]*"$/.test(unlabelled) ? unlabelled.slice(1, -1) : unlabelled
  return unquoted.trim()
}

/**
 * A row that got no statement. The text names the failure, and the row keeps its place.
 *
 * The stated flag is false. No model wrote this text. The caller reads the flag and refuses to
 * label a list of these rows as a review. A screen that prints them as findings claims that the
 * model wrote a finding it never wrote.
 */
const failure = (row: DiffRow, reason: string): Finding => ({
  row,
  text: `This row has no statement. ${reason}`,
  stated: false,
})

/* ── the part ────────────────────────────────────────────────────────────────────────────────── */

/**
 * The Close step. One model call for each row, and one Finding for each row.
 *
 * The verdict names one row. That row is the probed row, and Close uses the verdict there. Every
 * other row gets the `unsaid` situation. The caller owns the verdict. Close reads the verdict of
 * the check result when the caller passes null, because both come from the same probe.
 *
 * The findings come back in the order of the rows. Close never throws.
 */
export const close = async (
  rows: readonly DiffRow[],
  c: CheckResult,
  verdict: Verdict | null,
  model: ModelHandle,
): Promise<readonly Finding[]> => {
  if (c.kind === 'failed') {
    return rows.map(row => failure(row, `The check step failed. The reason is: ${c.reason}.`))
  }

  const report: Report = { mechanism: c.mechanism, claims: c.claims, intrusions: c.intrusions }
  const probed = verdict ?? c.verdict

  const findings: Finding[] = []
  for (const row of rows) {
    const material = materialFor(row, report)
    if (!material.ok) {
      findings.push(failure(row, material.reason))
      continue
    }

    // Only the probe separates "did not say it" from "does not know it". A row with no verdict
    // therefore takes the `unsaid` situation, whatever the kind of the row. Rule 42.
    const situation: Situation =
      probed !== null && probed.rowId === row.id ? (probed.supplied ? 'supplied' : 'missing') : 'unsaid'

    const answer = await model.ask(
      systemFor(row.kind, situation),
      promptFor(report, row.kind, material.words),
    )
    if (answer === null) {
      // The model layer holds the reason for the last failed ask. Close passes that reason
      // through, so a dead backend, a rejected key and a wrong model name keep distinct
      // messages. Rule 25.
      const reason = model.lastReason?.() ?? null
      findings.push(
        failure(row, reason === null ? 'The model did not answer.' : `The model did not answer. The reason is: ${reason}.`),
      )
      continue
    }

    const text = tidy(answer)
    findings.push(text === '' ? failure(row, 'The model returned no statement.') : { row, text })
  }

  return findings
}
